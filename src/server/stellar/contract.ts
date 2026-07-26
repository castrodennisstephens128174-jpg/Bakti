import {
  Account,
  Address,
  Contract,
  Keypair,
  nativeToScVal,
  rpc,
  scValToNative,
  Transaction,
  TransactionBuilder,
  type xdr,
} from '@stellar/stellar-sdk';
import { toStroops } from '@/server/lib/amount';
import { AppError } from '@/server/lib/http';
import { contractIds, getNetworkPassphrase, network } from './network';

/**
 * Bakti allowance-escrow contract glue.
 *
 * The browser only ever *signs*. Every Soroban RPC round-trip (simulate / submit
 * / poll) runs here on the server:
 *
 *   create: buildCreateScheduleXdr() -> sender signs -> submitSorobanSigned()  (escrow the run)
 *   send:   buildReleaseXdr()        -> caller signs -> submitSorobanSigned()  (release one month)
 *
 * XLM allowances flow through the contract; USDC stays on the classic path.
 */

const INCLUSION_FEE = '2000000';
const FIRST_DUE_LEDGER_LAG = 0;

function server(): rpc.Server {
  const url = network.rpcUrl;
  return new rpc.Server(url, { allowHttp: url.startsWith('http://') });
}

function baktiContract(): Contract {
  if (!contractIds.bakti) {
    throw new AppError('INTERNAL', 'Bakti escrow contract id is not configured.', 500);
  }
  return new Contract(contractIds.bakti);
}

export const BAKTI_CONTRACT_ID = contractIds.bakti;

type ExpectedContractArg =
  | { type: 'address'; value: string }
  | { type: 'i128'; value: bigint }
  | { type: 'u32'; value?: number }
  | { type: 'u64'; value: bigint };

type ContractInvocationIntent = {
  source: string;
  contractId: string;
  method: string;
  args: ExpectedContractArg[];
};

function invalidSignedIntent(message: string): never {
  throw new AppError('INVALID_INPUT', message, 400);
}

function scValMatches(actual: xdr.ScVal, expected: ExpectedContractArg): boolean {
  const switchName = actual.switch().name;
  if (switchName !== `scv${expected.type[0].toUpperCase()}${expected.type.slice(1)}`) return false;

  let native: unknown;
  try {
    native = scValToNative(actual);
  } catch {
    return false;
  }

  if (expected.type === 'address') return native === expected.value;
  if (expected.type === 'i128' || expected.type === 'u64') return native === expected.value;
  if (!Number.isInteger(native) || Number(native) < 0 || Number(native) > 0xffff_ffff) return false;
  return expected.value === undefined || native === expected.value;
}

/**
 * Decode a signed Soroban transaction and bind it to a server-owned contract
 * intent before RPC submission. The source account signature is checked against
 * the configured network passphrase, then the single contract invocation and
 * each typed argument are matched exactly.
 */
export function validateSignedContractInvocation(
  signedXdr: string,
  intent: ContractInvocationIntent,
): Transaction {
  let decoded: ReturnType<typeof TransactionBuilder.fromXDR>;
  try {
    decoded = TransactionBuilder.fromXDR(signedXdr, getNetworkPassphrase());
  } catch {
    invalidSignedIntent('Signed transaction could not be decoded.');
  }
  if (!(decoded instanceof Transaction)) {
    invalidSignedIntent('Signed transaction must be a standard Soroban transaction.');
  }
  const tx = decoded as Transaction;

  if (tx.source !== intent.source) {
    invalidSignedIntent('Signed transaction source does not match the authenticated wallet.');
  }

  const sourceKey = Keypair.fromPublicKey(intent.source);
  const sourceHint = sourceKey.signatureHint();
  const txHash = tx.hash();
  const hasValidSourceSignature = tx.signatures.some(
    (signature) =>
      signature.hint().equals(sourceHint) && sourceKey.verify(txHash, signature.signature()),
  );
  if (!hasValidSourceSignature) {
    invalidSignedIntent('Signed transaction is missing a valid source signature.');
  }

  if (tx.operations.length !== 1) {
    invalidSignedIntent('Signed transaction must contain exactly one contract invocation.');
  }
  const operation = tx.operations[0];
  if (operation.type !== 'invokeHostFunction') {
    invalidSignedIntent('Signed transaction must contain exactly one contract invocation.');
  }
  if (operation.source && operation.source !== intent.source) {
    invalidSignedIntent('Contract invocation source does not match the authenticated wallet.');
  }
  if (operation.func.switch().name !== 'hostFunctionTypeInvokeContract') {
    invalidSignedIntent('Signed transaction must invoke the configured Bakti contract.');
  }

  const invocation = operation.func.invokeContract();
  if (Address.fromScAddress(invocation.contractAddress()).toString() !== intent.contractId) {
    invalidSignedIntent('Signed transaction targets a different contract.');
  }
  if (invocation.functionName().toString() !== intent.method) {
    invalidSignedIntent(`Signed transaction must invoke ${intent.method}.`);
  }

  const args = invocation.args();
  if (args.length !== intent.args.length) {
    invalidSignedIntent(`Signed ${intent.method} arguments do not match the requested action.`);
  }
  for (let index = 0; index < args.length; index++) {
    if (!scValMatches(args[index], intent.args[index])) {
      invalidSignedIntent(`Signed ${intent.method} arguments do not match the requested action.`);
    }
  }

  return tx;
}

export function validateSignedCreateSchedule(
  signedXdr: string,
  params: { sender: string; recipient: string; monthlyAmountStroops: bigint; months: number },
): Transaction {
  return validateSignedContractInvocation(signedXdr, {
    source: params.sender,
    contractId: contractIds.bakti,
    method: 'create_schedule',
    args: [
      { type: 'address', value: params.sender },
      { type: 'address', value: params.recipient },
      { type: 'i128', value: params.monthlyAmountStroops },
      { type: 'u32', value: params.months },
      { type: 'u32' },
    ],
  });
}

export function validateSignedRelease(
  signedXdr: string,
  params: { caller: string; scheduleId: string },
): Transaction {
  let scheduleId: bigint;
  try {
    scheduleId = BigInt(params.scheduleId);
  } catch {
    invalidSignedIntent('Stored escrow schedule id is invalid.');
  }
  return validateSignedContractInvocation(signedXdr, {
    source: params.caller,
    contractId: contractIds.bakti,
    method: 'release',
    args: [
      { type: 'u64', value: scheduleId },
      { type: 'address', value: params.caller },
    ],
  });
}

const accountLocks = new Map<string, Promise<unknown>>();

function withAccountLock<T>(account: string, fn: () => Promise<T>): Promise<T> {
  const prev = accountLocks.get(account) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  accountLocks.set(
    account,
    next.then(
      () => undefined,
      () => undefined,
    ),
  );
  return next;
}

async function assembleForSigning(source: string, op: xdr.Operation): Promise<string> {
  return withAccountLock(source, async () => {
    const srv = server();
    const account = await srv.getAccount(source);
    const tx = new TransactionBuilder(account, {
      fee: INCLUSION_FEE,
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(op)
      .setTimeout(180)
      .build();

    let sim = await srv.simulateTransaction(tx);
    for (let i = 0; i < 4 && rpc.Api.isSimulationError(sim); i++) {
      await sleep(1500);
      sim = await srv.simulateTransaction(tx);
    }
    if (rpc.Api.isSimulationError(sim)) {
      throw new AppError('INVALID_INPUT', `Simulation failed: ${sim.error}`, 400);
    }
    return rpc.assembleTransaction(tx, sim).build().toXDR();
  });
}

/** Latest closed ledger sequence — the base for a schedule's first_due_ledger. */
export async function currentLedger(): Promise<number> {
  const latest = await server().getLatestLedger();
  return latest.sequence;
}

/**
 * Build an UNSIGNED, simulation-assembled `create_schedule` invoke for the
 * sender to sign. Escrows `monthlyAmount * months` from the sender into the
 * contract. `firstDueLedger` defaults to the current ledger so the first period
 * is immediately releasable in a demo.
 */
export async function buildCreateScheduleXdr(params: {
  sender: string;
  recipient: string;
  monthlyAmount: string;
  months: number;
  firstDueLedger?: number;
}): Promise<{ xdr: string; firstDueLedger: number }> {
  if (!Address.fromString(params.sender)) {
    throw new AppError('INVALID_INPUT', 'Invalid sender address.', 400);
  }
  const firstDueLedger = params.firstDueLedger ?? (await currentLedger()) + FIRST_DUE_LEDGER_LAG;

  const op = baktiContract().call(
    'create_schedule',
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    nativeToScVal(toStroops(params.monthlyAmount), { type: 'i128' }),
    nativeToScVal(params.months, { type: 'u32' }),
    nativeToScVal(firstDueLedger, { type: 'u32' }),
  );

  const xdrStr = await assembleForSigning(params.sender, op);
  return { xdr: xdrStr, firstDueLedger };
}

/**
 * Build an UNSIGNED `release` invoke. Permissionless keeper pattern: `caller`
 * signs and pays the network fee, but the contract pays the recipient recorded
 * at create time from its own escrow.
 */
export async function buildReleaseXdr(params: {
  caller: string;
  scheduleId: string;
}): Promise<string> {
  if (!Address.fromString(params.caller)) {
    throw new AppError('INVALID_INPUT', 'Invalid caller address.', 400);
  }
  const op = baktiContract().call(
    'release',
    nativeToScVal(BigInt(params.scheduleId), { type: 'u64' }),
    new Address(params.caller).toScVal(),
  );
  return assembleForSigning(params.caller, op);
}

/** Submit a validated Soroban invoke, poll until it lands, and return hash + return value. */
export async function submitSorobanSigned(
  tx: Transaction,
): Promise<{ hash: string; returnValue: xdr.ScVal | undefined }> {
  const source = tx.source;
  return withAccountLock(source, async () => {
    const srv = server();
    let sent = await srv.sendTransaction(tx);
    if (sent.status === 'TRY_AGAIN_LATER') {
      throw new AppError('TX_RETRY', 'Network busy — please retry.', 409);
    }
    if (sent.status === 'ERROR') {
      const code = errorResultCode(sent.errorResult);
      if (code === 'txBadSeq' || code === 'txTooLate') {
        throw new AppError('TX_RETRY', 'Sequence moved — rebuilding the transaction.', 409);
      }
      throw new AppError('CONFLICT', `Transaction rejected${code ? `: ${code}` : ''}.`, 409);
    }
    const hash = sent.hash;
    for (let i = 0; i < 28; i++) {
      const got = await srv.getTransaction(hash);
      if (got.status === 'SUCCESS') {
        return { hash, returnValue: got.returnValue };
      }
      if (got.status === 'FAILED') {
        throw new AppError('CONFLICT', `Transaction ${hash} failed on-chain.`, 409);
      }
      if (i > 0 && i % 3 === 0) {
        sent = await srv.sendTransaction(tx).catch(() => sent);
      }
      await sleep(1500);
    }
    throw new AppError('INTERNAL', `Timed out waiting for ${hash}.`, 504);
  });
}

/** Submit a signed `create_schedule` and return the tx hash + the new schedule_id. */
export async function submitCreateSchedule(
  tx: Transaction,
): Promise<{ hash: string; scheduleId: string }> {
  const { hash, returnValue } = await submitSorobanSigned(tx);
  if (!returnValue) {
    throw new AppError('INTERNAL', 'create_schedule returned no schedule id.', 502);
  }
  const id = scValToNative(returnValue) as bigint | number;
  return { hash, scheduleId: BigInt(id).toString() };
}

function errorResultCode(errorResult: unknown): string {
  try {
    const r = errorResult as { result?: () => { switch: () => { name: string } } };
    return r?.result?.().switch().name ?? '';
  } catch {
    return '';
  }
}

function readSource(): Account {
  return new Account(contractIds.admin, '0');
}

async function simulateNative<T>(method: string, ...args: xdr.ScVal[]): Promise<T> {
  const op = baktiContract().call(method, ...args);
  const tx = new TransactionBuilder(readSource(), {
    fee: INCLUSION_FEE,
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(op)
    .setTimeout(60)
    .build();
  const sim = await server().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new AppError('INTERNAL', `Read ${method} failed: ${sim.error}`, 502);
  }
  const retval = sim.result?.retval;
  if (!retval) throw new AppError('INTERNAL', `Read ${method} returned nothing.`, 502);
  return scValToNative(retval) as T;
}

export type ScheduleStatus = {
  monthlyAmountStroops: string;
  months: number;
  periodsReleased: number;
  nextDueLedger: number;
};

/** Read a schedule's running state from the contract (no signature). */
export async function readScheduleStatus(scheduleId: string): Promise<ScheduleStatus> {
  const idScv = nativeToScVal(BigInt(scheduleId), { type: 'u64' });
  const [monthly, months, released, nextDue] = await simulateNative<
    [bigint, number, number, number]
  >('schedule_status', idScv);
  return {
    monthlyAmountStroops: BigInt(monthly).toString(),
    months: Number(months),
    periodsReleased: Number(released),
    nextDueLedger: Number(nextDue),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

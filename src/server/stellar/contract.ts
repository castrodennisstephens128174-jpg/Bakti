import {
  Account,
  Address,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  type Transaction,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { toStroops } from '@/server/lib/amount';
import { AppError } from '@/server/lib/http';
import type { BaktiNetworkConfig } from '@/shared/network-config';
import { activeNetwork, contractIds } from './network';

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

function server(cfg: BaktiNetworkConfig): rpc.Server {
  const url = cfg.rpcUrl;
  return new rpc.Server(url, { allowHttp: url.startsWith('http://') });
}

function baktiContract(cfg: BaktiNetworkConfig, overrideId?: string | null): Contract {
  const id = overrideId || cfg.contractId;
  if (!id) {
    throw new AppError('INTERNAL', 'Bakti escrow contract id is not configured.', 500);
  }
  return new Contract(id);
}

export const BAKTI_CONTRACT_ID = contractIds.bakti;

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

async function assembleForSigning(
  cfg: BaktiNetworkConfig,
  source: string,
  op: xdr.Operation,
): Promise<string> {
  return withAccountLock(source, async () => {
    const srv = server(cfg);
    let account: Awaited<ReturnType<typeof srv.getAccount>>;
    try {
      account = await srv.getAccount(source);
    } catch {
      throw new AppError(
        'INVALID_INPUT',
        `Your wallet has no XLM on this network yet. On testnet, fund it first: https://friendbot.stellar.org/?addr=${source}`,
        400,
      );
    }
    const tx = new TransactionBuilder(account, {
      fee: INCLUSION_FEE,
      networkPassphrase: cfg.passphrase,
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
      if (/balance|underfunded|trustline/i.test(sim.error)) {
        throw new AppError(
          'INVALID_INPUT',
          'Not enough balance to escrow the whole run (monthly × months + fees). Top up and try again.',
          400,
        );
      }
      throw new AppError('INVALID_INPUT', `Simulation failed: ${sim.error}`, 400);
    }
    return rpc.assembleTransaction(tx, sim).build().toXDR();
  });
}

/** Latest closed ledger sequence — the base for a schedule's first_due_ledger. */
export async function currentLedger(cfg?: BaktiNetworkConfig): Promise<number> {
  const net = cfg ?? (await activeNetwork());
  const latest = await server(net).getLatestLedger();
  return latest.sequence;
}

/**
 * Build an UNSIGNED, simulation-assembled `create_schedule` invoke for the
 * sender to sign. Escrows `monthlyAmount * months` from the sender into the
 * contract. `firstDueLedger` defaults to the current ledger so the first period
 * is immediately releasable in a demo.
 */
export async function buildCreateScheduleXdr(
  params: {
    sender: string;
    recipient: string;
    monthlyAmount: string;
    months: number;
    firstDueLedger?: number;
  },
  cfg?: BaktiNetworkConfig,
): Promise<{ xdr: string; firstDueLedger: number }> {
  const net = cfg ?? (await activeNetwork());
  if (!Address.fromString(params.sender)) {
    throw new AppError('INVALID_INPUT', 'Invalid sender address.', 400);
  }
  const firstDueLedger =
    params.firstDueLedger ?? (await currentLedger(net)) + FIRST_DUE_LEDGER_LAG;

  const op = baktiContract(net).call(
    'create_schedule',
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    nativeToScVal(toStroops(params.monthlyAmount), { type: 'i128' }),
    nativeToScVal(params.months, { type: 'u32' }),
    nativeToScVal(firstDueLedger, { type: 'u32' }),
  );

  const xdrStr = await assembleForSigning(net, params.sender, op);
  return { xdr: xdrStr, firstDueLedger };
}

/**
 * Build an UNSIGNED `release` invoke. Permissionless keeper pattern: `caller`
 * signs and pays the network fee, but the contract pays the recipient recorded
 * at create time from its own escrow.
 */
export async function buildReleaseXdr(
  params: {
    caller: string;
    scheduleId: string;
    /** SEP-31 settlement memo — required by contract v2, absent on legacy v1 schedules. */
    memo?: string;
    /** Pin to the contract the schedule lives on (allowance.contractId); defaults to the network preset. */
    contractId?: string | null;
  },
  cfg?: BaktiNetworkConfig,
): Promise<string> {
  const net = cfg ?? (await activeNetwork());
  if (!Address.fromString(params.caller)) {
    throw new AppError('INVALID_INPUT', 'Invalid caller address.', 400);
  }
  const args = [
    nativeToScVal(BigInt(params.scheduleId), { type: 'u64' }),
    new Address(params.caller).toScVal(),
  ];
  if (params.memo !== undefined) {
    args.push(nativeToScVal(params.memo, { type: 'string' }));
  }
  const op = baktiContract(net, params.contractId).call('release', ...args);
  return assembleForSigning(net, params.caller, op);
}

/** Submit a signed Soroban invoke, poll until it lands, and return hash + return value. */
export async function submitSorobanSigned(
  signedXdr: string,
  cfg?: BaktiNetworkConfig,
): Promise<{ hash: string; returnValue: xdr.ScVal | undefined }> {
  const net = cfg ?? (await activeNetwork());
  let tx: Transaction;
  try {
    tx = TransactionBuilder.fromXDR(signedXdr, net.passphrase) as Transaction;
  } catch {
    throw new AppError('INVALID_INPUT', 'Signed transaction could not be decoded.', 400);
  }
  const source = tx.source;
  return withAccountLock(source, async () => {
    const srv = server(net);
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
  signedXdr: string,
  cfg?: BaktiNetworkConfig,
): Promise<{ hash: string; scheduleId: string }> {
  const { hash, returnValue } = await submitSorobanSigned(signedXdr, cfg);
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

async function simulateNative<T>(
  cfg: BaktiNetworkConfig,
  method: string,
  ...args: xdr.ScVal[]
): Promise<T> {
  const op = baktiContract(cfg).call(method, ...args);
  const tx = new TransactionBuilder(readSource(), {
    fee: INCLUSION_FEE,
    networkPassphrase: cfg.passphrase,
  })
    .addOperation(op)
    .setTimeout(60)
    .build();
  const sim = await server(cfg).simulateTransaction(tx);
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
export async function readScheduleStatus(
  scheduleId: string,
  cfg?: BaktiNetworkConfig,
): Promise<ScheduleStatus> {
  const net = cfg ?? (await activeNetwork());
  const idScv = nativeToScVal(BigInt(scheduleId), { type: 'u64' });
  const [monthly, months, released, nextDue] = await simulateNative<[bigint, number, number, number]>(
    net,
    'schedule_status',
    idScv,
  );
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

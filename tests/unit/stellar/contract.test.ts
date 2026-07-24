// @vitest-environment node
import {
  Account,
  Address,
  Asset,
  Contract,
  Keypair,
  nativeToScVal,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { validateSignedCreateSchedule, validateSignedRelease } from '@/server/stellar/contract';
import { contractIds, getNetworkPassphrase } from '@/server/stellar/network';

const MONTHLY_STROOPS = 250_000_000n;
let keyId = 1;

function keypair(): Keypair {
  return Keypair.fromRawEd25519Seed(Buffer.alloc(32, keyId++));
}

function signedTransaction(
  source: Keypair,
  operations: Parameters<TransactionBuilder['addOperation']>[0][],
): string {
  let builder = new TransactionBuilder(new Account(source.publicKey(), '0'), {
    fee: '100',
    networkPassphrase: getNetworkPassphrase(),
  });
  for (const operation of operations) builder = builder.addOperation(operation);
  const tx = builder.setTimeout(0).build();
  tx.sign(source);
  return tx.toXDR();
}

function createScheduleOperation(params: {
  sender: string;
  recipient: string;
  monthlyAmountStroops?: bigint;
  months?: number;
  firstDue?: ReturnType<typeof nativeToScVal>;
  contractId?: string;
  method?: string;
}) {
  return new Contract(params.contractId ?? contractIds.bakti).call(
    params.method ?? 'create_schedule',
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    nativeToScVal(params.monthlyAmountStroops ?? MONTHLY_STROOPS, { type: 'i128' }),
    nativeToScVal(params.months ?? 3, { type: 'u32' }),
    params.firstDue ?? nativeToScVal(123, { type: 'u32' }),
  );
}

function releaseOperation(params: {
  caller: string;
  scheduleId?: bigint;
  contractId?: string;
  method?: string;
}) {
  return new Contract(params.contractId ?? contractIds.bakti).call(
    params.method ?? 'release',
    nativeToScVal(params.scheduleId ?? 7n, { type: 'u64' }),
    new Address(params.caller).toScVal(),
  );
}

describe('validateSignedCreateSchedule', () => {
  it('returns INVALID_INPUT for malformed XDR', () => {
    const sender = keypair();
    const recipient = keypair();
    try {
      validateSignedCreateSchedule('not-xdr', {
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
        monthlyAmountStroops: MONTHLY_STROOPS,
        months: 3,
      });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toMatchObject({ code: 'INVALID_INPUT', status: 400 });
    }
  });

  it('accepts a locally signed matching create_schedule intent', () => {
    const sender = keypair();
    const recipient = keypair();
    const xdr = signedTransaction(sender, [
      createScheduleOperation({
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
      }),
    ]);

    expect(() =>
      validateSignedCreateSchedule(xdr, {
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
        monthlyAmountStroops: MONTHLY_STROOPS,
        months: 3,
      }),
    ).not.toThrow();
  });

  it('requires a valid signature from the authenticated source', () => {
    const sender = keypair();
    const recipient = keypair();
    const tx = new TransactionBuilder(new Account(sender.publicKey(), '0'), {
      fee: '100',
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        createScheduleOperation({
          sender: sender.publicKey(),
          recipient: recipient.publicKey(),
        }),
      )
      .setTimeout(0)
      .build();

    expect(() =>
      validateSignedCreateSchedule(tx.toXDR(), {
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
        monthlyAmountStroops: MONTHLY_STROOPS,
        months: 3,
      }),
    ).toThrow(/valid source signature/i);
  });

  it('rejects a transaction from a different source', () => {
    const sender = keypair();
    const otherSource = keypair();
    const recipient = keypair();
    const xdr = signedTransaction(otherSource, [
      createScheduleOperation({
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
      }),
    ]);

    expect(() =>
      validateSignedCreateSchedule(xdr, {
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
        monthlyAmountStroops: MONTHLY_STROOPS,
        months: 3,
      }),
    ).toThrow(/source does not match/i);
  });

  it('rejects multiple operations and non-contract operations', () => {
    const sender = keypair();
    const recipient = keypair();
    const create = createScheduleOperation({
      sender: sender.publicKey(),
      recipient: recipient.publicKey(),
    });
    const payment = Operation.payment({
      destination: recipient.publicKey(),
      asset: Asset.native(),
      amount: '1',
    });

    for (const operations of [[create, create], [payment]]) {
      const xdr = signedTransaction(sender, operations);
      expect(() =>
        validateSignedCreateSchedule(xdr, {
          sender: sender.publicKey(),
          recipient: recipient.publicKey(),
          monthlyAmountStroops: MONTHLY_STROOPS,
          months: 3,
        }),
      ).toThrow(/exactly one contract invocation/i);
    }
  });

  it.each([
    ['contract', /different contract/i],
    ['method', /create_schedule/i],
    ['sender argument', /arguments do not match/i],
    ['recipient argument', /arguments do not match/i],
    ['monthly amount', /arguments do not match/i],
    ['months', /arguments do not match/i],
    ['first due ledger type', /arguments do not match/i],
  ])('rejects a mismatched %s', (mismatch, message) => {
    const sender = keypair();
    const recipient = keypair();
    const wrongAddress = keypair().publicKey();
    const otherContract = StrKey.encodeContract(keypair().rawPublicKey());
    const params = {
      sender: mismatch === 'sender argument' ? wrongAddress : sender.publicKey(),
      recipient: mismatch === 'recipient argument' ? wrongAddress : recipient.publicKey(),
      monthlyAmountStroops: mismatch === 'monthly amount' ? MONTHLY_STROOPS + 1n : MONTHLY_STROOPS,
      months: mismatch === 'months' ? 4 : 3,
      firstDue:
        mismatch === 'first due ledger type'
          ? nativeToScVal(-1, { type: 'i32' })
          : nativeToScVal(123, { type: 'u32' }),
      contractId: mismatch === 'contract' ? otherContract : contractIds.bakti,
      method: mismatch === 'method' ? 'release' : 'create_schedule',
    };
    const xdr = signedTransaction(sender, [createScheduleOperation(params)]);

    expect(() =>
      validateSignedCreateSchedule(xdr, {
        sender: sender.publicKey(),
        recipient: recipient.publicKey(),
        monthlyAmountStroops: MONTHLY_STROOPS,
        months: 3,
      }),
    ).toThrow(message);
  });
});

describe('validateSignedRelease', () => {
  it('accepts a matching release and rejects schedule or caller changes', () => {
    const caller = keypair();
    const validXdr = signedTransaction(caller, [releaseOperation({ caller: caller.publicKey() })]);
    expect(() =>
      validateSignedRelease(validXdr, { caller: caller.publicKey(), scheduleId: '7' }),
    ).not.toThrow();

    const wrongSchedule = signedTransaction(caller, [
      releaseOperation({ caller: caller.publicKey(), scheduleId: 8n }),
    ]);
    expect(() =>
      validateSignedRelease(wrongSchedule, { caller: caller.publicKey(), scheduleId: '7' }),
    ).toThrow(/arguments do not match/i);

    const wrongCaller = signedTransaction(caller, [
      releaseOperation({ caller: keypair().publicKey() }),
    ]);
    expect(() =>
      validateSignedRelease(wrongCaller, { caller: caller.publicKey(), scheduleId: '7' }),
    ).toThrow(/arguments do not match/i);
  });
});

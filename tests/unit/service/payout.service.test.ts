import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db/repos/allowance.repo', () => ({
  allowanceRepo: { findOwned: vi.fn() },
}));
vi.mock('@/server/db/repos/payout.repo', () => ({
  payoutRepo: {
    insert: vi.fn(),
    findByTxHash: vi.fn(),
    findScheduledForPeriod: vi.fn(),
    findOwned: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
  },
}));
vi.mock('@/server/stellar', () => ({
  buildReleaseXdr: vi.fn(),
  submitSorobanSigned: vi.fn(),
  validateSignedRelease: vi.fn(),
}));
vi.mock('@/server/stellar/horizon', () => ({
  verifyAllowancePayment: vi.fn(),
}));

import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import { currentPeriod, nextPayoutStatus, payoutService } from '@/server/service/payout.service';
import { buildReleaseXdr, submitSorobanSigned, validateSignedRelease } from '@/server/stellar';
import { verifyAllowancePayment } from '@/server/stellar/horizon';

const OWNER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const TX = 'a'.repeat(64);

function fakeAllowance(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    publicKey: OWNER,
    recipientAddress: 'GBU7GVNT52X7VNTG63RE23NE7CE344SNHVONEW4KANS4LY6ZP3KMDOL2',
    corridor: 'Malaysia → Philippines · research corridor',
    asset: 'XLM',
    monthlyAmount: '25',
    status: 'active',
    scheduleId: '7',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('nextPayoutStatus — future provider transitions remain guarded', () => {
  it('allows valid transitions', () => {
    expect(nextPayoutStatus('scheduled', 'send')).toBe('sent');
    expect(nextPayoutStatus('sent', 'settle')).toBe('settled');
    expect(nextPayoutStatus('settled', 'collect')).toBe('collected');
    expect(nextPayoutStatus('scheduled', 'fail')).toBe('failed');
    expect(nextPayoutStatus('sent', 'fail')).toBe('failed');
  });

  it('throws on invalid or backwards transitions', () => {
    expect(() => nextPayoutStatus('sent', 'send')).toThrow(/cannot send/i);
    expect(() => nextPayoutStatus('scheduled', 'settle')).toThrow(/cannot settle/i);
    expect(() => nextPayoutStatus('scheduled', 'collect')).toThrow(/cannot collect/i);
    expect(() => nextPayoutStatus('settled', 'settle')).toThrow(/cannot settle/i);
    expect(() => nextPayoutStatus('collected', 'collect')).toThrow(/cannot collect/i);
    expect(() => nextPayoutStatus('collected', 'fail')).toThrow(/cannot fail/i);
    expect(() => nextPayoutStatus('failed', 'send')).toThrow(/cannot send/i);
    expect(() => nextPayoutStatus('settled', 'fail')).toThrow(/cannot fail/i);
  });
});

describe('currentPeriod', () => {
  it('formats a date as YYYY-MM (UTC)', () => {
    expect(currentPeriod(new Date('2026-07-11T10:00:00Z'))).toBe('2026-07');
    expect(currentPeriod(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01');
  });
});

describe('payoutService.ensureScheduled', () => {
  it('returns the existing scheduled payout when present', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findScheduledForPeriod).mockResolvedValue({ id: 'p1' } as never);
    const p = await payoutService.ensureScheduled('a1', OWNER);
    expect(p).toMatchObject({ id: 'p1' });
    expect(payoutRepo.insert).not.toHaveBeenCalled();
  });

  it('creates a scheduled record when none exists', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findScheduledForPeriod).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.insert).mockResolvedValue({ id: 'new' } as never);
    const p = await payoutService.ensureScheduled('a1', OWNER);
    expect(p).toMatchObject({ id: 'new' });
    expect(payoutRepo.insert).toHaveBeenCalledOnce();
  });

  it('throws NOT_FOUND for an unknown allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(payoutService.ensureScheduled('x', OWNER)).rejects.toThrow(/not found/i);
  });
});

describe('payoutService.recordPayment', () => {
  it('verifies on-chain and stops at sent without a provider reference', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.findScheduledForPeriod).mockResolvedValue({
      id: 'p1',
      status: 'scheduled',
      period: currentPeriod(),
    } as never);
    vi.mocked(verifyAllowancePayment).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.update).mockResolvedValue({
      id: 'p1',
      status: 'sent',
      txHash: TX,
      pickupRef: null,
    } as never);

    const result = await payoutService.recordPayment('a1', OWNER, { txHash: TX });

    expect(verifyAllowancePayment).toHaveBeenCalledWith({
      txHash: TX,
      asset: 'XLM',
      from: OWNER,
      to: fakeAllowance().recipientAddress,
      amount: '25',
    });
    expect(payoutRepo.update).toHaveBeenCalledOnce();
    expect(payoutRepo.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ status: 'sent', txHash: TX, pickupRef: null }),
    );
    expect(result).toMatchObject({ status: 'sent', pickupRef: null });
  });

  it('rejects a duplicate transaction hash', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue({ id: 'dup' } as never);
    await expect(payoutService.recordPayment('a1', OWNER, { txHash: TX })).rejects.toThrow(
      /already recorded/i,
    );
    expect(verifyAllowancePayment).not.toHaveBeenCalled();
  });

  it.each([
    ['paused', /paused/i],
    ['ended', /ended/i],
  ])('refuses to pay a %s allowance', async (status, message) => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance({ status }) as never);
    await expect(payoutService.recordPayment('a1', OWNER, { txHash: TX })).rejects.toThrow(message);
    expect(verifyAllowancePayment).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND for an unknown allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(payoutService.recordPayment('x', OWNER, { txHash: TX })).rejects.toThrow(
      /not found/i,
    );
  });

  it('propagates an on-chain verification failure', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue(undefined as never);
    vi.mocked(verifyAllowancePayment).mockRejectedValue(new Error('not found on-chain'));
    await expect(payoutService.recordPayment('a1', OWNER, { txHash: TX })).rejects.toThrow(
      /on-chain/i,
    );
  });
});

describe('payoutService contract release', () => {
  it('builds a release only for an active contract-backed allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(buildReleaseXdr).mockResolvedValue('unsigned-xdr');

    await expect(payoutService.buildRelease('a1', OWNER)).resolves.toEqual({ xdr: 'unsigned-xdr' });
    expect(buildReleaseXdr).toHaveBeenCalledWith({ caller: OWNER, scheduleId: '7' });
  });

  it.each(['paused', 'ended'])('rejects buildRelease while allowance is %s', async (status) => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance({ status }) as never);
    await expect(payoutService.buildRelease('a1', OWNER)).rejects.toThrow(
      status === 'paused' ? /paused/i : /ended/i,
    );
    expect(buildReleaseXdr).not.toHaveBeenCalled();
  });

  it('records an RPC-confirmed release as sent without a provider reference', async () => {
    const validatedTx = { source: OWNER } as never;
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(validateSignedRelease).mockReturnValue(validatedTx);
    vi.mocked(submitSorobanSigned).mockResolvedValue({ hash: TX, returnValue: undefined });
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.findScheduledForPeriod).mockResolvedValue({
      id: 'p1',
      status: 'scheduled',
      period: currentPeriod(),
    } as never);
    vi.mocked(payoutRepo.update).mockResolvedValue({
      id: 'p1',
      status: 'sent',
      txHash: TX,
      pickupRef: null,
    } as never);

    const result = await payoutService.recordRelease('a1', OWNER, { signedXdr: 'signed-xdr' });

    expect(validateSignedRelease).toHaveBeenCalledWith('signed-xdr', {
      caller: OWNER,
      scheduleId: '7',
    });
    expect(submitSorobanSigned).toHaveBeenCalledWith(validatedTx);
    expect(payoutRepo.update).toHaveBeenCalledOnce();
    expect(payoutRepo.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ status: 'sent', txHash: TX, pickupRef: null }),
    );
    expect(result).toMatchObject({ status: 'sent', pickupRef: null });
  });

  it('rejects a mismatched signed release before RPC submission', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(validateSignedRelease).mockImplementation(() => {
      throw new Error('intent mismatch');
    });

    await expect(
      payoutService.recordRelease('a1', OWNER, { signedXdr: 'signed-xdr' }),
    ).rejects.toThrow(/intent mismatch/i);
    expect(submitSorobanSigned).not.toHaveBeenCalled();
  });

  it.each(['paused', 'ended'])('rejects recordRelease while allowance is %s', async (status) => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance({ status }) as never);
    await expect(
      payoutService.recordRelease('a1', OWNER, { signedXdr: 'signed-xdr' }),
    ).rejects.toThrow(status === 'paused' ? /paused/i : /ended/i);
    expect(submitSorobanSigned).not.toHaveBeenCalled();
  });
});

describe('payoutService.markCollected', () => {
  it('clearly rejects manual collection without a provider connection', async () => {
    vi.mocked(payoutRepo.findOwned).mockResolvedValue({ id: 'p1', status: 'settled' } as never);
    await expect(payoutService.markCollected('p1', OWNER)).rejects.toThrow(
      /cannot be confirmed manually/i,
    );
    expect(payoutRepo.setStatus).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND for an unknown payout', async () => {
    vi.mocked(payoutRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(payoutService.markCollected('x', OWNER)).rejects.toThrow(/not found/i);
  });
});

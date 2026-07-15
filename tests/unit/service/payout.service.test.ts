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
vi.mock('@/server/stellar/horizon', () => ({
  verifyAllowancePayment: vi.fn(),
}));

import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import {
  currentPeriod,
  makePickupRef,
  nextPayoutStatus,
  payoutService,
} from '@/server/service/payout.service';
import { verifyAllowancePayment } from '@/server/stellar/horizon';

const OWNER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const TX = 'a'.repeat(64);

function fakeAllowance(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    publicKey: OWNER,
    recipientAddress: 'GBU7GVNT52X7VNTG63RE23NE7CE344SNHVONEW4KANS4LY6ZP3KMDOL2',
    corridor: 'Indonesia · Hana pickup',
    asset: 'XLM',
    monthlyAmount: '25',
    status: 'active',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('nextPayoutStatus — every transition', () => {
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

describe('makePickupRef', () => {
  it('uses a HANA prefix for Hana corridors', () => {
    expect(makePickupRef('Indonesia · Hana pickup', '2026-07')).toMatch(
      /^HANA-202607-[0-9A-F]{6}$/,
    );
  });
  it('uses an MGRAM prefix for MoneyGram corridors', () => {
    expect(makePickupRef('Philippines · MoneyGram', '2026-07')).toMatch(
      /^MGRAM-202607-[0-9A-F]{6}$/,
    );
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

  it('creates a scheduled payout when none exists', async () => {
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
  it('verifies on-chain then walks scheduled -> sent -> settled', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.findScheduledForPeriod).mockResolvedValue({
      id: 'p1',
      status: 'scheduled',
      period: currentPeriod(),
    } as never);
    vi.mocked(verifyAllowancePayment).mockResolvedValue(undefined as never);
    vi.mocked(payoutRepo.update).mockResolvedValue({ id: 'p1', status: 'settled' } as never);

    const result = await payoutService.recordPayment('a1', OWNER, { txHash: TX, amount: '25' });

    expect(verifyAllowancePayment).toHaveBeenCalledOnce();
    expect(payoutRepo.update).toHaveBeenCalledTimes(2);
    expect(vi.mocked(payoutRepo.update).mock.calls[0][1]).toMatchObject({
      status: 'sent',
      txHash: TX,
    });
    expect(vi.mocked(payoutRepo.update).mock.calls[1][1]).toMatchObject({ status: 'settled' });
    expect(result).toMatchObject({ status: 'settled' });
  });

  it('rejects a duplicate transaction hash', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue({ id: 'dup' } as never);
    await expect(
      payoutService.recordPayment('a1', OWNER, { txHash: TX, amount: '25' }),
    ).rejects.toThrow(/already recorded/i);
    expect(verifyAllowancePayment).not.toHaveBeenCalled();
  });

  it('refuses to pay an ended allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(
      fakeAllowance({ status: 'ended' }) as never,
    );
    await expect(
      payoutService.recordPayment('a1', OWNER, { txHash: TX, amount: '25' }),
    ).rejects.toThrow(/has ended/i);
  });

  it('throws NOT_FOUND for an unknown allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(
      payoutService.recordPayment('x', OWNER, { txHash: TX, amount: '25' }),
    ).rejects.toThrow(/not found/i);
  });

  it('propagates an on-chain verification failure', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(fakeAllowance() as never);
    vi.mocked(payoutRepo.findByTxHash).mockResolvedValue(undefined as never);
    vi.mocked(verifyAllowancePayment).mockRejectedValue(new Error('not found on-chain'));
    await expect(
      payoutService.recordPayment('a1', OWNER, { txHash: TX, amount: '25' }),
    ).rejects.toThrow(/on-chain/i);
  });
});

describe('payoutService.markCollected', () => {
  it('moves settled -> collected', async () => {
    vi.mocked(payoutRepo.findOwned).mockResolvedValue({ id: 'p1', status: 'settled' } as never);
    vi.mocked(payoutRepo.setStatus).mockResolvedValue({ id: 'p1', status: 'collected' } as never);
    const p = await payoutService.markCollected('p1', OWNER);
    expect(payoutRepo.setStatus).toHaveBeenCalledWith('p1', 'collected');
    expect(p).toMatchObject({ status: 'collected' });
  });

  it('throws NOT_FOUND for an unknown payout', async () => {
    vi.mocked(payoutRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(payoutService.markCollected('x', OWNER)).rejects.toThrow(/not found/i);
  });

  it('refuses to collect a payout that is not settled', async () => {
    vi.mocked(payoutRepo.findOwned).mockResolvedValue({ id: 'p1', status: 'sent' } as never);
    await expect(payoutService.markCollected('p1', OWNER)).rejects.toThrow(/cannot collect/i);
    expect(payoutRepo.setStatus).not.toHaveBeenCalled();
  });
});

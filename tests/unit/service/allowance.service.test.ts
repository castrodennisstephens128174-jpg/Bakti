import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db/repos/allowance.repo', () => ({
  allowanceRepo: {
    insert: vi.fn(),
    listByOwner: vi.fn(),
    findOwned: vi.fn(),
    setStatus: vi.fn(),
  },
}));
vi.mock('@/server/db/repos/payout.repo', () => ({
  payoutRepo: {
    insert: vi.fn(),
    listByAllowance: vi.fn(),
  },
}));
vi.mock('@/server/stellar', () => ({
  buildCreateScheduleXdr: vi.fn(),
  contractIds: { bakti: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4' },
  submitCreateSchedule: vi.fn(),
  validateSignedCreateSchedule: vi.fn(),
}));

import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import {
  type AllowanceInput,
  allowanceService,
  assertAllowanceInput,
  nextAllowanceStatus,
} from '@/server/service/allowance.service';
import { submitCreateSchedule, validateSignedCreateSchedule } from '@/server/stellar';

const OWNER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const RECIPIENT = 'GBU7GVNT52X7VNTG63RE23NE7CE344SNHVONEW4KANS4LY6ZP3KMDOL2';

function validInput(overrides: Partial<AllowanceInput> = {}): AllowanceInput {
  return {
    recipientName: 'Bapak Bambang',
    recipientAddress: RECIPIENT,
    corridor: 'Malaysia → Philippines · research corridor',
    asset: 'XLM',
    monthlyAmount: '25',
    dayOfMonth: 5,
    ...overrides,
  };
}

function fakeAllowance(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    publicKey: OWNER,
    recipientName: 'Bapak Bambang',
    recipientAddress: RECIPIENT,
    corridor: 'Malaysia → Philippines · research corridor',
    asset: 'XLM',
    monthlyAmount: '25',
    dayOfMonth: 5,
    status: 'active',
    note: null,
    network: 'testnet',
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('assertAllowanceInput', () => {
  it('accepts a valid input', () => {
    expect(() => assertAllowanceInput(validInput())).not.toThrow();
  });

  it('rejects a blank recipient name', () => {
    expect(() => assertAllowanceInput(validInput({ recipientName: '  ' }))).toThrow(
      /name of the family member/i,
    );
  });

  it('rejects an invalid recipient address', () => {
    expect(() => assertAllowanceInput(validInput({ recipientAddress: 'not-a-key' }))).toThrow(
      /invalid/i,
    );
  });

  it('rejects a blank corridor', () => {
    expect(() => assertAllowanceInput(validInput({ corridor: '' }))).toThrow(/corridor/i);
  });

  it('rejects an unknown asset', () => {
    expect(() => assertAllowanceInput(validInput({ asset: 'BTC' as unknown as 'XLM' }))).toThrow(
      /XLM or USDC/i,
    );
  });

  it('rejects a zero or negative monthly amount', () => {
    expect(() => assertAllowanceInput(validInput({ monthlyAmount: '0' }))).toThrow(/greater than/i);
    expect(() => assertAllowanceInput(validInput({ monthlyAmount: '-3' }))).toThrow(
      /greater than/i,
    );
  });

  it('returns controlled validation errors for malformed or over-precision amounts', () => {
    for (const monthlyAmount of ['abc', '1.2.3', '0.00000001']) {
      try {
        assertAllowanceInput(validInput({ monthlyAmount }));
        throw new Error('expected validation to fail');
      } catch (error) {
        expect(error).toMatchObject({ code: 'INVALID_INPUT', status: 400 });
        expect((error as Error).message).toMatch(/at most 7 fractional digits/i);
      }
    }
  });

  it('rejects a day of month outside 1..28', () => {
    expect(() => assertAllowanceInput(validInput({ dayOfMonth: 0 }))).toThrow(/between 1 and 28/i);
    expect(() => assertAllowanceInput(validInput({ dayOfMonth: 31 }))).toThrow(/between 1 and 28/i);
    expect(() => assertAllowanceInput(validInput({ dayOfMonth: 2.5 }))).toThrow(
      /between 1 and 28/i,
    );
  });
});

describe('nextAllowanceStatus — every transition', () => {
  it('allows valid transitions', () => {
    expect(nextAllowanceStatus('active', 'pause')).toBe('paused');
    expect(nextAllowanceStatus('paused', 'resume')).toBe('active');
    expect(nextAllowanceStatus('active', 'end')).toBe('ended');
    expect(nextAllowanceStatus('paused', 'end')).toBe('ended');
  });

  it('throws on every invalid transition', () => {
    expect(() => nextAllowanceStatus('paused', 'pause')).toThrow(/cannot pause/i);
    expect(() => nextAllowanceStatus('ended', 'pause')).toThrow(/cannot pause/i);
    expect(() => nextAllowanceStatus('active', 'resume')).toThrow(/cannot resume/i);
    expect(() => nextAllowanceStatus('ended', 'resume')).toThrow(/cannot resume/i);
    expect(() => nextAllowanceStatus('ended', 'end')).toThrow(/cannot end/i);
  });
});

describe('allowanceService.create', () => {
  it('validates, inserts allowance + first scheduled payout, returns detail', async () => {
    const created = fakeAllowance();
    vi.mocked(allowanceRepo.insert).mockResolvedValue(created as never);
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(created as never);
    vi.mocked(payoutRepo.insert).mockResolvedValue({ id: 'p1' } as never);
    vi.mocked(payoutRepo.listByAllowance).mockResolvedValue([{ id: 'p1' }] as never);

    const result = await allowanceService.create(OWNER, validInput());

    expect(allowanceRepo.insert).toHaveBeenCalledOnce();
    expect(payoutRepo.insert).toHaveBeenCalledOnce();
    expect(result.payouts).toHaveLength(1);
  });

  it('rejects invalid input before touching the repo', async () => {
    await expect(
      allowanceService.create(OWNER, validInput({ monthlyAmount: '0' })),
    ).rejects.toThrow();
    expect(allowanceRepo.insert).not.toHaveBeenCalled();
  });
});

describe('allowanceService.createEscrowed', () => {
  it('validates the signed intent before submission', async () => {
    vi.mocked(validateSignedCreateSchedule).mockImplementation(() => {
      throw new Error('intent mismatch');
    });

    await expect(
      allowanceService.createEscrowed(OWNER, validInput({ months: 4 }), 'signed-xdr'),
    ).rejects.toThrow(/intent mismatch/i);

    expect(validateSignedCreateSchedule).toHaveBeenCalledWith('signed-xdr', {
      sender: OWNER,
      recipient: RECIPIENT,
      monthlyAmountStroops: 250_000_000n,
      months: 4,
    });
    expect(submitCreateSchedule).not.toHaveBeenCalled();
    expect(allowanceRepo.insert).not.toHaveBeenCalled();
  });
});

describe('allowanceService.list', () => {
  it('attaches payout count and last payout per allowance', async () => {
    vi.mocked(allowanceRepo.listByOwner).mockResolvedValue([fakeAllowance()] as never);
    vi.mocked(payoutRepo.listByAllowance).mockResolvedValue([
      { id: 'p2', status: 'settled' },
      { id: 'p1', status: 'collected' },
    ] as never);

    const list = await allowanceService.list(OWNER);
    expect(list[0].payoutCount).toBe(2);
    expect(list[0].lastPayout).toMatchObject({ id: 'p2' });
  });

  it('returns null lastPayout when there are no payouts', async () => {
    vi.mocked(allowanceRepo.listByOwner).mockResolvedValue([fakeAllowance()] as never);
    vi.mocked(payoutRepo.listByAllowance).mockResolvedValue([] as never);
    const list = await allowanceService.list(OWNER);
    expect(list[0].lastPayout).toBeNull();
  });
});

describe('allowanceService.getOwned', () => {
  it('throws NOT_FOUND when the allowance is missing', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(allowanceService.getOwned('missing', OWNER)).rejects.toThrow(/not found/i);
  });
});

describe('allowanceService.changeStatus', () => {
  it('applies a valid transition via the repo', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(
      fakeAllowance({ status: 'active' }) as never,
    );
    vi.mocked(allowanceRepo.setStatus).mockResolvedValue(
      fakeAllowance({ status: 'paused' }) as never,
    );
    vi.mocked(payoutRepo.listByAllowance).mockResolvedValue([] as never);

    await allowanceService.changeStatus('a1', OWNER, 'pause');
    expect(allowanceRepo.setStatus).toHaveBeenCalledWith('a1', 'paused');
  });

  it('throws NOT_FOUND for an unknown allowance', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(undefined as never);
    await expect(allowanceService.changeStatus('x', OWNER, 'pause')).rejects.toThrow(/not found/i);
  });

  it('refuses an invalid transition without writing', async () => {
    vi.mocked(allowanceRepo.findOwned).mockResolvedValue(
      fakeAllowance({ status: 'ended' }) as never,
    );
    await expect(allowanceService.changeStatus('a1', OWNER, 'resume')).rejects.toThrow(
      /cannot resume/i,
    );
    expect(allowanceRepo.setStatus).not.toHaveBeenCalled();
  });
});

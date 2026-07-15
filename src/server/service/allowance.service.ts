import { StrKey } from '@stellar/stellar-sdk';
import { env } from '@/server/config/env';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { Allowance, AllowanceAsset, AllowanceStatus, Payout } from '@/server/db/schema';
import { ALLOWANCE_ASSETS } from '@/server/db/schema/allowances';
import { toStroops } from '@/server/lib/amount';
import { AppError } from '@/server/lib/http';
import { buildCreateScheduleXdr, contractIds, submitCreateSchedule } from '@/server/stellar';
import { currentPeriod } from './payout.service';

export type AllowanceAction = 'pause' | 'resume' | 'end';

export const DEFAULT_MONTHS = 3;

export type AllowanceInput = {
  recipientName: string;
  recipientAddress: string;
  corridor: string;
  asset: AllowanceAsset;
  monthlyAmount: string;
  dayOfMonth: number;
  months?: number;
  note?: string;
};

const ALLOWANCE_TRANSITIONS: Record<
  AllowanceAction,
  Partial<Record<AllowanceStatus, AllowanceStatus>>
> = {
  pause: { active: 'paused' },
  resume: { paused: 'active' },
  end: { active: 'ended', paused: 'ended' },
};

/**
 * Allowance lifecycle guard. Returns the next status for a valid action, or
 * throws CONFLICT for any invalid transition (e.g. resuming an active plan,
 * touching an ended one). This is the single source of truth for the machine.
 */
export function nextAllowanceStatus(
  current: AllowanceStatus,
  action: AllowanceAction,
): AllowanceStatus {
  const next = ALLOWANCE_TRANSITIONS[action]?.[current];
  if (!next) {
    throw new AppError('CONFLICT', `Cannot ${action} an allowance that is ${current}`, 409);
  }
  return next;
}

export function assertAllowanceInput(input: AllowanceInput): void {
  if (!input.recipientName.trim()) {
    throw new AppError('INVALID_INPUT', 'Add the name of the parent you support', 400);
  }
  if (!StrKey.isValidEd25519PublicKey(input.recipientAddress)) {
    throw new AppError('INVALID_INPUT', 'The recipient Stellar address is invalid', 400);
  }
  if (!input.corridor.trim()) {
    throw new AppError('INVALID_INPUT', 'Choose a cash-pickup corridor', 400);
  }
  if (!ALLOWANCE_ASSETS.includes(input.asset)) {
    throw new AppError('INVALID_INPUT', 'Asset must be XLM or USDC', 400);
  }
  if (toStroops(input.monthlyAmount) <= 0n) {
    throw new AppError('INVALID_INPUT', 'Set a monthly amount greater than zero', 400);
  }
  if (!Number.isInteger(input.dayOfMonth) || input.dayOfMonth < 1 || input.dayOfMonth > 28) {
    throw new AppError('INVALID_INPUT', 'Payout day must be between 1 and 28', 400);
  }
  if (
    input.months !== undefined &&
    (!Number.isInteger(input.months) || input.months < 1 || input.months > 12)
  ) {
    throw new AppError('INVALID_INPUT', 'Months to pre-fund must be between 1 and 12', 400);
  }
}

export type AllowanceWithPayouts = Allowance & { payouts: Payout[] };
export type AllowanceSummary = Allowance & { payoutCount: number; lastPayout: Payout | null };

type EscrowRef = { scheduleId: string; contractId: string; escrowTxHash: string };

async function insertAllowanceWithFirstPayout(
  publicKey: string,
  input: AllowanceInput,
  escrow?: EscrowRef,
): Promise<AllowanceWithPayouts> {
  const allowance = await allowanceRepo.insert({
    publicKey,
    recipientName: input.recipientName.trim(),
    recipientAddress: input.recipientAddress,
    corridor: input.corridor.trim(),
    asset: input.asset,
    monthlyAmount: input.monthlyAmount,
    dayOfMonth: input.dayOfMonth,
    months: input.months ?? DEFAULT_MONTHS,
    scheduleId: escrow?.scheduleId ?? null,
    contractId: escrow?.contractId ?? null,
    escrowTxHash: escrow?.escrowTxHash ?? null,
    note: input.note?.trim() || null,
    network: env.STELLAR_NETWORK,
  });
  await payoutRepo.insert({
    allowanceId: allowance.id,
    publicKey,
    asset: allowance.asset,
    amount: allowance.monthlyAmount,
    period: currentPeriod(),
    status: 'scheduled',
    memo: `Bakti allowance ${currentPeriod()}`,
    network: env.STELLAR_NETWORK,
  });
  return allowanceService.getOwned(allowance.id, publicKey);
}

export const allowanceService = {
  /** Classic path (USDC, or when no on-chain escrow is signed): a plan-only insert. */
  async create(publicKey: string, input: AllowanceInput): Promise<AllowanceWithPayouts> {
    assertAllowanceInput(input);
    return insertAllowanceWithFirstPayout(publicKey, input);
  },

  /**
   * Build the UNSIGNED `create_schedule` invoke that escrows the whole run
   * (monthly_amount * months) from the sender into the Bakti contract. XLM only.
   */
  async buildEscrow(
    publicKey: string,
    input: AllowanceInput,
  ): Promise<{ xdr: string; contractId: string; months: number }> {
    assertAllowanceInput(input);
    if (input.asset !== 'XLM') {
      throw new AppError('INVALID_INPUT', 'The escrow contract holds XLM; use XLM for on-chain.', 400);
    }
    const months = input.months ?? DEFAULT_MONTHS;
    const { xdr } = await buildCreateScheduleXdr({
      sender: publicKey,
      recipient: input.recipientAddress,
      monthlyAmount: input.monthlyAmount,
      months,
    });
    return { xdr, contractId: contractIds.bakti, months };
  },

  /**
   * Submit the sender-signed escrow, then persist the allowance backed by the
   * on-chain schedule id. Each monthly send releases one period from this escrow.
   */
  async createEscrowed(
    publicKey: string,
    input: AllowanceInput,
    signedXdr: string,
  ): Promise<AllowanceWithPayouts> {
    assertAllowanceInput(input);
    if (input.asset !== 'XLM') {
      throw new AppError('INVALID_INPUT', 'The escrow contract holds XLM; use XLM for on-chain.', 400);
    }
    const { hash, scheduleId } = await submitCreateSchedule(signedXdr);
    return insertAllowanceWithFirstPayout(publicKey, input, {
      scheduleId,
      contractId: contractIds.bakti,
      escrowTxHash: hash,
    });
  },

  async list(publicKey: string): Promise<AllowanceSummary[]> {
    const rows = await allowanceRepo.listByOwner(publicKey);
    const out: AllowanceSummary[] = [];
    for (const a of rows) {
      const payouts = await payoutRepo.listByAllowance(a.id);
      out.push({ ...a, payoutCount: payouts.length, lastPayout: payouts[0] ?? null });
    }
    return out;
  },

  async getOwned(id: string, publicKey: string): Promise<AllowanceWithPayouts> {
    const allowance = await allowanceRepo.findOwned(id, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const payouts = await payoutRepo.listByAllowance(id);
    return { ...allowance, payouts };
  },

  async changeStatus(
    id: string,
    publicKey: string,
    action: AllowanceAction,
  ): Promise<AllowanceWithPayouts> {
    const allowance = await allowanceRepo.findOwned(id, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const next = nextAllowanceStatus(allowance.status, action);
    await allowanceRepo.setStatus(id, next);
    return allowanceService.getOwned(id, publicKey);
  },
};

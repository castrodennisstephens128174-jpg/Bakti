import { env } from '@/server/config/env';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { AllowanceStatus, Payout, PayoutStatus } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { buildReleaseXdr, submitSorobanSigned, validateSignedRelease } from '@/server/stellar';
import { verifyAllowancePayment } from '@/server/stellar/horizon';

export type PayoutAction = 'send' | 'settle' | 'collect' | 'fail';

const PAYOUT_TRANSITIONS: Record<PayoutAction, Partial<Record<PayoutStatus, PayoutStatus>>> = {
  send: { scheduled: 'sent' },
  settle: { sent: 'settled' },
  collect: { settled: 'collected' },
  fail: { scheduled: 'failed', sent: 'failed' },
};

/**
 * Payout lifecycle guard. `settled` and `collected` remain available for a
 * future provider adapter, but current direct-payment endpoints stop at `sent`.
 */
export function nextPayoutStatus(current: PayoutStatus, action: PayoutAction): PayoutStatus {
  const next = PAYOUT_TRANSITIONS[action]?.[current];
  if (!next) {
    throw new AppError('CONFLICT', `Cannot ${action} a payout that is ${current}`, 409);
  }
  return next;
}

/** Current allowance period as YYYY-MM. This is record grouping, not scheduling. */
export function currentPeriod(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function assertAllowanceCanSend(status: AllowanceStatus): void {
  if (status === 'paused') {
    throw new AppError('CONFLICT', 'This allowance is paused', 409);
  }
  if (status === 'ended') {
    throw new AppError('CONFLICT', 'This allowance has ended', 409);
  }
}

export const payoutService = {
  /** Ensure a scheduled record exists for the current period; return it. */
  async ensureScheduled(allowanceId: string, publicKey: string): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const period = currentPeriod();
    const existing = await payoutRepo.findScheduledForPeriod(allowanceId, period);
    if (existing) return existing;
    return payoutRepo.insert({
      allowanceId,
      publicKey,
      asset: allowance.asset,
      amount: allowance.monthlyAmount,
      period,
      status: 'scheduled',
      memo: `Bakti allowance ${period}`,
      network: env.STELLAR_NETWORK,
    });
  },

  /**
   * Record a direct, on-chain allowance payment. Horizon verifies the asset,
   * amount, sender, and recipient before the payout is marked `sent`. No cash
   * pickup or provider settlement is inferred from ledger confirmation.
   */
  async recordPayment(
    allowanceId: string,
    publicKey: string,
    data: { txHash: string },
  ): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    assertAllowanceCanSend(allowance.status);

    const duplicate = await payoutRepo.findByTxHash(data.txHash);
    if (duplicate) {
      throw new AppError('ALREADY_EXISTS', 'This payment is already recorded', 409);
    }

    await verifyAllowancePayment({
      txHash: data.txHash,
      asset: allowance.asset,
      from: publicKey,
      to: allowance.recipientAddress,
      amount: allowance.monthlyAmount,
    });

    const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
    nextPayoutStatus(scheduled.status, 'send');
    return payoutRepo.update(scheduled.id, {
      status: 'sent',
      txHash: data.txHash,
      pickupRef: null,
      memo: `Bakti allowance ${scheduled.period}`,
    });
  },

  /**
   * Build the unsigned `release` invoke for a contract-backed XLM allowance.
   * The current sender signs it; the contract pays the recorded recipient.
   */
  async buildRelease(allowanceId: string, publicKey: string): Promise<{ xdr: string }> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    assertAllowanceCanSend(allowance.status);
    if (!allowance.scheduleId) {
      throw new AppError('CONFLICT', 'This allowance is not backed by an on-chain schedule', 409);
    }
    const xdr = await buildReleaseXdr({ caller: publicKey, scheduleId: allowance.scheduleId });
    return { xdr };
  },

  /**
   * Submit a signed Soroban release. RPC confirmation proves the contract call
   * landed, so the payout is marked `sent` with its transaction hash. Provider
   * settlement is a separate, currently unimplemented integration.
   */
  async recordRelease(
    allowanceId: string,
    publicKey: string,
    data: { signedXdr: string },
  ): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    assertAllowanceCanSend(allowance.status);
    if (!allowance.scheduleId) {
      throw new AppError('CONFLICT', 'This allowance is not backed by an on-chain schedule', 409);
    }

    const tx = validateSignedRelease(data.signedXdr, {
      caller: publicKey,
      scheduleId: allowance.scheduleId,
    });
    const { hash } = await submitSorobanSigned(tx);
    const duplicate = await payoutRepo.findByTxHash(hash);
    if (duplicate) return duplicate;

    const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
    nextPayoutStatus(scheduled.status, 'send');
    return payoutRepo.update(scheduled.id, {
      status: 'sent',
      txHash: hash,
      pickupRef: null,
      memo: `Bakti allowance ${scheduled.period} (contract release)`,
    });
  },

  /** Manual collection claims are disabled until a provider adapter confirms them. */
  async markCollected(payoutId: string, publicKey: string): Promise<Payout> {
    const payout = await payoutRepo.findOwned(payoutId, publicKey);
    if (!payout) throw new AppError('NOT_FOUND', 'Payout not found', 404);
    throw new AppError(
      'CONFLICT',
      'Collection cannot be confirmed manually; no payout provider is connected',
      409,
    );
  },
};

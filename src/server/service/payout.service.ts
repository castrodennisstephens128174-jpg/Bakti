import { randomBytes } from 'node:crypto';
import { env } from '@/server/config/env';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { Payout, PayoutStatus } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { buildReleaseXdr, submitSorobanSigned } from '@/server/stellar';
import { verifyAllowancePayment } from '@/server/stellar/horizon';

export type PayoutAction = 'send' | 'settle' | 'collect' | 'fail';

const PAYOUT_TRANSITIONS: Record<PayoutAction, Partial<Record<PayoutStatus, PayoutStatus>>> = {
  send: { scheduled: 'sent' },
  settle: { sent: 'settled' },
  collect: { settled: 'collected' },
  fail: { scheduled: 'failed', sent: 'failed' },
};

/**
 * Payout lifecycle guard: scheduled -> sent -> settled -> collected, with a
 * fail branch off scheduled/sent. Returns the next status for a valid action,
 * throws CONFLICT otherwise (backwards moves, touching terminal states).
 */
export function nextPayoutStatus(current: PayoutStatus, action: PayoutAction): PayoutStatus {
  const next = PAYOUT_TRANSITIONS[action]?.[current];
  if (!next) {
    throw new AppError('CONFLICT', `Cannot ${action} a payout that is ${current}`, 409);
  }
  return next;
}

/** Current allowance period as YYYY-MM (payouts are one-per-month). */
export function currentPeriod(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const CORRIDOR_PREFIX: Record<string, string> = {
  hana: 'HANA',
  moneygram: 'MGRAM',
};

/**
 * Simulated off-ramp cash-pickup reference. On mainnet this comes from the
 * SEP-24 anchor; on testnet Bakti generates a demo code so the flow is
 * end-to-end visible. The UI labels this leg as a testnet simulation.
 */
export function makePickupRef(corridor: string, period: string): string {
  const key = corridor.toLowerCase().includes('moneygram') ? 'moneygram' : 'hana';
  const prefix = CORRIDOR_PREFIX[key];
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${period.replace('-', '')}-${suffix}`;
}

export const payoutService = {
  /** Ensure a scheduled payout exists for the current period; return it. */
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
   * Record a real, on-chain allowance payment. Verifies the transaction against
   * Horizon (right asset, amount, recipient), then walks the scheduled payout
   * to sent and immediately to settled with a cash-pickup reference.
   */
  async recordPayment(
    allowanceId: string,
    publicKey: string,
    data: { txHash: string; amount: string },
  ): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    if (allowance.status === 'ended') {
      throw new AppError('CONFLICT', 'This allowance has ended', 409);
    }

    const duplicate = await payoutRepo.findByTxHash(data.txHash);
    if (duplicate) {
      throw new AppError('ALREADY_EXISTS', 'This payment is already recorded', 409);
    }

    await verifyAllowancePayment({
      txHash: data.txHash,
      asset: allowance.asset,
      from: publicKey,
      to: allowance.recipientAddress,
      amount: data.amount,
    });

    const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
    const period = scheduled.period;

    nextPayoutStatus(scheduled.status, 'send');
    const memo = `Bakti allowance ${period}`;
    await payoutRepo.update(scheduled.id, {
      status: 'sent',
      txHash: data.txHash,
      memo,
    });

    nextPayoutStatus('sent', 'settle');
    const pickupRef = makePickupRef(allowance.corridor, period);
    return payoutRepo.update(scheduled.id, { status: 'settled', pickupRef });
  },

  /**
   * Build the UNSIGNED `release` invoke for a contract-backed allowance. The
   * caller (here the sender, but the contract permits anyone) signs it; the
   * contract pays the recipient one month from the pre-funded escrow.
   */
  async buildRelease(allowanceId: string, publicKey: string): Promise<{ xdr: string }> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    if (allowance.status === 'ended') {
      throw new AppError('CONFLICT', 'This allowance has ended', 409);
    }
    if (!allowance.scheduleId) {
      throw new AppError('CONFLICT', 'This allowance is not backed by an on-chain schedule', 409);
    }
    const xdr = await buildReleaseXdr({ caller: publicKey, scheduleId: allowance.scheduleId });
    return { xdr };
  },

  /**
   * Submit a signed `release` invoke (the RPC confirms it landed on-chain), then
   * walk the scheduled payout to sent -> settled with a cash-pickup reference.
   * The release tx hash is the on-chain proof of the contract call.
   */
  async recordRelease(
    allowanceId: string,
    publicKey: string,
    data: { signedXdr: string },
  ): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    if (!allowance.scheduleId) {
      throw new AppError('CONFLICT', 'This allowance is not backed by an on-chain schedule', 409);
    }

    const { hash } = await submitSorobanSigned(data.signedXdr);

    const duplicate = await payoutRepo.findByTxHash(hash);
    if (duplicate) return duplicate;

    const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
    const period = scheduled.period;

    nextPayoutStatus(scheduled.status, 'send');
    await payoutRepo.update(scheduled.id, {
      status: 'sent',
      txHash: hash,
      memo: `Bakti allowance ${period} (contract release)`,
    });

    nextPayoutStatus('sent', 'settle');
    const pickupRef = makePickupRef(allowance.corridor, period);
    return payoutRepo.update(scheduled.id, { status: 'settled', pickupRef });
  },

  /** Sender confirms the parent collected the cash: settled -> collected. */
  async markCollected(payoutId: string, publicKey: string): Promise<Payout> {
    const payout = await payoutRepo.findOwned(payoutId, publicKey);
    if (!payout) throw new AppError('NOT_FOUND', 'Payout not found', 404);
    const next = nextPayoutStatus(payout.status, 'collect');
    return payoutRepo.setStatus(payoutId, next);
  },
};

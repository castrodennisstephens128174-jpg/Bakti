import { randomBytes } from 'node:crypto';
import {
  createSep31Transaction,
  getSep31Transaction,
  registerSep31Callback,
  sep31Enabled,
} from '@/server/anchor/sep31';
import { env } from '@/server/config/env';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { Payout, PayoutStatus } from '@/server/db/schema';
import { AppError } from '@/server/lib/http';
import { buildReleaseXdr, networkFor, submitSorobanSigned } from '@/server/stellar';
import { verifyAllowancePayment } from '@/server/stellar/horizon';

export type AllowanceKyc = {
  senderFirstName: string;
  senderLastName: string;
  senderIdType?: string;
  senderIdNumber?: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverIdType?: string;
  receiverIdNumber?: string;
  senderCustomerId?: string;
  receiverCustomerId?: string;
};

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
  /** Ensure a scheduled payout exists for the (given or current) period. */
  async ensureScheduled(allowanceId: string, publicKey: string, periodKey?: string): Promise<Payout> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const period = periodKey ?? currentPeriod();
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
      network: allowance.network,
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

    await verifyAllowancePayment(
      {
        txHash: data.txHash,
        asset: allowance.asset,
        from: publicKey,
        to: allowance.recipientAddress,
        amount: data.amount,
      },
      networkFor(allowance.network),
    );

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
    const xdr = await buildReleaseXdr(
      { caller: publicKey, scheduleId: allowance.scheduleId, contractId: allowance.contractId },
      networkFor(allowance.network),
    );
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

    const { hash } = await submitSorobanSigned(data.signedXdr, networkFor(allowance.network));

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

  /**
   * SEP-31: open a transaction at the partner anchor for this month's payout
   * and return the payment instructions the sender must sign in Freighter.
   * Registers sender/receiver KYC (SEP-12) on first use, reusing customer ids
   * afterwards. Testnet rehearsal only.
   */
  async buildSep31Intent(
    allowanceId: string,
    publicKey: string,
  ): Promise<{
    destination: string;
    memo: string;
    memoType: string;
    amount: string;
    asset: string;
    sep31Id: string;
  }> {
    if (!sep31Enabled()) {
      throw new AppError('CONFLICT', 'SEP-31 anchor integration is not configured', 409);
    }
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    if (allowance.corridor !== 'sep31') {
      throw new AppError('CONFLICT', 'This allowance does not use the SEP-31 corridor', 409);
    }
    if (allowance.network !== 'testnet') {
      throw new AppError('CONFLICT', 'SEP-31 rehearsal is testnet-only for now', 409);
    }
    if (allowance.status === 'ended') {
      throw new AppError('CONFLICT', 'This allowance has ended', 409);
    }

    const { prepareKyc, readStoredKyc, sealKyc } = await import('./sep31kyc.service');
    let kyc = readStoredKyc(allowance.kycJson);
    if (!kyc.senderCustomerId || !kyc.receiverCustomerId) {
      kyc = await prepareKyc(publicKey, kyc);
      await allowanceRepo.setKyc(allowance.id, sealKyc(kyc));
    }

    const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
    if (scheduled.sep31Id && scheduled.anchorAccount && scheduled.anchorMemo) {
      return {
        destination: scheduled.anchorAccount,
        memo: scheduled.anchorMemo,
        memoType: scheduled.anchorMemoType ?? 'text',
        amount: scheduled.amount,
        asset: scheduled.asset,
        sep31Id: scheduled.sep31Id,
      };
    }

    const net = networkFor(allowance.network);
    const created = await createSep31Transaction({
      assetCode: allowance.asset,
      assetIssuer: allowance.asset === 'USDC' ? net.usdcIssuer : undefined,
      amount: allowance.monthlyAmount,
      senderId: kyc.senderCustomerId!,
      receiverId: kyc.receiverCustomerId!,
    });
    if (env.SEP31_CALLBACK_URL) {
      await registerSep31Callback(created.id, env.SEP31_CALLBACK_URL);
    }
    await payoutRepo.update(scheduled.id, {
      sep31Id: created.id,
      sep31Status: 'pending_sender',
      anchorDomain: env.SEP31_ANCHOR_DOMAIN ?? null,
      anchorAccount: created.stellarAccountId,
      anchorMemo: created.stellarMemo,
      anchorMemoType: created.stellarMemoType,
    });
    return {
      destination: created.stellarAccountId,
      memo: created.stellarMemo,
      memoType: created.stellarMemoType,
      amount: scheduled.amount,
      asset: scheduled.asset,
      sep31Id: created.id,
    };
  },

  /**
   * SEP-31: poll the anchor for this month's transaction and sync the payout.
   * When the anchor reports `completed`, the payout walks to settled with the
   * anchor's pickup reference and on-chain tx hash.
   */
  async syncSep31(allowanceId: string, publicKey: string): Promise<Payout & { anchorStatus: string }> {
    const allowance = await allowanceRepo.findOwned(allowanceId, publicKey);
    if (!allowance) throw new AppError('NOT_FOUND', 'Allowance not found', 404);
    const payout = await payoutRepo.findSep31ForPeriod(allowanceId, currentPeriod());
    if (!payout?.sep31Id) {
      throw new AppError('NOT_FOUND', 'No SEP-31 transaction open for this period', 404);
    }

    const remote = await getSep31Transaction(payout.sep31Id);
    const updated = await payoutService.applySep31Status(payout, remote);
    return { ...updated, anchorStatus: remote.status };
  },

  /**
   * The ONE place anchor-side state is written to a payout — used by polling,
   * the signed callback receiver, the keeper and the reconciliation job, so
   * they can never disagree. Walks the payout state machine forward only.
   */
  async applySep31Status(
    payout: Payout,
    remote: { status: string; stellarTransactionId: string | null; externalTransactionId: string | null },
  ): Promise<Payout> {
    let updated = await payoutRepo.update(payout.id, { sep31Status: remote.status });

    if (remote.status === 'completed') {
      if (updated.status === 'scheduled') {
        updated = await payoutRepo.update(payout.id, {
          status: 'sent',
          txHash: updated.txHash ?? remote.stellarTransactionId ?? null,
        });
      }
      if (updated.status === 'sent') {
        updated = await payoutRepo.update(payout.id, {
          status: 'settled',
          pickupRef: remote.externalTransactionId ?? null,
        });
      }
    } else if (
      (remote.status === 'refunded' || remote.status === 'expired' || remote.status === 'error') &&
      (updated.status === 'scheduled' || updated.status === 'sent')
    ) {
      // The anchor gave up on this period — surface it instead of leaving the
      // payout stuck. The reconciliation report picks refunds up for follow-up.
      updated = await payoutRepo.update(payout.id, { status: 'failed' });
    }
    return updated;
  },

  /** Sender confirms the parent collected the cash: settled -> collected. */
  async markCollected(payoutId: string, publicKey: string): Promise<Payout> {
    const payout = await payoutRepo.findOwned(payoutId, publicKey);
    if (!payout) throw new AppError('NOT_FOUND', 'Payout not found', 404);
    const next = nextPayoutStatus(payout.status, 'collect');
    return payoutRepo.setStatus(payoutId, next);
  },
};

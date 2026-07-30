import { Keypair, TransactionBuilder } from '@stellar/stellar-sdk';
import {
  createSep31Transaction,
  getSep31Transaction,
  registerSep31Callback,
  sep31Enabled,
} from '@/server/anchor/sep31';
import { env } from '@/server/config/env';
import { allowanceRepo } from '@/server/db/repos/allowance.repo';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import type { Allowance, Payout } from '@/server/db/schema';
import { buildReleaseXdr, networkFor, submitSorobanSigned } from '@/server/stellar';
import { currentPeriod, payoutService } from './payout.service';
import { readStoredKyc } from './sep31kyc.service';

/**
 * The keeper: runs on a cron, finds escrow-backed SEP-31 allowances whose
 * payout day has arrived, and drives one period end-to-end WITHOUT any user
 * action: claim (idempotency latch) -> open SEP-31 order (memo) -> sign
 * release with a channel key -> sync the anchor's verdict.
 *
 * The keeper's signature only submits and pays fees — the contract enforces
 * amount, destination and cadence. A crash at any step leaves money either in
 * the escrow or at the anchor with a valid memo, never in limbo.
 */

export type KeeperResult = {
  allowanceId: string;
  period: string;
  outcome: string;
  txHash?: string;
  pickupRef?: string;
};

function keeperKeys(): Keypair[] {
  return (env.KEEPER_SECRETS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Keypair.fromSecret(s));
}

/**
 * The keeper's period key. Normally the calendar month (one payout a month).
 * KEEPER_FAST_PERIODS (testnet demo) shortens it: 'true' ticks per minute,
 * a number N ticks every N seconds, so a 3-month plan plays out in seconds.
 */
function keeperPeriod(): string {
  const fast = env.KEEPER_FAST_PERIODS;
  if (!fast) return currentPeriod();
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const base = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
  const secs = Number(fast);
  if (Number.isFinite(secs) && secs >= 1 && secs <= 59) {
    return `${base}:${p(Math.floor(d.getUTCSeconds() / secs) * secs)}`;
  }
  return base;
}

async function runOne(allowance: Allowance, keeper: Keypair): Promise<KeeperResult> {
  const period = keeperPeriod();
  const base = { allowanceId: allowance.id, period };

  // Stop when the plan is complete.
  const settled = await payoutRepo.countSettled(allowance.id);
  if (settled >= allowance.months) {
    return { ...base, outcome: 'plan-complete' };
  }

  // One payout per calendar period, full stop. If this period already produced
  // a sent/settled/failed payout, the keeper's work here is done — without this
  // guard, ensureScheduled would mint a duplicate row for the same month.
  const existing = await payoutRepo.findAnyForPeriod(allowance.id, period);
  if (existing && existing.status !== 'scheduled') {
    return { ...base, outcome: `period-${existing.status}` };
  }

  const scheduled = await payoutService.ensureScheduled(allowance.id, allowance.publicKey, period);
  if (scheduled.status !== 'scheduled') {
    return { ...base, outcome: `already-${scheduled.status}` };
  }

  // Idempotency latch — losing the claim means another run owns this period.
  const claimed = await payoutRepo.claimForRelease(scheduled.id);
  if (!claimed) return { ...base, outcome: 'claim-lost' };

  try {
    // Ticket first: reuse the stored order or open a new one at the anchor.
    let sep31Id = claimed.sep31Id;
    let memo = claimed.anchorMemo;
    if (!sep31Id || !memo) {
      const kyc = readStoredKyc(allowance.kycJson);
      if (!kyc.senderCustomerId || !kyc.receiverCustomerId) {
        return { ...base, outcome: 'kyc-not-registered' };
      }
      const net = networkFor(allowance.network);
      const created = await createSep31Transaction({
        assetCode: allowance.asset,
        assetIssuer: allowance.asset === 'USDC' ? net.usdcIssuer : undefined,
        amount: allowance.monthlyAmount,
        senderId: kyc.senderCustomerId,
        receiverId: kyc.receiverCustomerId,
      });
      sep31Id = created.id;
      memo = created.stellarMemo;
      await payoutRepo.update(claimed.id, {
        sep31Id,
        sep31Status: 'pending_sender',
        anchorDomain: env.SEP31_ANCHOR_DOMAIN ?? null,
        anchorAccount: created.stellarAccountId,
        anchorMemo: memo,
        anchorMemoType: created.stellarMemoType,
      });
      if (env.SEP31_CALLBACK_URL) await registerSep31Callback(sep31Id, env.SEP31_CALLBACK_URL);
    }

    // Ticket in hand -> ring the bell. The contract does the actual paying.
    const cfg = networkFor(allowance.network);
    const xdr = await buildReleaseXdr(
      {
        caller: keeper.publicKey(),
        scheduleId: allowance.scheduleId as string,
        memo,
        contractId: allowance.contractId,
      },
      cfg,
    );
    const tx = TransactionBuilder.fromXDR(xdr, cfg.passphrase);
    tx.sign(keeper);
    const { hash } = await submitSorobanSigned(tx.toXDR(), cfg);
    await payoutRepo.update(claimed.id, { status: 'sent', txHash: hash });

    // Give the anchor a few beats to observe the event, then sync its verdict.
    let payout: Payout | undefined;
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const remote = await getSep31Transaction(sep31Id);
      payout = await payoutService.applySep31Status((await payoutRepo.findBySep31Id(sep31Id))!, remote);
      if (remote.status === 'completed') break;
    }
    return {
      ...base,
      outcome: payout?.status === 'settled' ? 'settled' : 'released-awaiting-anchor',
      txHash: hash,
      pickupRef: payout?.pickupRef ?? undefined,
    };
  } catch (err) {
    // Leave the claim in place (stale-claim window will retry) and report.
    return { ...base, outcome: `error: ${(err as Error).message?.slice(0, 120)}` };
  }
}

export async function runKeeper(limit = 10): Promise<KeeperResult[]> {
  if (!sep31Enabled()) return [];
  const keys = keeperKeys();
  if (keys.length === 0) return [];

  const today = new Date().getUTCDate();
  const due = (await allowanceRepo.findDueSep31('testnet', today)).slice(0, limit);

  // Shard across channel keys; each key processes its shard sequentially so
  // sequence numbers never collide, shards run in parallel.
  const shards: Allowance[][] = keys.map(() => []);
  due.forEach((a, i) => shards[i % keys.length].push(a));

  const results = await Promise.all(
    shards.map(async (shard, i) => {
      const out: KeeperResult[] = [];
      for (const allowance of shard) {
        out.push(await runOne(allowance, keys[i]));
      }
      return out;
    }),
  );
  return results.flat();
}

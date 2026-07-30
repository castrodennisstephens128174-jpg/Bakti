export const dynamic = 'force-dynamic';
export const maxDuration = 300;

import { isNotNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { getSep31Transaction, sep31Enabled } from '@/server/anchor/sep31';
import { env } from '@/server/config/env';
import { db } from '@/server/db/client';
import { payouts, reconciliationRuns } from '@/server/db/schema';
import { payoutService } from '@/server/service/payout.service';

/**
 * Daily three-ledger reconciliation over SEP-31 payouts:
 *   DB says settled  -> anchor must say completed (+ tx hash present)
 *   DB says in-flight-> older than 6h counts as stuck; re-sync from the anchor
 * Mismatches and stuck rows are persisted and (optionally) alerted on.
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!sep31Enabled()) return Response.json({ ok: true, skipped: 'sep31 disabled' });

  const rows = await db
    .select()
    .from(payouts)
    .where(isNotNull(payouts.sep31Id))
    .limit(500);

  const details: Array<Record<string, unknown>> = [];
  let settledOk = 0;
  let stuck = 0;
  let mismatched = 0;

  for (const p of rows) {
    try {
      const remote = await getSep31Transaction(p.sep31Id as string);
      if (p.status === 'settled') {
        if (remote.status === 'completed' && p.txHash) settledOk += 1;
        else {
          mismatched += 1;
          details.push({ payout: p.id, db: p.status, anchor: remote.status, kind: 'mismatch' });
        }
      } else if (p.status === 'scheduled' || p.status === 'sent') {
        // In-flight: pull the anchor's verdict forward (covers lost callbacks).
        await payoutService.applySep31Status(p, remote);
        const ageH = (Date.now() - new Date(p.updatedAt).getTime()) / 3_600_000;
        if (remote.status !== 'completed' && ageH > 6) {
          stuck += 1;
          details.push({ payout: p.id, db: p.status, anchor: remote.status, hours: Math.round(ageH), kind: 'stuck' });
        }
      }
    } catch {
      mismatched += 1;
      details.push({ payout: p.id, kind: 'anchor-unreachable' });
    }
  }

  const ok = mismatched === 0 && stuck === 0;
  await db.insert(reconciliationRuns).values({
    checked: rows.length,
    settledOk,
    stuck,
    mismatched,
    ok,
    detailsJson: JSON.stringify(details),
  });

  if (!ok && env.ALERT_WEBHOOK_URL) {
    await fetch(env.ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ Bakti SEP-31 reconciliation: ${mismatched} mismatched, ${stuck} stuck of ${rows.length} checked`,
        details,
      }),
    }).catch(() => undefined);
  }

  return Response.json({ ok, checked: rows.length, settledOk, stuck, mismatched, details });
}

export const POST = GET;

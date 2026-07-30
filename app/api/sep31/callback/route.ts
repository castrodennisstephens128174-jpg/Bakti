export const dynamic = 'force-dynamic';

import { Keypair } from '@stellar/stellar-sdk';
import type { NextRequest } from 'next/server';
import { fetchAnchorEndpoints } from '@/server/anchor/sep31';
import { payoutRepo } from '@/server/db/repos/payout.repo';
import { payoutService } from '@/server/service/payout.service';

/**
 * SEP-31 status callback receiver. The anchor POSTs the transaction object
 * whenever its status changes, signed with its published SIGNING_KEY:
 *
 *   Signature: t=<unix>, s=<base64 ed25519 over "t.host.body">
 *
 * Anything unsigned, stale or unverifiable is dropped — polling remains the
 * fallback, so rejecting is always safe.
 */
export async function POST(req: NextRequest) {
  const sigHeader = req.headers.get('signature') ?? req.headers.get('x-stellar-signature') ?? '';
  const m = sigHeader.match(/t=(\d+)\s*,\s*s=([A-Za-z0-9+/=]+)/);
  if (!m) return Response.json({ error: 'missing signature' }, { status: 401 });
  const [, tStr, sig] = m;

  const age = Math.abs(Date.now() / 1000 - Number(tStr));
  if (age > 300) return Response.json({ error: 'stale signature' }, { status: 401 });

  const body = await req.text();
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '';
  const payload = `${tStr}.${host}.${body}`;

  let verified = false;
  try {
    const { signingKey } = await fetchAnchorEndpoints();
    verified = Keypair.fromPublicKey(signingKey).verify(
      Buffer.from(payload, 'utf8'),
      Buffer.from(sig, 'base64'),
    );
  } catch {
    verified = false;
  }
  if (!verified) return Response.json({ error: 'bad signature' }, { status: 401 });

  const tx = (JSON.parse(body) as { transaction?: Record<string, unknown> }).transaction;
  if (!tx?.id) return Response.json({ error: 'no transaction' }, { status: 400 });

  const payout = await payoutRepo.findBySep31Id(String(tx.id));
  if (!payout) return Response.json({ ok: true, ignored: true });

  await payoutService.applySep31Status(payout, {
    status: String(tx.status ?? ''),
    stellarTransactionId: (tx.stellar_transaction_id as string) ?? null,
    externalTransactionId: (tx.external_transaction_id as string) ?? null,
  });
  return Response.json({ ok: true });
}

import { randomBytes } from 'node:crypto';
import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } });

const SUPPORTED = new Set(['USDC', 'native']);

/** SEP-31 POST /transactions — create a receive transaction. */
export async function POST(request) {
  const account = await requireAuth(request);
  if (!account) return json({ error: 'authentication required' }, 401);
  const body = await request.json().catch(() => ({}));

  if (!SUPPORTED.has(body.asset_code)) return json({ error: `asset ${body.asset_code} not supported` }, 400);
  const amount = Number.parseFloat(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'invalid amount' }, 400);
  if (amount < 0.1 || amount > 10000) return json({ error: 'amount out of bounds' }, 400);

  for (const key of ['sender_id', 'receiver_id']) {
    if (!body[key]) {
      return json({ error: 'customer_info_needed', type: key === 'sender_id' ? 'sep31-sender' : 'sep31-receiver' }, 400);
    }
    const { rows } = await db.query('SELECT status FROM customers WHERE id = $1', [body[key]]);
    if (!rows[0]) return json({ error: `unknown ${key}` }, 400);
    if (rows[0].status !== 'ACCEPTED') {
      return json({ error: 'customer_info_needed', type: key === 'sender_id' ? 'sep31-sender' : 'sep31-receiver' }, 400);
    }
  }

  const memo = randomBytes(10).toString('hex'); // 20 chars, fits a text memo
  const { rows } = await db.query(
    `INSERT INTO sep31_transactions
      (sender_account, sender_id, receiver_id, asset_code, asset_issuer, amount, status, stellar_account_id, stellar_memo, stellar_memo_type)
     VALUES ($1,$2,$3,$4,$5,$6,'pending_sender',$7,$8,'text') RETURNING id`,
    [account, body.sender_id, body.receiver_id, body.asset_code, body.asset_issuer ?? null, String(amount), process.env.RECEIVE_ACCOUNT, memo],
  );
  return json(
    {
      id: rows[0].id,
      stellar_account_id: process.env.RECEIVE_ACCOUNT,
      stellar_memo_type: 'text',
      stellar_memo: memo,
    },
    201,
  );
}

import { requireAuth } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { detectAndSettle, transactionBody } from '../../../../lib/settle';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } });

export async function GET(request, { params }) {
  const account = await requireAuth(request);
  if (!account) return json({ error: 'authentication required' }, 401);
  const { id } = await params;
  const { rows } = await db.query('SELECT * FROM sep31_transactions WHERE id = $1', [id]);
  let tx = rows[0];
  if (!tx) return json({ error: 'transaction not found' }, 404);
  if (tx.sender_account !== account) return json({ error: 'transaction not found' }, 404);

  if (tx.status === 'pending_sender' || tx.status === 'pending_stellar') {
    try {
      tx = await detectAndSettle(tx);
    } catch {
      /* lazy check is best-effort */
    }
  }

  return json(transactionBody(tx));
}

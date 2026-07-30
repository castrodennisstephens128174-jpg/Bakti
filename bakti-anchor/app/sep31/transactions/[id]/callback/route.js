import { requireAuth } from '../../../../../lib/auth';
import { db } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } });

/** SEP-31: register a status callback URL for this transaction. */
export async function PUT(request, { params }) {
  const account = await requireAuth(request);
  if (!account) return json({ error: 'authentication required' }, 401);
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  let url;
  try {
    url = new URL(body.url).toString();
  } catch {
    return json({ error: 'a valid callback url is required' }, 400);
  }
  const { rows } = await db.query(
    `UPDATE sep31_transactions SET callback_url = $2 WHERE id = $1 AND sender_account = $3 RETURNING id`,
    [id, url, account],
  );
  if (!rows[0]) return json({ error: 'transaction not found' }, 404);
  return new Response(null, { status: 204 });
}

import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } });

const REQUIRED_FIELDS = {
  first_name: { type: 'string', description: 'First name', optional: false },
  last_name: { type: 'string', description: 'Last name', optional: false },
  id_type: {
    type: 'string',
    description: 'Government ID type',
    choices: ['national_id', 'passport', 'drivers_license'],
    optional: false,
  },
  id_number: { type: 'string', description: 'Government ID number', optional: false },
};

const ID_TYPES = new Set(['national_id', 'passport', 'drivers_license']);

function statusFor(c) {
  return c.first_name && c.last_name && c.id_type && c.id_number ? 'ACCEPTED' : 'NEEDS_INFO';
}

/** SEP-12 GET /customer — status lookup by id. */
export async function GET(request) {
  const account = await requireAuth(request);
  if (!account) return json({ error: 'authentication required' }, 401);
  const params = new URL(request.url).searchParams;
  const id = params.get('id');
  if (!id) return json({ error: 'id required' }, 400);
  const { rows } = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
  const c = rows[0];
  if (!c) return json({ error: 'customer not found' }, 404);
  if (statusFor(c) === 'ACCEPTED') {
    return json({ id: c.id, status: 'ACCEPTED', provided_fields: {} });
  }
  const missing = Object.fromEntries(
    Object.entries(REQUIRED_FIELDS).filter(([k]) => !c[k]),
  );
  return json({ id: c.id, status: 'NEEDS_INFO', fields: missing });
}

/** SEP-12 PUT /customer — create/update; ACCEPT when names + government ID are present. */
export async function PUT(request) {
  const account = await requireAuth(request);
  if (!account) return json({ error: 'authentication required' }, 401);
  const body = await request.json().catch(() => ({}));
  const first = (body.first_name ?? '').trim();
  const last = (body.last_name ?? '').trim();
  const idType = (body.id_type ?? '').trim();
  const idNumber = (body.id_number ?? '').trim();
  const type = body.type ?? '';

  if (idType && !ID_TYPES.has(idType)) {
    return json({ error: `id_type must be one of: ${[...ID_TYPES].join(', ')}` }, 400);
  }

  if (body.id) {
    const { rows } = await db.query(
      `UPDATE customers SET
         first_name = COALESCE(NULLIF($2, ''), first_name),
         last_name  = COALESCE(NULLIF($3, ''), last_name),
         id_type    = COALESCE(NULLIF($4, ''), id_type),
         id_number  = COALESCE(NULLIF($5, ''), id_number)
       WHERE id = $1 RETURNING *`,
      [body.id, first, last, idType, idNumber],
    );
    if (!rows[0]) return json({ error: 'customer not found' }, 404);
    await db.query('UPDATE customers SET status = $2 WHERE id = $1', [rows[0].id, statusFor(rows[0])]);
    return json({ id: rows[0].id });
  }

  const { rows } = await db.query(
    `INSERT INTO customers (account, type, first_name, last_name, id_type, id_number)
     VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, '')) RETURNING *`,
    [body.account ?? account, type, first, last, idType, idNumber],
  );
  await db.query('UPDATE customers SET status = $2 WHERE id = $1', [rows[0].id, statusFor(rows[0])]);
  return json({ id: rows[0].id });
}

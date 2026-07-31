import { AppError } from '@/server/lib/http';
import type { AnchorToml } from './toml';

export type CustomerFields = Record<string, string>;

/**
 * SEP-12: register (or update) KYC data for the receiving customer. Required
 * before a SEP-31 send — the anchor rejects `POST /transactions` for an
 * unregistered receiver. `fields` is anchor-specific; call `GET /customer`
 * first (not wrapped here — not needed by Bakti's fixed-anchor flow) to learn
 * which fields a given anchor requires.
 */
export async function putCustomer(
  anchorToml: AnchorToml,
  jwt: string,
  fields: CustomerFields,
): Promise<{ customerId: string }> {
  const url = `${anchorToml.kycServer}/customer`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(fields),
    });
  } catch (cause) {
    throw new AppError('INTERNAL', `Could not reach SEP-12 endpoint at ${url}`, 502, cause);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError(
      'INVALID_INPUT',
      `SEP-12 customer registration rejected (${res.status})${detail ? `: ${detail}` : ''}`,
      res.status === 401 ? 401 : 400,
    );
  }

  const body = (await res.json()) as { id?: string };
  if (!body.id) {
    throw new AppError('INTERNAL', 'SEP-12 response is missing "id"', 502);
  }
  return { customerId: body.id };
}

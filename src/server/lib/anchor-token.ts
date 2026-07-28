import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '@/server/config/env';

/**
 * Self-hosted anchor stub's bearer token: not a real JWT, just an HMAC-signed
 * `{account, exp}` payload keyed off the app's own SESSION_SECRET. No DB
 * round-trip needed to verify — the signature and expiry are the whole check.
 */

type Payload = { account: string; exp: number };

function sign(payloadB64: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(payloadB64).digest('hex');
}

export function issueToken(account: string, ttlSeconds: number): string {
  const payload: Payload = { account, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expectedSig = sign(payloadB64);
  const sigBuf = Buffer.from(sig, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload.account !== 'string' || typeof payload.exp !== 'number') return null;
  if (payload.exp < Date.now() / 1000) return null;
  return payload.account;
}

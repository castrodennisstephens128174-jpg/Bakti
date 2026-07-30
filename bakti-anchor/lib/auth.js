import { jwtVerify, SignJWT } from 'jose';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function issueJwt(account, homeDomain) {
  return new SignJWT({ sub: account })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(`https://${homeDomain}/auth`)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret());
}

/** Returns the authenticated Stellar account or null. */
export async function requireAuth(request) {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function hostOf(request) {
  return request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost';
}

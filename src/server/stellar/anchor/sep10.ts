import { type Keypair, WebAuth } from '@stellar/stellar-sdk';
import { AppError } from '@/server/lib/http';
import type { AnchorToml } from './toml';

/**
 * SEP-10: authenticate Bakti's own signing key with an anchor and return a
 * bearer JWT. This is anchor-to-anchor auth (SEP-31 is anchor-to-anchor) —
 * `signingKeypair` is Bakti's own business key, not an end-user's wallet.
 */
export async function authenticate(
  anchorToml: AnchorToml,
  signingKeypair: Keypair,
  opts: { networkPassphrase: string; homeDomain: string },
): Promise<string> {
  const { networkPassphrase, homeDomain } = opts;

  const challengeUrl = new URL(anchorToml.webAuthEndpoint);
  challengeUrl.searchParams.set('account', signingKeypair.publicKey());
  challengeUrl.searchParams.set('home_domain', homeDomain);

  let getRes: Response;
  try {
    getRes = await fetch(challengeUrl.toString());
  } catch (cause) {
    throw new AppError(
      'INTERNAL',
      `Could not reach SEP-10 endpoint at ${anchorToml.webAuthEndpoint}`,
      502,
      cause,
    );
  }
  if (!getRes.ok) {
    throw new AppError('INTERNAL', `SEP-10 challenge request failed (${getRes.status})`, 502);
  }
  const { transaction: challengeXdr } = (await getRes.json()) as { transaction?: string };
  if (!challengeXdr) {
    throw new AppError('INTERNAL', 'SEP-10 challenge response is missing "transaction"', 502);
  }

  let tx: ReturnType<typeof WebAuth.readChallengeTx>['tx'];
  try {
    ({ tx } = WebAuth.readChallengeTx(
      challengeXdr,
      anchorToml.signingKey,
      networkPassphrase,
      homeDomain,
      homeDomain,
    ));
  } catch (cause) {
    throw new AppError('UNAUTHORIZED', 'SEP-10 challenge failed validation', 401, cause);
  }

  tx.sign(signingKeypair);

  let postRes: Response;
  try {
    postRes = await fetch(anchorToml.webAuthEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: tx.toXDR() }),
    });
  } catch (cause) {
    throw new AppError(
      'INTERNAL',
      `Could not submit signed SEP-10 challenge to ${anchorToml.webAuthEndpoint}`,
      502,
      cause,
    );
  }
  if (!postRes.ok) {
    throw new AppError('UNAUTHORIZED', `SEP-10 authentication rejected (${postRes.status})`, 401);
  }
  const { token } = (await postRes.json()) as { token?: string };
  if (!token) {
    throw new AppError('UNAUTHORIZED', 'SEP-10 response is missing "token"', 401);
  }
  return token;
}

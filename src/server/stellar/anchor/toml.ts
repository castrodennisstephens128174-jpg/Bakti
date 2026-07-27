import { parse } from 'smol-toml';
import { AppError } from '@/server/lib/http';

export type AnchorCurrency = {
  code: string;
  issuer?: string;
};

export type AnchorToml = {
  signingKey: string;
  webAuthEndpoint: string;
  directPaymentServer: string;
  kycServer: string;
  currencies: AnchorCurrency[];
};

function anchorBaseUrl(homeDomain: string): string {
  const isLocal = homeDomain.startsWith('localhost') || homeDomain.startsWith('127.0.0.1');
  return `${isLocal ? 'http' : 'https'}://${homeDomain}`;
}

/**
 * SEP-1: fetch and parse an anchor's `/.well-known/stellar.toml`. Only the
 * fields Bakti's SEP-10/12/31 client flow needs are surfaced; everything else
 * in the TOML is ignored.
 */
export async function fetchAnchorToml(homeDomain: string): Promise<AnchorToml> {
  const url = `${anchorBaseUrl(homeDomain)}/.well-known/stellar.toml`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new AppError('INTERNAL', `Could not reach anchor TOML at ${url}`, 502, cause);
  }
  if (!res.ok) {
    throw new AppError('NOT_FOUND', `Anchor TOML not found at ${url} (${res.status})`, 502);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = parse(await res.text()) as Record<string, unknown>;
  } catch (cause) {
    throw new AppError('INVALID_INPUT', `Anchor TOML at ${url} is not valid TOML`, 502, cause);
  }

  const signingKey = parsed.SIGNING_KEY;
  const webAuthEndpoint = parsed.WEB_AUTH_ENDPOINT;
  const directPaymentServer = parsed.DIRECT_PAYMENT_SERVER;
  const kycServer = parsed.KYC_SERVER;
  if (
    typeof signingKey !== 'string' ||
    typeof webAuthEndpoint !== 'string' ||
    typeof directPaymentServer !== 'string' ||
    typeof kycServer !== 'string'
  ) {
    throw new AppError(
      'INVALID_INPUT',
      `Anchor TOML at ${url} is missing a required SEP-31 field (SIGNING_KEY, WEB_AUTH_ENDPOINT, DIRECT_PAYMENT_SERVER, or KYC_SERVER)`,
      502,
    );
  }

  const currenciesRaw = parsed.CURRENCIES;
  const currencies: AnchorCurrency[] = Array.isArray(currenciesRaw)
    ? currenciesRaw
        .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
        .filter((c) => typeof c.code === 'string')
        .map((c) => ({
          code: c.code as string,
          issuer: typeof c.issuer === 'string' ? c.issuer : undefined,
        }))
    : [];

  return { signingKey, webAuthEndpoint, directPaymentServer, kycServer, currencies };
}

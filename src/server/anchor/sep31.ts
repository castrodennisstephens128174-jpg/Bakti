import { Keypair, Transaction, TransactionBuilder } from '@stellar/stellar-sdk';
import { env } from '@/server/config/env';
import { AppError } from '@/server/lib/http';

/**
 * SEP-31 sending-side client. Bakti is the sending organization: it
 * authenticates to the partner (receiving) anchor with SEP-10 using the
 * platform key, registers sender/receiver KYC through SEP-12, opens a SEP-31
 * transaction, and the USER then pays the anchor's Stellar account with the
 * memo the anchor issued. Testnet-only until the partner integration is live.
 */

export type AnchorEndpoints = {
  domain: string;
  webAuth: string;
  kycServer: string;
  directPayment: string;
  signingKey: string;
  /** The anchor's receiving Stellar accounts (SEP-1 ACCOUNTS). */
  accounts: string[];
};

export type Sep31Created = {
  id: string;
  stellarAccountId: string;
  stellarMemo: string;
  stellarMemoType: 'text' | 'id' | 'hash';
};

export type Sep31Status = {
  id: string;
  status: string;
  stellarTransactionId: string | null;
  externalTransactionId: string | null;
};

export function sep31Enabled(): boolean {
  return Boolean(env.SEP31_ANCHOR_DOMAIN && env.SEP31_SENDING_SECRET);
}

function anchorDomain(): string {
  if (!env.SEP31_ANCHOR_DOMAIN) {
    throw new AppError('INTERNAL', 'SEP31_ANCHOR_DOMAIN is not configured', 500);
  }
  return env.SEP31_ANCHOR_DOMAIN;
}

// ---------------------------------------------------------------------------
// SEP-1: discover the anchor's endpoints from its stellar.toml
// ---------------------------------------------------------------------------

const tomlCache = new Map<string, { at: number; value: AnchorEndpoints }>();
const TOML_TTL_MS = 5 * 60_000;

function tomlValue(toml: string, key: string): string {
  const m = toml.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm'));
  return m?.[1] ?? '';
}

export async function fetchAnchorEndpoints(): Promise<AnchorEndpoints> {
  const domain = anchorDomain();
  const hit = tomlCache.get(domain);
  if (hit && Date.now() - hit.at < TOML_TTL_MS) return hit.value;

  const res = await fetch(`https://${domain}/.well-known/stellar.toml`);
  if (!res.ok) throw new AppError('INTERNAL', `Anchor stellar.toml unreachable (${res.status})`, 502);
  const toml = await res.text();
  const accountsMatch = toml.match(/^ACCOUNTS\s*=\s*\[([^\]]*)\]/m);
  const accounts = accountsMatch
    ? [...accountsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const endpoints: AnchorEndpoints = {
    domain,
    webAuth: tomlValue(toml, 'WEB_AUTH_ENDPOINT'),
    kycServer: tomlValue(toml, 'KYC_SERVER'),
    directPayment: tomlValue(toml, 'DIRECT_PAYMENT_SERVER'),
    signingKey: tomlValue(toml, 'SIGNING_KEY'),
    accounts,
  };
  if (!endpoints.webAuth || !endpoints.directPayment || !endpoints.kycServer) {
    throw new AppError('INTERNAL', 'Anchor stellar.toml is missing SEP-31 endpoints', 502);
  }
  tomlCache.set(domain, { at: Date.now(), value: endpoints });
  return endpoints;
}

// ---------------------------------------------------------------------------
// SEP-10: platform authentication -> JWT (cached until near expiry)
// ---------------------------------------------------------------------------

const jwtCache = new Map<string, { at: number; token: string }>();
const JWT_TTL_MS = 20 * 60 * 60_000;

export async function getAnchorJwt(): Promise<string> {
  const domain = anchorDomain();
  const hit = jwtCache.get(domain);
  if (hit && Date.now() - hit.at < JWT_TTL_MS) return hit.token;

  if (!env.SEP31_SENDING_SECRET) {
    throw new AppError('INTERNAL', 'SEP31_SENDING_SECRET is not configured', 500);
  }
  const endpoints = await fetchAnchorEndpoints();
  const kp = Keypair.fromSecret(env.SEP31_SENDING_SECRET);

  const chRes = await fetch(`${endpoints.webAuth}?account=${kp.publicKey()}`);
  if (!chRes.ok) throw new AppError('INTERNAL', `SEP-10 challenge failed (${chRes.status})`, 502);
  const ch = (await chRes.json()) as { transaction: string; network_passphrase: string };

  const tx = TransactionBuilder.fromXDR(ch.transaction, ch.network_passphrase);
  // The challenge must come from the anchor's published SIGNING_KEY —
  // refuse to sign anything else blindly. (Fee-bump challenges are invalid.)
  if (!(tx instanceof Transaction) || tx.source !== endpoints.signingKey) {
    throw new AppError('INTERNAL', 'SEP-10 challenge not from anchor SIGNING_KEY', 502);
  }
  tx.sign(kp);

  const tokRes = await fetch(endpoints.webAuth, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transaction: tx.toXDR() }),
  });
  if (!tokRes.ok) throw new AppError('INTERNAL', `SEP-10 token exchange failed (${tokRes.status})`, 502);
  const { token } = (await tokRes.json()) as { token: string };
  if (!token) throw new AppError('INTERNAL', 'SEP-10 returned no token', 502);
  jwtCache.set(domain, { at: Date.now(), token });
  return token;
}

// ---------------------------------------------------------------------------
// SEP-12: register sender/receiver customers
// ---------------------------------------------------------------------------

export async function putCustomer(params: {
  type: string;
  firstName: string;
  lastName: string;
  idType?: string;
  idNumber?: string;
  id?: string;
}): Promise<string> {
  const endpoints = await fetchAnchorEndpoints();
  const token = await getAnchorJwt();
  const res = await fetch(`${endpoints.kycServer}/customer`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      ...(params.id ? { id: params.id } : {}),
      type: params.type,
      first_name: params.firstName,
      last_name: params.lastName,
      ...(params.idType ? { id_type: params.idType } : {}),
      ...(params.idNumber ? { id_number: params.idNumber } : {}),
    }),
  });
  if (!res.ok) {
    throw new AppError('INTERNAL', `SEP-12 customer registration failed (${res.status})`, 502);
  }
  const { id } = (await res.json()) as { id: string };
  return id;
}

// ---------------------------------------------------------------------------
// SEP-31: transactions
// ---------------------------------------------------------------------------

export async function createSep31Transaction(params: {
  assetCode: 'XLM' | 'USDC';
  assetIssuer?: string;
  amount: string;
  senderId: string;
  receiverId: string;
}): Promise<Sep31Created> {
  const endpoints = await fetchAnchorEndpoints();
  const token = await getAnchorJwt();
  const res = await fetch(`${endpoints.directPayment}/transactions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({
      asset_code: params.assetCode === 'XLM' ? 'native' : params.assetCode,
      ...(params.assetIssuer ? { asset_issuer: params.assetIssuer } : {}),
      amount: params.amount,
      sender_id: params.senderId,
      receiver_id: params.receiverId,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const detail = typeof body.error === 'string' ? body.error : `status ${res.status}`;
    throw new AppError('INVALID_INPUT', `Anchor rejected the transaction: ${detail}`, 502);
  }
  if (!body.id || !body.stellar_account_id || !body.stellar_memo) {
    throw new AppError('INTERNAL', 'Anchor did not return payment instructions', 502);
  }
  return {
    id: String(body.id),
    stellarAccountId: String(body.stellar_account_id),
    stellarMemo: String(body.stellar_memo),
    stellarMemoType: (body.stellar_memo_type as Sep31Created['stellarMemoType']) ?? 'text',
  };
}

export async function getSep31Transaction(id: string): Promise<Sep31Status> {
  const endpoints = await fetchAnchorEndpoints();
  const token = await getAnchorJwt();
  const res = await fetch(`${endpoints.directPayment}/transactions/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new AppError('INTERNAL', `Anchor status lookup failed (${res.status})`, 502);
  const { transaction } = (await res.json()) as {
    transaction: {
      id: string;
      status: string;
      stellar_transaction_id?: string | null;
      external_transaction_id?: string | null;
    };
  };
  return {
    id: transaction.id,
    status: transaction.status,
    stellarTransactionId: transaction.stellar_transaction_id ?? null,
    externalTransactionId: transaction.external_transaction_id ?? null,
  };
}

/** SEP-31: register a status-callback URL so the anchor pushes updates to us. */
export async function registerSep31Callback(id: string, url: string): Promise<void> {
  const endpoints = await fetchAnchorEndpoints();
  const token = await getAnchorJwt();
  await fetch(`${endpoints.directPayment}/transactions/${id}/callback`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ url }),
  }).catch(() => {
    /* callback is an optimization — polling still covers us */
  });
}

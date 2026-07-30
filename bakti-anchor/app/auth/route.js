import { randomBytes } from 'node:crypto';
import {
  Account,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { hostOf, issueJwt } from '../../lib/auth';

export const dynamic = 'force-dynamic';

const json = (body, status = 200) =>
  Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } });

/** SEP-10: GET challenge. */
export async function GET(request) {
  const account = new URL(request.url).searchParams.get('account');
  if (!account || !StrKey.isValidEd25519PublicKey(account)) {
    return json({ error: 'invalid account' }, 400);
  }
  const host = hostOf(request);
  const server = Keypair.fromSecret(process.env.ANCHOR_SIGNING_SECRET);
  const tx = new TransactionBuilder(new Account(server.publicKey(), '-1'), {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
    timebounds: { minTime: Math.floor(Date.now() / 1000), maxTime: Math.floor(Date.now() / 1000) + 900 },
  })
    .addOperation(
      Operation.manageData({
        source: account,
        name: `${host} auth`,
        value: randomBytes(48).toString('base64'),
      }),
    )
    .addOperation(
      Operation.manageData({ source: server.publicKey(), name: 'web_auth_domain', value: host }),
    )
    .build();
  tx.sign(server);
  return json({ transaction: tx.toXDR(), network_passphrase: Networks.TESTNET });
}

/** SEP-10: POST signed challenge -> JWT. */
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!body.transaction) return json({ error: 'transaction required' }, 400);
  const server = Keypair.fromSecret(process.env.ANCHOR_SIGNING_SECRET);
  let tx;
  try {
    tx = TransactionBuilder.fromXDR(body.transaction, Networks.TESTNET);
  } catch {
    return json({ error: 'invalid challenge XDR' }, 400);
  }
  if (tx.source !== server.publicKey()) return json({ error: 'bad challenge source' }, 400);
  const op = tx.operations[0];
  if (!op || op.type !== 'manageData' || !op.name.endsWith(' auth') || !op.source) {
    return json({ error: 'bad challenge operation' }, 400);
  }
  const client = op.source;
  const hash = tx.hash();
  const serverOk = tx.signatures.some((s) => {
    try {
      return server.verify(hash, s.signature());
    } catch {
      return false;
    }
  });
  const clientOk = tx.signatures.some((s) => {
    try {
      return Keypair.fromPublicKey(client).verify(hash, s.signature());
    } catch {
      return false;
    }
  });
  if (!serverOk || !clientOk) return json({ error: 'missing required signatures' }, 401);
  const token = await issueJwt(client, hostOf(request));
  return json({ token });
}

import { randomBytes } from 'node:crypto';
import { Address, Keypair, scValToNative, xdr } from '@stellar/stellar-sdk';
import { db } from './db';

export function transactionBody(tx) {
  return {
    transaction: {
      id: tx.id,
      status: tx.status,
      status_eta: tx.status === 'completed' ? null : 60,
      amount_in: tx.amount,
      amount_in_asset:
        tx.asset_code === 'native' ? 'stellar:native' : `stellar:${tx.asset_code}:${tx.asset_issuer ?? ''}`,
      amount_out: tx.amount,
      amount_fee: '0',
      stellar_account_id: tx.stellar_account_id,
      stellar_memo_type: tx.stellar_memo_type,
      stellar_memo: tx.stellar_memo,
      stellar_transaction_id: tx.stellar_transaction_id,
      external_transaction_id: tx.external_transaction_id,
      started_at: tx.created_at,
      completed_at: tx.status === 'completed' ? tx.updated_at : null,
    },
  };
}

const HORIZON = 'https://horizon-testnet.stellar.org';
const RPC = 'https://soroban-testnet.stellar.org';
const NATIVE_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

/**
 * Settlement detection for a pending SEP-31 transaction. Two ways money can
 * arrive, mirroring what a production anchor observer supports:
 *
 *   A. Classic payment to RECEIVE_ACCOUNT carrying the memo (manual/relay path)
 *   B. Soroban contract payment: a native-SAC `transfer` event credits
 *      RECEIVE_ACCOUNT and the invoking transaction's envelope memo matches
 *      (the bakti escrow keeper path)
 */

async function findClassicPayment(tx) {
  const res = await fetch(
    `${HORIZON}/accounts/${tx.stellar_account_id}/transactions?order=desc&limit=50&include_failed=false`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  const hit = (data._embedded?.records ?? []).find(
    (r) => r.memo_type === 'text' && r.memo === tx.stellar_memo,
  );
  if (!hit) return null;

  const opsRes = await fetch(`${HORIZON}/transactions/${hit.hash}/payments?limit=20`);
  if (!opsRes.ok) return null;
  const ops = (await opsRes.json())._embedded?.records ?? [];
  const paid = ops.find((op) => {
    if (op.type !== 'payment' || op.to !== tx.stellar_account_id) return false;
    const assetOk =
      tx.asset_code === 'native'
        ? op.asset_type === 'native'
        : op.asset_code === tx.asset_code && (!tx.asset_issuer || op.asset_issuer === tx.asset_issuer);
    return assetOk && Number.parseFloat(op.amount) >= Number.parseFloat(tx.amount);
  });
  return paid ? hit.hash : null;
}

async function rpcCall(method, params) {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) return null;
  return (await res.json()).result ?? null;
}

/**
 * B: Soroban path. Find native-SAC `transfer` events crediting our account,
 * then look for a companion contract event in the SAME transaction whose data
 * carries the settlement memo string. (Soroban transactions cannot carry an
 * envelope memo — the escrow contract emits the memo in its `released` event,
 * which is exactly what a Soroban-aware anchor observer must read.)
 */
async function findContractPayment(tx) {
  if (tx.asset_code !== 'native') return null;

  const latest = (await rpcCall('getLatestLedger', {}))?.sequence;
  if (!latest) return null;

  const toTopic = new Address(tx.stellar_account_id).toScVal().toXDR('base64');
  const result = await rpcCall('getEvents', {
    startLedger: Math.max(1, latest - 8000),
    filters: [
      {
        type: 'contract',
        contractIds: [NATIVE_SAC],
        // transfer(from, to, sep0011-asset) — wildcard everything but `to`
        topics: [['*', '*', toTopic, '*']],
      },
    ],
    pagination: { limit: 100 },
  });
  const transfers = result?.events ?? [];
  const wantStroops = BigInt(Math.round(Number.parseFloat(tx.amount) * 10_000_000));

  for (const ev of transfers.reverse()) {
    const hash = ev.txHash;
    if (!hash) continue;
    // Amount check straight from the SAC event value (i128 stroops).
    try {
      const amount = scValToNative(xdr.ScVal.fromXDR(ev.value, 'base64'));
      if (BigInt(amount) < wantStroops) continue;
    } catch {
      continue;
    }
    if (await txCarriesMemo(ev.ledger, hash, tx.stellar_memo)) return hash;
  }
  return null;
}

/** Does any contract event in this transaction carry the memo string? */
async function txCarriesMemo(ledger, hash, memo) {
  const result = await rpcCall('getEvents', {
    startLedger: ledger,
    endLedger: ledger + 1,
    filters: [{ type: 'contract' }],
    pagination: { limit: 200 },
  });
  for (const ev of result?.events ?? []) {
    if (ev.txHash !== hash) continue;
    try {
      const value = scValToNative(xdr.ScVal.fromXDR(ev.value, 'base64'));
      const haystack = Array.isArray(value) ? value : [value];
      if (haystack.some((v) => typeof v === 'string' && v === memo)) return true;
    } catch {
      /* not a decodable value — skip */
    }
  }
  return false;
}

/** Fire the registered status callback, signed per SEP-31 (`t=…, s=…`). */
export async function fireCallback(tx) {
  if (!tx.callback_url) return;
  try {
    const body = JSON.stringify(transactionBody(tx));
    const t = Math.floor(Date.now() / 1000);
    const host = new URL(tx.callback_url).hostname;
    const payload = `${t}.${host}.${body}`;
    const kp = Keypair.fromSecret(process.env.ANCHOR_SIGNING_SECRET);
    const sig = kp.sign(Buffer.from(payload, 'utf8')).toString('base64');
    await fetch(tx.callback_url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', signature: `t=${t}, s=${sig}` },
      body,
    });
  } catch {
    /* best-effort — the sender still has polling */
  }
}

export async function detectAndSettle(tx) {
  let hash = await findClassicPayment(tx);
  if (!hash) hash = await findContractPayment(tx);
  if (!hash) return tx;

  const pickupRef = `PICKUP-${randomBytes(3).toString('hex').toUpperCase()}`;
  const { rows } = await db.query(
    `UPDATE sep31_transactions
       SET status = 'completed', stellar_transaction_id = $2, external_transaction_id = $3, updated_at = now()
     WHERE id = $1 AND status IN ('pending_sender','pending_stellar') RETURNING *`,
    [tx.id, hash, pickupRef],
  );
  const settled = rows[0] ?? tx;
  if (rows[0]) await fireCallback(settled);
  return settled;
}

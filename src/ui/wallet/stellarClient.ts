'use client';

import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import type { AssetCode } from '@/ui/lib/format';
import { getClientNetworkConfig } from '@/ui/network/client-network';
import type { BaktiNetworkId } from '@/shared/network-config';

// Resolved per call so the header's Mainnet/Testnet toggle takes effect
// without a rebuild. Callers touching an existing allowance pass its stored
// network so old plans keep working whatever the toggle says. Signing stays
// PINNED to the resolved network, never the wallet's own selection.
function cfg(net?: BaktiNetworkId) {
  return getClientNetworkConfig(net);
}

function passphrase(net?: BaktiNetworkId): string {
  return cfg(net).passphrase;
}

function server(net?: BaktiNetworkId) {
  return new Horizon.Server(cfg(net).horizonUrl);
}

function assetFor(code: AssetCode, net?: BaktiNetworkId): Asset {
  const c = cfg(net);
  return code === 'XLM' ? Asset.native() : new Asset(c.usdcCode, c.usdcIssuer);
}

export class WalletError extends Error {}

export async function ensureFreighter(): Promise<void> {
  const res = await isConnected();
  if (!res.isConnected) {
    throw new WalletError(
      'Freighter wallet not detected. Install the Freighter extension to connect.',
    );
  }
}

export async function requestPublicKey(): Promise<string> {
  const res = await requestAccess();
  if (res.error || !res.address) {
    throw new WalletError(res.error?.message ?? 'Wallet connection was rejected.');
  }
  return res.address;
}

/** Sign an XDR with Freighter, pinning the passphrase to the app network. */
export async function sign(xdr: string, address: string, net?: BaktiNetworkId): Promise<string> {
  const res = await signTransaction(xdr, { networkPassphrase: passphrase(net), address });
  if (res.error || !res.signedTxXdr) {
    throw new WalletError(res.error?.message ?? 'Signing was rejected in the wallet.');
  }
  return res.signedTxXdr;
}

async function loadAccount(pubkey: string, net?: BaktiNetworkId) {
  try {
    return await server(net).loadAccount(pubkey);
  } catch {
    throw new WalletError(
      'Your wallet is not funded on this network yet. On testnet, fund it with the Friendbot and try again.',
    );
  }
}

async function submit(signedXdr: string, net?: BaktiNetworkId): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, passphrase(net));
  try {
    const res = await server(net).submitTransaction(tx);
    return res.hash;
  } catch (e: unknown) {
    const codes = (
      e as { response?: { data?: { extras?: { result_codes?: { operations?: string[] } } } } }
    )?.response?.data?.extras?.result_codes;
    const ops = codes?.operations ?? [];
    if (ops.includes('op_no_trust')) {
      throw new WalletError(
        'The recipient has no USDC trustline yet. Send in XLM, or ask them to enable USDC.',
      );
    }
    if (ops.includes('op_no_destination')) {
      throw new WalletError('The recipient account does not exist on this network yet.');
    }
    if (ops.includes('op_underfunded')) {
      throw new WalletError('Not enough balance for this allowance (remember the network fee).');
    }
    throw new WalletError('Stellar rejected the transaction. Check your balance and try again.');
  }
}

/**
 * Build -> sign -> submit ONE payment that sends this month's allowance to the
 * parent's Stellar address. Returns the real on-chain transaction hash.
 */
export async function sendAllowance(params: {
  from: string;
  to: string;
  asset: AssetCode;
  amount: string;
  memo: string;
  memoType?: 'text' | 'id' | 'hash';
  network?: BaktiNetworkId;
}): Promise<string> {
  const net = params.network;
  const account = await loadAccount(params.from, net);
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: passphrase(net),
  })
    .addOperation(
      Operation.payment({
        destination: params.to,
        asset: assetFor(params.asset, net),
        amount: params.amount,
      }),
    )
    .addMemo(
      params.memoType === 'id'
        ? Memo.id(params.memo)
        : params.memoType === 'hash'
          ? Memo.hash(Buffer.from(params.memo, 'base64').toString('hex'))
          : Memo.text(params.memo.slice(0, 28)),
    )
    .setTimeout(180)
    .build();

  const signed = await sign(tx.toXDR(), params.from, net);
  return submit(signed, net);
}

/** Build -> sign -> submit a changeTrust so the wallet can hold USDC. */
export async function enableUsdc(from: string, net?: BaktiNetworkId): Promise<string> {
  const account = await loadAccount(from, net);
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: passphrase(net),
  })
    .addOperation(
      Operation.changeTrust({ asset: assetFor('USDC', net) }),
    )
    .setTimeout(120)
    .build();
  const signed = await sign(tx.toXDR(), from, net);
  return submit(signed, net);
}

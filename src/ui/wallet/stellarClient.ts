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
import { publicEnv } from '@/server/config/env.public';
import type { AssetCode } from '@/ui/lib/format';

const PASSPHRASE = publicEnv.networkPassphrase; // PINNED to the app network, not the wallet's.

function server() {
  return new Horizon.Server(publicEnv.horizonUrl);
}

function assetFor(code: AssetCode): Asset {
  return code === 'XLM' ? Asset.native() : new Asset(publicEnv.usdcCode, publicEnv.usdcIssuer);
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
export async function sign(xdr: string, address: string): Promise<string> {
  const res = await signTransaction(xdr, { networkPassphrase: PASSPHRASE, address });
  if (res.error || !res.signedTxXdr) {
    throw new WalletError(res.error?.message ?? 'Signing was rejected in the wallet.');
  }
  return res.signedTxXdr;
}

async function loadAccount(pubkey: string) {
  try {
    return await server().loadAccount(pubkey);
  } catch {
    throw new WalletError(
      'Your wallet is not funded on testnet yet. Fund it with the Friendbot, then try again.',
    );
  }
}

async function submit(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, PASSPHRASE);
  try {
    const res = await server().submitTransaction(tx);
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
      throw new WalletError('The recipient account does not exist on testnet yet.');
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
}): Promise<string> {
  const account = await loadAccount(params.from);
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: params.to,
        asset: assetFor(params.asset),
        amount: params.amount,
      }),
    )
    .addMemo(Memo.text(params.memo.slice(0, 28)))
    .setTimeout(180)
    .build();

  const signed = await sign(tx.toXDR(), params.from);
  return submit(signed);
}

/** Build -> sign -> submit a changeTrust so the wallet can hold USDC. */
export async function enableUsdc(from: string): Promise<string> {
  const account = await loadAccount(from);
  const tx = new TransactionBuilder(account, {
    fee: (Number(BASE_FEE) * 10).toString(),
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({ asset: new Asset(publicEnv.usdcCode, publicEnv.usdcIssuer) }),
    )
    .setTimeout(120)
    .build();
  const signed = await sign(tx.toXDR(), from);
  return submit(signed);
}

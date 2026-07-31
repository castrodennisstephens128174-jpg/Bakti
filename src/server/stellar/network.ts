import { Asset } from '@stellar/stellar-sdk';
import {
  env,
  NATIVE_SAC_ID_VALUE,
  SOROBAN_BAKTI_CONTRACT_ID_VALUE,
  SOROBAN_RPC_URL_VALUE,
  STELLAR_HORIZON_URL_VALUE,
  STELLAR_NETWORK_PASSPHRASE_VALUE,
  USDC_ASSET_ISSUER_VALUE,
} from '@/server/config/env';
import type { AllowanceAsset } from '@/server/db/schema/allowances';

/**
 * Single source of truth for everything network-shaped: passphrase, Horizon and
 * Soroban RPC endpoints, the explorer slug, and the Bakti escrow contract id +
 * its native-XLM SAC token. XLM allowances are backed by the escrow contract;
 * USDC allowances stay on the classic payment path.
 */
export const network = {
  id: env.STELLAR_NETWORK,
  passphrase: STELLAR_NETWORK_PASSPHRASE_VALUE,
  horizonUrl: STELLAR_HORIZON_URL_VALUE,
  rpcUrl: SOROBAN_RPC_URL_VALUE,
  explorerSlug: env.STELLAR_NETWORK === 'public' ? 'public' : 'testnet',
} as const;

export const contractIds = {
  bakti: SOROBAN_BAKTI_CONTRACT_ID_VALUE,
  nativeSac: NATIVE_SAC_ID_VALUE,
  admin: env.BAKTI_ADMIN_PUBLIC_KEY,
} as const;

export function getNetworkPassphrase(): string {
  return network.passphrase;
}

export function resolveAsset(code: AllowanceAsset): Asset {
  if (code === 'XLM') return Asset.native();
  return new Asset(env.USDC_ASSET_CODE, USDC_ASSET_ISSUER_VALUE);
}

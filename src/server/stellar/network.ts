import { Asset, Networks } from '@stellar/stellar-sdk';
import { env, NATIVE_SAC_ID_VALUE, USDC_ASSET_ISSUER_VALUE } from '@/server/config/env';
import type { AllowanceAsset } from '@/server/db/schema/allowances';

const PASSPHRASE_BY_NETWORK = {
  testnet: Networks.TESTNET,
  public: Networks.PUBLIC,
  futurenet: Networks.FUTURENET,
} as const;

/**
 * Single source of truth for everything network-shaped: passphrase, Horizon and
 * Soroban RPC endpoints, the explorer slug, and the Bakti escrow contract id +
 * its native-XLM SAC token. XLM allowances are backed by the escrow contract;
 * USDC allowances stay on the classic payment path.
 */
export const network = {
  id: env.STELLAR_NETWORK,
  passphrase: env.STELLAR_NETWORK_PASSPHRASE || PASSPHRASE_BY_NETWORK[env.STELLAR_NETWORK],
  horizonUrl: env.STELLAR_HORIZON_URL,
  rpcUrl: env.SOROBAN_RPC_URL,
  explorerSlug: env.STELLAR_NETWORK === 'public' ? 'public' : 'testnet',
} as const;

export const contractIds = {
  bakti: env.SOROBAN_BAKTI_CONTRACT_ID,
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

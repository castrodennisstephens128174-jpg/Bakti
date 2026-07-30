import { Asset, Networks } from '@stellar/stellar-sdk';
import { cookies } from 'next/headers';
import { env, NATIVE_SAC_ID_VALUE, USDC_ASSET_ISSUER_VALUE } from '@/server/config/env';
import type { AllowanceAsset } from '@/server/db/schema/allowances';
import {
  type BaktiNetworkConfig,
  type BaktiNetworkId,
  NETWORK_COOKIE,
  NETWORK_PRESETS,
  normalizeNetworkId,
} from '@/shared/network-config';

const PASSPHRASE_BY_NETWORK = {
  testnet: Networks.TESTNET,
  public: Networks.PUBLIC,
  futurenet: Networks.FUTURENET,
} as const;

/** The network this deployment's env vars are pinned to (its "home" network). */
const ENV_DEFAULT_ID: BaktiNetworkId = normalizeNetworkId(env.STELLAR_NETWORK);

/**
 * Resolve the full config for a network id. Env vars only override the preset
 * of the deployment's home network — the other network always runs on the
 * preset so the toggle works without extra configuration.
 */
export function getNetworkConfig(id: BaktiNetworkId): BaktiNetworkConfig {
  const preset = NETWORK_PRESETS[id];
  if (id !== ENV_DEFAULT_ID) return preset;
  return {
    ...preset,
    passphrase: env.STELLAR_NETWORK_PASSPHRASE || preset.passphrase,
    horizonUrl: env.STELLAR_HORIZON_URL || preset.horizonUrl,
    rpcUrl: env.SOROBAN_RPC_URL || preset.rpcUrl,
    contractId: env.SOROBAN_BAKTI_CONTRACT_ID || preset.contractId,
    nativeSacId: NATIVE_SAC_ID_VALUE || preset.nativeSacId,
    usdcCode: env.USDC_ASSET_CODE || preset.usdcCode,
    usdcIssuer: USDC_ASSET_ISSUER_VALUE || preset.usdcIssuer,
  };
}

/** Network id the user picked with the header toggle (cookie), else the env default. */
export async function getActiveNetworkId(): Promise<BaktiNetworkId> {
  try {
    const jar = await cookies();
    const picked = jar.get(NETWORK_COOKIE)?.value;
    if (picked === 'testnet' || picked === 'public') return picked;
  } catch {
    // Outside a request scope (scripts, tests) — fall through to the env default.
  }
  return ENV_DEFAULT_ID;
}

/** Request-scoped network config: what new work (auth, creations) should use. */
export async function activeNetwork(): Promise<BaktiNetworkConfig> {
  return getNetworkConfig(await getActiveNetworkId());
}

/** Config for a stored network tag (e.g. `allowance.network`) — never the cookie. */
export function networkFor(stored: string | null | undefined): BaktiNetworkConfig {
  return getNetworkConfig(normalizeNetworkId(stored));
}

export function resolveAssetFor(cfg: BaktiNetworkConfig, code: AllowanceAsset): Asset {
  if (code === 'XLM') return Asset.native();
  return new Asset(cfg.usdcCode, cfg.usdcIssuer);
}

// ---------------------------------------------------------------------------
// Legacy env-pinned exports. Existing tests and non-request scripts use these;
// request-path code should prefer activeNetwork()/networkFor().
// ---------------------------------------------------------------------------

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

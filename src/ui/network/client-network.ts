'use client';

import { publicEnv } from '@/server/config/env.public';
import {
  type BaktiNetworkConfig,
  type BaktiNetworkId,
  NETWORK_COOKIE,
  NETWORK_PRESETS,
  normalizeNetworkId,
} from '@/shared/network-config';

/** The network this build's NEXT_PUBLIC_* vars are pinned to. */
const ENV_DEFAULT_ID: BaktiNetworkId = normalizeNetworkId(publicEnv.network);

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`))
    ?.split('=')[1];
}

/** Active network id: the header-toggle cookie, else the build default. */
export function getClientNetworkId(): BaktiNetworkId {
  const picked = readCookie(NETWORK_COOKIE);
  if (picked === 'testnet' || picked === 'public') return picked;
  return ENV_DEFAULT_ID;
}

/**
 * Config for a network id, mirroring the server-side resolution: NEXT_PUBLIC_*
 * overrides only apply to the build's home network, the other one uses presets.
 */
export function getClientNetworkConfig(id: BaktiNetworkId = getClientNetworkId()): BaktiNetworkConfig {
  const preset = NETWORK_PRESETS[id];
  if (id !== ENV_DEFAULT_ID) return preset;
  return {
    ...preset,
    horizonUrl: publicEnv.horizonUrl || preset.horizonUrl,
    usdcCode: publicEnv.usdcCode || preset.usdcCode,
    usdcIssuer: publicEnv.usdcIssuer || preset.usdcIssuer,
    contractId: publicEnv.contractId || preset.contractId,
  };
}

/** Persist the toggle and reload so server components re-render on the new network. */
export function setClientNetworkId(id: BaktiNetworkId): void {
  document.cookie = `${NETWORK_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

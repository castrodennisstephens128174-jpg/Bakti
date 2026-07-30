/**
 * Network presets shared by server and client. This file must stay free of
 * server-only imports (env, node:*) — the browser bundles it for the switch.
 *
 * The user picks the active network with the header toggle; the choice is
 * persisted in the NETWORK_COOKIE so server routes and client code agree.
 * Allowances remember the network they were created on and keep using it,
 * whatever the toggle says later.
 */

export type BaktiNetworkId = 'public' | 'testnet';

export const NETWORK_COOKIE = 'bakti_network';

export type BaktiNetworkConfig = {
  id: BaktiNetworkId;
  label: string;
  passphrase: string;
  horizonUrl: string;
  rpcUrl: string;
  explorerSlug: 'public' | 'testnet';
  contractId: string;
  nativeSacId: string;
  usdcCode: string;
  usdcIssuer: string;
  friendbotUrl: string | null;
};

export const NETWORK_PRESETS: Record<BaktiNetworkId, BaktiNetworkConfig> = {
  public: {
    id: 'public',
    label: 'Mainnet',
    passphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    rpcUrl: 'https://soroban-rpc.creit.tech',
    explorerSlug: 'public',
    contractId: 'CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR',
    nativeSacId: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
    usdcCode: 'USDC',
    usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    friendbotUrl: null,
  },
  testnet: {
    id: 'testnet',
    label: 'Testnet',
    passphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    explorerSlug: 'testnet',
    contractId: 'CB4KH4L4X6FGKLZBTEFPYLOBELIH5LZGXDTTJJY43E4XY66P355QPVA6',
    nativeSacId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    usdcCode: 'USDC',
    usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    friendbotUrl: 'https://friendbot.stellar.org',
  },
};

/** Coerce any stored/env value to a supported network id (mainnet default). */
export function normalizeNetworkId(value: string | undefined | null): BaktiNetworkId {
  return value === 'testnet' ? 'testnet' : 'public';
}

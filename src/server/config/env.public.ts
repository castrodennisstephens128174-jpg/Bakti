/**
 * Public environment values, safe to import in client components.
 * Mirror of the NEXT_PUBLIC_* vars. Never import @/server/config/env in the browser.
 */

const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'public') as
  | 'testnet'
  | 'public'
  | 'futurenet';

const PASSPHRASE_BY_NETWORK: Record<string, string> = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
  futurenet: 'Test SDF Future Network ; October 2022',
};

const HORIZON_BY_NETWORK: Record<string, string> = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
  futurenet: 'https://horizon-futurenet.stellar.org',
};

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Bakti',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005',
  network: NETWORK,
  /** Passphrase PINNED to the app's network — never the wallet's active network. */
  networkPassphrase: PASSPHRASE_BY_NETWORK[NETWORK],
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? HORIZON_BY_NETWORK[NETWORK],
  usdcCode: process.env.NEXT_PUBLIC_USDC_CODE ?? 'USDC',
  usdcIssuer:
    process.env.NEXT_PUBLIC_USDC_ISSUER ??
    'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  /** Deployed bakti-escrow contract backing the on-chain allowance schedule. */
  contractId:
    process.env.NEXT_PUBLIC_BAKTI_CONTRACT_ID ??
    'CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR',
  /** Soroban RPC URL — used by the client for Soroban RPC calls (Freighter signing). */
  sorobanRpcUrl:
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
    'https://soroban-rpc.public.stellar.org',
} as const;

export type PublicEnv = typeof publicEnv;

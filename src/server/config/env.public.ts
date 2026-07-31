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

const RPC_BY_NETWORK: Record<string, string> = {
  testnet: 'https://soroban-testnet.stellar.org',
  public: 'https://mainnet.sorobanrpc.com',
  futurenet: 'https://rpc-futurenet.stellar.org',
};

const USDC_ISSUER_BY_NETWORK: Record<string, string> = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  public: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  futurenet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

const CONTRACT_ID_BY_NETWORK: Record<string, string> = {
  testnet: 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ',
  public: 'CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR',
  futurenet: 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ',
};

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Bakti',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3005',
  network: NETWORK,
  /** Passphrase pinned to the app's configured network, not the wallet's active network. */
  networkPassphrase: PASSPHRASE_BY_NETWORK[NETWORK],
  horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? HORIZON_BY_NETWORK[NETWORK],
  usdcCode: process.env.NEXT_PUBLIC_USDC_CODE ?? 'USDC',
  usdcIssuer: process.env.NEXT_PUBLIC_USDC_ISSUER ?? USDC_ISSUER_BY_NETWORK[NETWORK],
  /** Verified Bakti escrow contract for the configured network. */
  contractId: process.env.NEXT_PUBLIC_BAKTI_CONTRACT_ID ?? CONTRACT_ID_BY_NETWORK[NETWORK],
  sorobanRpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? RPC_BY_NETWORK[NETWORK],
} as const;

export type PublicEnv = typeof publicEnv;

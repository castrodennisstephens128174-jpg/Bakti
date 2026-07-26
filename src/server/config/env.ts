import { z } from 'zod';

const HORIZON_URL_BY_NETWORK = {
  testnet: 'https://horizon-testnet.stellar.org',
  public: 'https://horizon.stellar.org',
  futurenet: 'https://horizon-futurenet.stellar.org',
} as const;

const NETWORK_PASSPHRASE_BY_NETWORK = {
  testnet: 'Test SDF Network ; September 2015',
  public: 'Public Global Stellar Network ; September 2015',
  futurenet: 'Test SDF Future Network ; October 2022',
} as const;

const SOROBAN_RPC_URL_BY_NETWORK = {
  testnet: 'https://soroban-testnet.stellar.org',
  public: 'https://mainnet.sorobanrpc.com',
  futurenet: 'https://rpc-futurenet.stellar.org',
} as const;

const BAKTI_CONTRACT_ID_BY_NETWORK: Record<StellarNetworkId, string> = {
  testnet: 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ',
  public: 'CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR',
  futurenet: 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ',
};

const NATIVE_SAC_ID_BY_NETWORK: Record<StellarNetworkId, string> = {
  testnet: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  public: 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA',
  futurenet: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
};

const USDC_ASSET_ISSUER_BY_NETWORK: Record<StellarNetworkId, string> = {
  testnet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  public: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  futurenet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

type StellarNetworkId = 'testnet' | 'public' | 'futurenet';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Bakti'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3005'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  STELLAR_HORIZON_URL: z.string().url().optional(),
  STELLAR_NETWORK_PASSPHRASE: z.string().optional(),

  SOROBAN_RPC_URL: z.string().url().optional(),

  SOROBAN_BAKTI_CONTRACT_ID: z.string().optional(),
  NEXT_PUBLIC_BAKTI_CONTRACT_ID: z.string().optional(),
  BAKTI_ADMIN_PUBLIC_KEY: z
    .string()
    .default('GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47'),
  NATIVE_SAC_ID: z.string().optional(),

  USDC_ASSET_CODE: z.string().default('USDC'),
  USDC_ASSET_ISSUER: z.string().optional(),

  // Reserved for a future anchor adapter. It is not a current payment destination.
  ANCHOR_COLLECTION_PUBLIC_KEY: z
    .string()
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),

  // Optional keys excluded from public stats (seed / internal demo wallets).
  STATS_EXCLUDE_KEYS: z.string().optional(),

  // Dev/e2e only: when 'true', /api/auth/test-login mints a session without a
  // wallet signature. NEVER set in production — the route 404s otherwise.
  ENABLE_TEST_LOGIN: z.string().optional(),

  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 chars'),
  SESSION_COOKIE_NAME: z.string().default('bakti_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  NONCE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

const rawEnv = parsed.data;
const resolvedNetwork: StellarNetworkId = rawEnv.STELLAR_NETWORK;

/** Resolved Horizon URL for the configured network. Explicit env var wins if set. */
export const STELLAR_HORIZON_URL_VALUE: string =
  rawEnv.STELLAR_HORIZON_URL ?? HORIZON_URL_BY_NETWORK[resolvedNetwork];

/** Resolved network passphrase for the configured network. Explicit env var wins if set. */
export const STELLAR_NETWORK_PASSPHRASE_VALUE: string =
  rawEnv.STELLAR_NETWORK_PASSPHRASE ?? NETWORK_PASSPHRASE_BY_NETWORK[resolvedNetwork];

/** Resolved Soroban RPC URL for the configured network. Explicit env var wins if set. */
export const SOROBAN_RPC_URL_VALUE: string =
  rawEnv.SOROBAN_RPC_URL ?? SOROBAN_RPC_URL_BY_NETWORK[resolvedNetwork];

/** Resolved Bakti escrow contract id for the configured network. Explicit env var wins if set. */
export const SOROBAN_BAKTI_CONTRACT_ID_VALUE: string =
  rawEnv.SOROBAN_BAKTI_CONTRACT_ID ?? BAKTI_CONTRACT_ID_BY_NETWORK[resolvedNetwork];

/** Resolved USDC issuer for the configured network. Explicit env var wins if set. */
export const USDC_ASSET_ISSUER_VALUE: string =
  rawEnv.USDC_ASSET_ISSUER ?? USDC_ASSET_ISSUER_BY_NETWORK[resolvedNetwork];

/** Resolved native XLM Stellar Asset Contract (SAC) id for the configured network. */
export const NATIVE_SAC_ID_VALUE: string =
  rawEnv.NATIVE_SAC_ID ?? NATIVE_SAC_ID_BY_NETWORK[resolvedNetwork];

export const env = rawEnv;
export type Env = typeof env;

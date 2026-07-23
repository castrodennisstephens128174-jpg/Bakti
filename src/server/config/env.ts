import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Bakti'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3005'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  STELLAR_HORIZON_URL: z.string().url().default('https://horizon.stellar.org'),
  STELLAR_NETWORK_PASSPHRASE: z.string().default('Public Global Stellar Network ; September 2015'),

  SOROBAN_RPC_URL: z.string().url().default('https://soroban-rpc.public.stellar.org'),

  // Deployed bakti-escrow Soroban contract that backs the on-chain allowance schedule.
  SOROBAN_BAKTI_CONTRACT_ID: z
    .string()
    .default('CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR'),
  NEXT_PUBLIC_BAKTI_CONTRACT_ID: z
    .string()
    .default('CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR'),
  BAKTI_ADMIN_PUBLIC_KEY: z
    .string()
    .default('GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47'),
  NATIVE_SAC_ID_TESTNET: z
    .string()
    .default('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'),

  USDC_ASSET_CODE: z.string().default('USDC'),
  USDC_ASSET_ISSUER_TESTNET: z
    .string()
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),

  // Anchor G-account that receives allowance deposits for off-ramp cash pickup.
  // On testnet this is a demo collection wallet; SEP-23 muxes it per allowance.
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

/** Resolved USDC issuer for the active Stellar network. */
export const USDC_ASSET_ISSUER_VALUE: string = rawEnv.USDC_ASSET_ISSUER_TESTNET;

/** Native XLM Stellar Asset Contract (SAC) id — the escrow contract's token. */
export const NATIVE_SAC_ID_VALUE: string = rawEnv.NATIVE_SAC_ID_TESTNET;

export const env = rawEnv;
export type Env = typeof env;

import { z } from 'zod';

const TESTNET_CONTRACT_ID = 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ';
const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Bakti'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3005'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('testnet'),
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('testnet'),
  STELLAR_HORIZON_URL: z.string().url().default(TESTNET_HORIZON_URL),
  STELLAR_NETWORK_PASSPHRASE: z.string().default(TESTNET_PASSPHRASE),

  SOROBAN_RPC_URL: z.string().url().default(TESTNET_RPC_URL),

  // Verified testnet Bakti escrow deployment. Explicit environment values still override it.
  SOROBAN_BAKTI_CONTRACT_ID: z.string().default(TESTNET_CONTRACT_ID),
  NEXT_PUBLIC_BAKTI_CONTRACT_ID: z.string().default(TESTNET_CONTRACT_ID),
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

/** Resolved USDC issuer for the configured network. Testnet is the supported default. */
export const USDC_ASSET_ISSUER_VALUE: string = rawEnv.USDC_ASSET_ISSUER_TESTNET;

/** Native XLM Stellar Asset Contract (SAC) id used by the verified testnet deployment. */
export const NATIVE_SAC_ID_VALUE: string = rawEnv.NATIVE_SAC_ID_TESTNET;

export const env = rawEnv;
export type Env = typeof env;

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  NEXT_PUBLIC_APP_NAME: z.string().default('Bakti'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3005'),

  DRIZZLE_DATABASE_URL: z.string().url(),

  STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'public', 'futurenet']).default('public'),
  STELLAR_HORIZON_URL: z.string().url().default('https://horizon.stellar.org'),
  STELLAR_NETWORK_PASSPHRASE: z.string().default('Test SDF Network ; September 2015'),

  SOROBAN_RPC_URL: z.string().url().default('https://soroban-rpc.creit.tech'),

  // Deployed bakti-escrow Soroban contract that backs the on-chain allowance schedule.
  // Defaults match STELLAR_NETWORK's own default ('public'/mainnet) — the verified
  // live mainnet contract (contracts/DEPLOYMENT.md). Override only to pin a
  // different contract than the network preset (src/shared/network-config.ts).
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
    .default('CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA'),

  USDC_ASSET_CODE: z.string().default('USDC'),
  USDC_ASSET_ISSUER_TESTNET: z
    .string()
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),


  // SEP-31 partner-anchor integration (testnet rehearsal). The domain hosts the
  // anchor's stellar.toml; the secret is Bakti's platform key for SEP-10 auth.
  SEP31_ANCHOR_DOMAIN: z.string().optional(),
  SEP31_SENDING_SECRET: z.string().optional(),
  // Keeper channel keys (comma-separated secrets) + cron auth + callback URL.
  KEEPER_SECRETS: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  SEP31_CALLBACK_URL: z.string().optional(),
  // AES-256-GCM key (hex, 32 bytes) for kyc_json at-rest encryption.
  KYC_ENCRYPTION_KEY: z.string().optional(),
  // Alert webhook for reconciliation mismatches (optional).
  ALERT_WEBHOOK_URL: z.string().optional(),
  // TESTNET DEMO ONLY: keeper periods tick per-minute instead of per-month,
  // so an N-month plan plays out in N minutes.
  KEEPER_FAST_PERIODS: z.string().optional(),

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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('network-derived Stellar config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves mainnet passphrase, Horizon, RPC, contract id, and USDC issuer when STELLAR_NETWORK=public', async () => {
    vi.stubEnv('STELLAR_NETWORK', 'public');
    const {
      STELLAR_NETWORK_PASSPHRASE_VALUE,
      STELLAR_HORIZON_URL_VALUE,
      SOROBAN_RPC_URL_VALUE,
      SOROBAN_BAKTI_CONTRACT_ID_VALUE,
      USDC_ASSET_ISSUER_VALUE,
      NATIVE_SAC_ID_VALUE,
    } = await import('@/server/config/env');

    expect(STELLAR_NETWORK_PASSPHRASE_VALUE).toBe(
      'Public Global Stellar Network ; September 2015',
    );
    expect(STELLAR_HORIZON_URL_VALUE).toBe('https://horizon.stellar.org');
    expect(SOROBAN_RPC_URL_VALUE).toBe('https://mainnet.sorobanrpc.com');
    expect(SOROBAN_BAKTI_CONTRACT_ID_VALUE).toBe(
      'CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR',
    );
    expect(USDC_ASSET_ISSUER_VALUE).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    expect(NATIVE_SAC_ID_VALUE).toBe('CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA');
  });

  it('resolves testnet passphrase and Horizon when STELLAR_NETWORK=testnet', async () => {
    vi.stubEnv('STELLAR_NETWORK', 'testnet');
    const { STELLAR_NETWORK_PASSPHRASE_VALUE, STELLAR_HORIZON_URL_VALUE } = await import(
      '@/server/config/env'
    );

    expect(STELLAR_NETWORK_PASSPHRASE_VALUE).toBe('Test SDF Network ; September 2015');
    expect(STELLAR_HORIZON_URL_VALUE).toBe('https://horizon-testnet.stellar.org');
  });

  it('an explicit override env var still wins over the network default', async () => {
    vi.stubEnv('STELLAR_NETWORK', 'public');
    vi.stubEnv('STELLAR_HORIZON_URL', 'https://custom-horizon.example.com');
    const { STELLAR_HORIZON_URL_VALUE } = await import('@/server/config/env');

    expect(STELLAR_HORIZON_URL_VALUE).toBe('https://custom-horizon.example.com');
  });

  it('config/stellar.ts and stellar/network.ts agree on mainnet passphrase and USDC issuer', async () => {
    vi.stubEnv('STELLAR_NETWORK', 'public');
    const { stellar } = await import('@/server/config/stellar');
    const { getNetworkPassphrase } = await import('@/server/stellar/network');

    expect(stellar.passphrase).toBe(getNetworkPassphrase());
    expect(stellar.usdcIssuer).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
  });
});

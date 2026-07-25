import {
  env,
  STELLAR_HORIZON_URL_VALUE,
  STELLAR_NETWORK_PASSPHRASE_VALUE,
  USDC_ASSET_ISSUER_VALUE,
} from './env';

export const stellar = {
  passphrase: STELLAR_NETWORK_PASSPHRASE_VALUE,
  horizonUrl: STELLAR_HORIZON_URL_VALUE,
  network: env.STELLAR_NETWORK,
  usdcAssetCode: env.USDC_ASSET_CODE,
  usdcIssuer: USDC_ASSET_ISSUER_VALUE,
} as const;

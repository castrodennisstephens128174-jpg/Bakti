import { env, USDC_ASSET_ISSUER_VALUE } from '@/server/config/env';
import type { AllowanceAsset } from '@/server/db/schema/allowances';

/**
 * SEP-7 payment request URI. Lets the sender pay a month's allowance from any
 * SEP-7 aware wallet (scan the QR) instead of the in-app Freighter flow — handy
 * when the working child is on their phone. The recipient, amount, asset and
 * memo are all pinned so the wallet only asks for a signature.
 */
export function buildPayUri(params: {
  destination: string;
  amount: string;
  asset: AllowanceAsset;
  memo: string;
}): string {
  const q = new URLSearchParams();
  q.set('destination', params.destination);
  q.set('amount', params.amount);
  if (params.asset === 'USDC') {
    q.set('asset_code', env.USDC_ASSET_CODE);
    q.set('asset_issuer', USDC_ASSET_ISSUER_VALUE);
  }
  if (params.memo) {
    q.set('memo', params.memo);
    q.set('memo_type', 'MEMO_TEXT');
  }
  q.set('network_passphrase', env.STELLAR_NETWORK_PASSPHRASE);
  q.set('msg', 'Monthly allowance via Bakti');
  return `web+stellar:pay?${q.toString()}`;
}

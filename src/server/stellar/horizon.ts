import { env, USDC_ASSET_ISSUER_VALUE } from '@/server/config/env';
import type { AllowanceAsset } from '@/server/db/schema/allowances';
import { toStroops } from '@/server/lib/amount';
import { AppError } from '@/server/lib/http';

const HORIZON = env.STELLAR_HORIZON_URL;

type PaymentOp = {
  type: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
};

/**
 * Verify a REAL on-chain allowance payment: transaction `txHash` must be
 * successful, sourced from `from`, and contain a payment of the expected
 * asset/amount to `to`. Amounts are read from Horizon and never trusted from
 * the client. Current app flows pay the entered recipient G-account directly;
 * no anchor or muxed deposit destination is implied. Returns nothing on success
 * and throws on any mismatch.
 */
export async function verifyAllowancePayment(params: {
  txHash: string;
  asset: AllowanceAsset;
  from: string;
  to: string;
  amount: string;
}): Promise<void> {
  const { txHash, asset, from, to, amount } = params;

  const txRes = await fetch(`${HORIZON}/transactions/${txHash}`);
  if (txRes.status === 404) {
    throw new AppError('NOT_FOUND', 'Transaction not found on Stellar testnet yet', 404);
  }
  if (!txRes.ok) throw new AppError('INTERNAL', `Horizon error ${txRes.status}`, 502);
  const tx = (await txRes.json()) as { successful?: boolean };
  if (tx.successful === false) throw new AppError('CONFLICT', 'Transaction failed on-chain', 409);

  const opsRes = await fetch(`${HORIZON}/transactions/${txHash}/operations?limit=100`);
  if (!opsRes.ok) throw new AppError('INTERNAL', `Horizon error ${opsRes.status}`, 502);
  const opsJson = (await opsRes.json()) as {
    _embedded?: { records?: Array<PaymentOp & { to_muxed?: string }> };
  };
  const ops = (opsJson._embedded?.records ?? []).filter(
    (op) => op.type === 'payment' || op.type === 'createAccount',
  );

  const assetMatches = (op: PaymentOp): boolean => {
    if (asset === 'XLM') return op.asset_type === 'native' || op.type === 'createAccount';
    return op.asset_code === 'USDC' && op.asset_issuer === USDC_ASSET_ISSUER_VALUE;
  };

  const match = ops.find(
    (op) =>
      op.to === to &&
      op.from === from &&
      assetMatches(op) &&
      op.amount != null &&
      toStroops(op.amount) === toStroops(amount),
  );

  if (!match) {
    throw new AppError(
      'INVALID_INPUT',
      `On-chain payment of ${amount} to ${to.slice(0, 6)}… not found in this transaction`,
      400,
    );
  }
}

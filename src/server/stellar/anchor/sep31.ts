import { AppError } from '@/server/lib/http';
import type { AnchorToml } from './toml';

export type SendPaymentParams = {
  amount: string;
  assetCode: string;
  receiverId: string;
  fundingMethod: string;
  transactionFields?: Record<string, string>;
};

export type PaymentStatus = {
  id: string;
  status: string;
  amountIn: string;
  stellarAccountId?: string;
  stellarMemo?: string;
  stellarMemoType?: string;
};

/**
 * SEP-31: register a direct payment intent with the anchor. The anchor
 * doesn't take custody through this call — it returns a transaction id, and
 * (via `getPaymentStatus`) the Stellar account + memo Bakti's sender must
 * still pay on-chain to actually move funds.
 */
export async function sendPayment(
  anchorToml: AnchorToml,
  jwt: string,
  params: SendPaymentParams,
): Promise<{ transactionId: string }> {
  const url = `${anchorToml.directPaymentServer}/transactions`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        asset_code: params.assetCode,
        receiver_id: params.receiverId,
        funding_method: params.fundingMethod,
        fields: { transaction: params.transactionFields ?? {} },
      }),
    });
  } catch (cause) {
    throw new AppError('INTERNAL', `Could not reach SEP-31 endpoint at ${url}`, 502, cause);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError(
      'INVALID_INPUT',
      `SEP-31 payment rejected (${res.status})${detail ? `: ${detail}` : ''}`,
      res.status === 401 ? 401 : 400,
    );
  }

  const body = (await res.json()) as { id?: string };
  if (!body.id) {
    throw new AppError('INTERNAL', 'SEP-31 response is missing "id"', 502);
  }
  return { transactionId: body.id };
}

export async function getPaymentStatus(
  anchorToml: AnchorToml,
  jwt: string,
  transactionId: string,
): Promise<PaymentStatus> {
  const url = `${anchorToml.directPaymentServer}/transactions/${transactionId}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
  } catch (cause) {
    throw new AppError('INTERNAL', `Could not reach SEP-31 endpoint at ${url}`, 502, cause);
  }
  if (!res.ok) {
    throw new AppError(
      'NOT_FOUND',
      `SEP-31 transaction ${transactionId} not found (${res.status})`,
      404,
    );
  }

  const body = (await res.json()) as {
    transaction?: {
      id: string;
      status: string;
      amount_in: string;
      stellar_account_id?: string;
      stellar_memo?: string;
      stellar_memo_type?: string;
    };
  };
  if (!body.transaction) {
    throw new AppError('INTERNAL', 'SEP-31 status response is missing "transaction"', 502);
  }
  const t = body.transaction;
  return {
    id: t.id,
    status: t.status,
    amountIn: t.amount_in,
    stellarAccountId: t.stellar_account_id,
    stellarMemo: t.stellar_memo,
    stellarMemoType: t.stellar_memo_type,
  };
}

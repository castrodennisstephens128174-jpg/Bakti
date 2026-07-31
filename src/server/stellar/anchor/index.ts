import type { Keypair } from '@stellar/stellar-sdk';
import { authenticate } from './sep10';
import { type CustomerFields, putCustomer } from './sep12';
import { getPaymentStatus, type PaymentStatus, sendPayment } from './sep31';
import { fetchAnchorToml } from './toml';

export { authenticate } from './sep10';
export type { CustomerFields } from './sep12';
export { putCustomer } from './sep12';
export type { PaymentStatus, SendPaymentParams } from './sep31';
export { getPaymentStatus, sendPayment } from './sep31';
export type { AnchorCurrency, AnchorToml } from './toml';
export { fetchAnchorToml } from './toml';

export type SendViaAnchorParams = {
  homeDomain: string;
  networkPassphrase: string;
  senderKeypair: Keypair;
  amount: string;
  assetCode: string;
  fundingMethod: string;
  receiverKyc: CustomerFields;
};

export type SendViaAnchorResult = {
  transactionId: string;
  status: PaymentStatus;
};

/**
 * Full SEP-1 -> SEP-10 -> SEP-12 -> SEP-31 chain: discover the anchor, prove
 * control of Bakti's signing key, register the receiver's KYC, and register
 * the payment intent. Returns the anchor's transaction id plus its current
 * status (including the Stellar account + memo the sender still has to pay
 * on-chain — this function registers the intent, it does not itself move funds).
 */
export async function sendViaAnchor(params: SendViaAnchorParams): Promise<SendViaAnchorResult> {
  const toml = await fetchAnchorToml(params.homeDomain);

  const jwt = await authenticate(toml, params.senderKeypair, {
    networkPassphrase: params.networkPassphrase,
    homeDomain: params.homeDomain,
  });

  const { customerId } = await putCustomer(toml, jwt, params.receiverKyc);

  const { transactionId } = await sendPayment(toml, jwt, {
    amount: params.amount,
    assetCode: params.assetCode,
    receiverId: customerId,
    fundingMethod: params.fundingMethod,
  });

  const status = await getPaymentStatus(toml, jwt, transactionId);

  return { transactionId, status };
}

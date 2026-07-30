import { eq } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { putCustomer } from '@/server/anchor/sep31';
import { db } from '@/server/db/client';
import { sep31Senders } from '@/server/db/schema';
import { decryptKyc, encryptKyc } from '@/server/lib/kyc-vault';
import { AppError } from '@/server/lib/http';
import type { AllowanceKyc } from './payout.service';

/**
 * SEP-12 orchestration with two production rules baked in:
 *
 *  1. One sender registration per wallet — the anchor-side customer id is
 *     cached in `sep31_senders` and reused by every allowance the wallet opens.
 *  2. PII minimization — once the anchor ACCEPTs a customer, bakti drops the
 *     government-ID numbers and keeps only names + customer-id pointers. The
 *     blob is stored AES-encrypted either way.
 */

export async function ensureSenderCustomer(publicKey: string, kyc: AllowanceKyc): Promise<string> {
  const domain = env.SEP31_ANCHOR_DOMAIN ?? '';
  const [row] = await db
    .select()
    .from(sep31Senders)
    .where(eq(sep31Senders.publicKey, publicKey))
    .limit(1);
  if (row && row.anchorDomain === domain) return row.customerId;

  const customerId = await putCustomer({
    type: 'sep31-sender',
    firstName: kyc.senderFirstName,
    lastName: kyc.senderLastName,
    idType: kyc.senderIdType,
    idNumber: kyc.senderIdNumber,
  });
  await db
    .insert(sep31Senders)
    .values({ publicKey, customerId, anchorDomain: domain })
    .onConflictDoUpdate({
      target: sep31Senders.publicKey,
      set: { customerId, anchorDomain: domain },
    });
  return customerId;
}

/**
 * Register both parties (sender deduped per wallet) and return the blob that
 * is safe to persist: customer ids attached, ID numbers stripped.
 */
export async function prepareKyc(publicKey: string, kyc: AllowanceKyc): Promise<AllowanceKyc> {
  const senderCustomerId =
    kyc.senderCustomerId ?? (await ensureSenderCustomer(publicKey, kyc));
  const receiverCustomerId =
    kyc.receiverCustomerId ??
    (await putCustomer({
      type: 'sep31-receiver',
      firstName: kyc.receiverFirstName,
      lastName: kyc.receiverLastName,
      idType: kyc.receiverIdType,
      idNumber: kyc.receiverIdNumber,
    }));

  return {
    senderFirstName: kyc.senderFirstName,
    senderLastName: kyc.senderLastName,
    receiverFirstName: kyc.receiverFirstName,
    receiverLastName: kyc.receiverLastName,
    senderCustomerId,
    receiverCustomerId,
    // ID numbers intentionally dropped: the anchor holds them now.
  };
}

/** Parse a stored (possibly encrypted, possibly legacy-plaintext) KYC blob. */
export function readStoredKyc(kycJson: string | null): AllowanceKyc {
  if (!kycJson) {
    throw new AppError('CONFLICT', 'This allowance has no KYC details for the anchor', 409);
  }
  try {
    return JSON.parse(decryptKyc(kycJson)) as AllowanceKyc;
  } catch {
    throw new AppError('CONFLICT', 'Stored KYC details could not be read', 409);
  }
}

export function sealKyc(kyc: AllowanceKyc): string {
  return encryptKyc(JSON.stringify(kyc));
}

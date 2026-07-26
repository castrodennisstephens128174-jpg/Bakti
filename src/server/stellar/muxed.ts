import { Account, MuxedAccount } from '@stellar/stellar-sdk';

/**
 * Generic muxed-address helper retained for a future provider adapter. The
 * current product does not expose this address, route payments through it, or
 * claim that an anchor has accepted it as a deposit destination.
 */

/** Derive a stable uint64 id from an allowance id (first 15 hex nibbles). */
export function muxIdFromAllowance(allowanceId: string): string {
  const hex = allowanceId.replace(/[^0-9a-f]/gi, '').slice(0, 15) || '1';
  return BigInt(`0x${hex}`).toString();
}

/** Build a deterministic muxed address if a future adapter explicitly needs one. */
export function anchorMuxedAddress(baseAccount: string, allowanceId: string): string {
  const muxed = new MuxedAccount(new Account(baseAccount, '0'), muxIdFromAllowance(allowanceId));
  return muxed.accountId();
}

import { Account, MuxedAccount } from '@stellar/stellar-sdk';

/**
 * SEP-23 muxed accounts. The anchor uses ONE collection G-account for cash
 * pickup, and distinguishes which allowance a deposit belongs to by encoding a
 * per-allowance id into a muxed (M...) address. Same underlying account, unique
 * attribution — so the off-ramp knows whose parent to release cash to without a
 * separate deposit address per family.
 */

/** Derive a stable uint64 id from an allowance id (first 15 hex nibbles). */
export function muxIdFromAllowance(allowanceId: string): string {
  const hex = allowanceId.replace(/[^0-9a-f]/gi, '').slice(0, 15) || '1';
  return BigInt(`0x${hex}`).toString();
}

/** Build the anchor's muxed collection address for a given allowance. */
export function anchorMuxedAddress(baseAccount: string, allowanceId: string): string {
  const muxed = new MuxedAccount(new Account(baseAccount, '0'), muxIdFromAllowance(allowanceId));
  return muxed.accountId();
}

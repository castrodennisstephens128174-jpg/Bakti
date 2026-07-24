/**
 * Bakti's internal Stellar module. One clean import surface:
 *
 *   network.ts  — passphrase / Horizon / explorer slug / asset resolution
 *   horizon.ts  — verify a real on-chain allowance payment from Horizon
 *   muxed.ts    — unused muxed-address helper retained for future provider work
 *   payuri.ts   — SEP-7 direct payment request URI for the recipient address
 */

export * from './contract';
export * from './horizon';
export * from './muxed';
export * from './network';
export * from './payuri';

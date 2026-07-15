/**
 * Bakti's internal Stellar module. One clean import surface:
 *
 *   network.ts  — passphrase / Horizon / explorer slug / asset resolution
 *   horizon.ts  — verify a real on-chain allowance payment from Horizon
 *   muxed.ts    — SEP-23 muxed attribution for the anchor's cash-pickup account
 *   payuri.ts   — SEP-7 payment request URI (QR pay from any SEP-7 wallet)
 */

export * from './contract';
export * from './horizon';
export * from './muxed';
export * from './network';
export * from './payuri';

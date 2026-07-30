/**
 * Bakti's internal Stellar module. One clean import surface:
 *
 *   network.ts  — passphrase / Horizon / explorer slug / asset resolution
 *   horizon.ts  — verify a real on-chain allowance payment from Horizon
 */

export * from './contract';
export * from './horizon';
export * from './network';

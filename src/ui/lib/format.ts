import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AssetCode = 'XLM' | 'USDC';
export type PayoutStatus = 'scheduled' | 'sent' | 'settled' | 'collected' | 'failed';
export type AllowanceStatus = 'active' | 'paused' | 'ended';

/** Format an amount for display (trims trailing zeros). */
export function fmtAmount(amount: string | number): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(7).replace(/0+$/, '').replace(/\.$/, '');
}

export function fmtAsset(amount: string | number, asset: AssetCode | string): string {
  return `${fmtAmount(amount)} ${asset}`;
}

export function shortKey(key: string, lead = 4, tail = 4): string {
  if (!key) return '';
  if (key.length <= lead + tail + 1) return key;
  return `${key.slice(0, lead)}…${key.slice(-tail)}`;
}

export function explorerTx(hash: string, network = 'testnet'): string {
  return `https://stellar.expert/explorer/${network}/tx/${hash}`;
}

export function explorerAccount(addr: string, network = 'testnet'): string {
  return `https://stellar.expert/explorer/${network}/account/${addr}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-07' -> 'Jul 2026'. */
export function fmtPeriod(period: string): string {
  const [y, m] = period.split('-');
  const idx = Number(m) - 1;
  return `${MONTHS[idx] ?? m} ${y}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  scheduled: 'Ready to send',
  sent: 'Verified on-chain',
  settled: 'Provider confirmed',
  collected: 'Collection confirmed',
  failed: 'Failed',
};

import { Info } from 'lucide-react';
import Link from 'next/link';
import type { AllowanceStatus, AssetCode, PayoutStatus } from '@/ui/lib/format';
import { cn, PAYOUT_LABEL } from '@/ui/lib/format';

export function AssetBadge({ asset }: { asset: AssetCode | string }) {
  const isXlm = asset === 'XLM';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        isXlm ? 'bg-brand-50 text-brand-800' : 'bg-accent-50 text-accent',
      )}
    >
      {asset}
    </span>
  );
}

const PAYOUT_TONE: Record<PayoutStatus, string> = {
  scheduled: 'bg-amber-100 text-amber-800',
  sent: 'bg-brand-50 text-brand-800',
  settled: 'bg-sky-100 text-sky-800',
  collected: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus | string }) {
  const s = status as PayoutStatus;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        PAYOUT_TONE[s] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {PAYOUT_LABEL[s] ?? status}
    </span>
  );
}

const ALLOWANCE_TONE: Record<AllowanceStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  ended: 'bg-slate-200 text-slate-700',
};

export function AllowanceStatusBadge({ status }: { status: AllowanceStatus | string }) {
  const s = status as AllowanceStatus;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        ALLOWANCE_TONE[s] ?? 'bg-slate-100 text-slate-700',
      )}
    >
      {status}
    </span>
  );
}

export function SimulationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-mist px-3.5 py-2.5 text-sm text-ink-soft">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
      <span>{children}</span>
    </p>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-7 text-sm text-ink-soft sm:flex-row">
        <p>Bakti · family support planning prototype · Stellar testnet by default</p>
        <div className="flex items-center gap-4">
          <Link href="/stats" className="hover:text-ink">
            Live stats
          </Link>
          <a href="https://stellar.org" target="_blank" rel="noreferrer" className="hover:text-ink">
            Built on Stellar
          </a>
        </div>
      </div>
    </footer>
  );
}

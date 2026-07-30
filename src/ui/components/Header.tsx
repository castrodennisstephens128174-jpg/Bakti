'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/ui/lib/format';
import { getClientNetworkId, setClientNetworkId } from '@/ui/network/client-network';
import type { BaktiNetworkId } from '@/shared/network-config';
import { ConnectButton } from './ConnectButton';
import { Wordmark } from './Logo';

const NAV = [
  { href: '/dashboard', label: 'My allowances' },
  { href: '/stats', label: 'Stats' },
];

const NETWORK_OPTIONS: Array<{ id: BaktiNetworkId; label: string }> = [
  { id: 'public', label: 'Mainnet' },
  { id: 'testnet', label: 'Testnet' },
];

/**
 * Mainnet/Testnet switch. The cookie is only readable after mount, so render
 * nothing until then to keep server and client HTML identical.
 */
function NetworkSwitch() {
  const [active, setActive] = useState<BaktiNetworkId | null>(null);
  useEffect(() => setActive(getClientNetworkId()), []);
  if (!active) return <div className="h-8 w-[132px]" aria-hidden="true" />;
  return (
    <div
      role="group"
      aria-label="Stellar network"
      data-testid="network-switch"
      className="flex items-center rounded-full border border-line/80 bg-paper p-0.5"
    >
      {NETWORK_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          data-testid={`network-${opt.id}`}
          aria-pressed={active === opt.id}
          onClick={() => {
            if (active !== opt.id) setClientNetworkId(opt.id);
          }}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold transition',
            active === opt.id
              ? opt.id === 'public'
                ? 'bg-brand-50 text-brand-800'
                : 'bg-amber-100 text-amber-800'
              : 'text-ink-soft hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/" className="shrink-0" aria-label="Bakti home">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                  active ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <NetworkSwitch />
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

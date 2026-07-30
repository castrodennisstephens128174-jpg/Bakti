'use client';

import { HandCoins, HeartHandshake, LogIn, MapPin, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/ui/components/Header';
import { Footer } from '@/ui/components/ui';

type Stats = {
  uniqueWallets: number;
  logins: number;
  totalAllowances: number;
  activeAllowances: number;
  payoutsDelivered: number;
  parentsCollected: number;
};

const CARDS: Array<{ key: keyof Stats; label: string; icon: React.ReactNode; hint: string }> = [
  {
    key: 'uniqueWallets',
    label: 'Wallets connected',
    icon: <Wallet className="h-5 w-5" />,
    hint: 'Distinct senders',
  },
  {
    key: 'logins',
    label: 'Sessions signed',
    icon: <LogIn className="h-5 w-5" />,
    hint: 'SEP-10 logins',
  },
  {
    key: 'totalAllowances',
    label: 'Allowances set up',
    icon: <HeartHandshake className="h-5 w-5" />,
    hint: 'Standing plans',
  },
  {
    key: 'activeAllowances',
    label: 'Currently active',
    icon: <Users className="h-5 w-5" />,
    hint: 'Running now',
  },
  {
    key: 'payoutsDelivered',
    label: 'Payouts delivered',
    icon: <HandCoins className="h-5 w-5" />,
    hint: 'Sent on-chain',
  },
  {
    key: 'parentsCollected',
    label: 'Cash collected',
    icon: <MapPin className="h-5 w-5" />,
    hint: 'Confirmed pickups',
  },
];

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setStats(j.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">Bakti in numbers</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Real, on-chain activity across everyone using Bakti — counted from Stellar sessions and
          the allowances people have set up for their parents. No vanity metrics.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.key} className="card p-6" data-testid={`stat-${c.key}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  {c.icon}
                </span>
                <div>
                  <div className="font-display text-3xl font-bold tabular-nums text-ink">
                    {stats ? stats[c.key] : '—'}
                  </div>
                  <div className="text-sm font-medium text-ink">{c.label}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-soft">{c.hint}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}

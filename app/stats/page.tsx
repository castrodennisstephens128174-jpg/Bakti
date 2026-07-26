'use client';

import { Database, FileCheck2, HeartHandshake, LogIn, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Header } from '@/ui/components/Header';
import { Footer, SimulationNote } from '@/ui/components/ui';

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
    label: 'Wallet keys in sessions',
    icon: <Wallet className="h-5 w-5" />,
    hint: 'Distinct public keys in the app database',
  },
  {
    key: 'logins',
    label: 'Signed sessions stored',
    icon: <LogIn className="h-5 w-5" />,
    hint: 'Custom manageData challenges — not SEP-10',
  },
  {
    key: 'totalAllowances',
    label: 'Support plans stored',
    icon: <HeartHandshake className="h-5 w-5" />,
    hint: 'App database records, not automatic standing orders',
  },
  {
    key: 'activeAllowances',
    label: 'Plans marked active',
    icon: <Users className="h-5 w-5" />,
    hint: 'Local plan status in the app database',
  },
  {
    key: 'payoutsDelivered',
    label: 'Payment records beyond scheduled',
    icon: <FileCheck2 className="h-5 w-5" />,
    hint: 'Transaction hashes can be verified when present',
  },
  {
    key: 'parentsCollected',
    label: 'Legacy collection acknowledgements',
    icon: <Database className="h-5 w-5" />,
    hint: 'Historical local demo values — not provider confirmations',
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
        <h1 className="font-display text-3xl font-bold text-ink">Prototype database activity</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">
          These are counts from Bakti's Postgres tables for sessions, support plans, and payment
          records. They are not market traction, provider reports, or proof of cash collection.
        </p>

        <div className="mt-5 max-w-3xl">
          <SimulationNote>
            On-chain transaction hashes can be opened and verified. Any historical rows marked
            collected were local demo acknowledgements created before provider integration was
            disabled; Bakti has no provider-confirmed collection feed.
          </SimulationNote>
        </div>

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

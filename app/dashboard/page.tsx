'use client';

import { HeartHandshake, Plus, Users, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/ui/components/Header';
import {
  AllowanceStatusBadge,
  AssetBadge,
  Footer,
  PayoutStatusBadge,
  SimulationNote,
} from '@/ui/components/ui';
import { fmtAmount, fmtAsset, ordinal, shortKey } from '@/ui/lib/format';
import { sign, WalletError } from '@/ui/wallet/stellarClient';
import { useWallet } from '@/ui/wallet/WalletProvider';

type Payout = { status: string; amount: string; asset: string };
type Allowance = {
  id: string;
  recipientName: string;
  recipientAddress: string;
  corridor: string;
  asset: string;
  monthlyAmount: string;
  dayOfMonth: number;
  status: string;
  payoutCount: number;
  lastPayout: Payout | null;
};

const CORRIDORS = [
  'Philippines · MoneyGram',
  'Indonesia · Hana pickup',
  'Vietnam · MoneyGram',
  'Malaysia · Hana pickup',
  'Thailand · MoneyGram',
];

async function api(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({ ok: false }));
  if (!json.ok) throw new Error(json.error?.message ?? `Request failed (${res.status})`);
  return json.data;
}

export default function DashboardPage() {
  const router = useRouter();
  const { status, publicKey, connect } = useWallet();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== 'connected') return;
    setLoading(true);
    try {
      setAllowances(await api('/api/allowances'));
    } catch (e) {
      toast.error('Could not load allowances', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'connected') void refresh();
    if (status === 'disconnected') setLoading(false);
  }, [status, refresh]);

  const stats = useMemo(() => {
    const active = allowances.filter((a) => a.status === 'active').length;
    const parents = new Set(allowances.map((a) => a.recipientAddress)).size;
    const delivered = allowances.reduce((acc, a) => acc + a.payoutCount, 0);
    return { active, parents, delivered };
  }, [allowances]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">My allowances</h1>
            <p className="mt-1 text-ink-soft">
              Standing monthly support for the parents who depend on you.
            </p>
          </div>
          {status === 'connected' && (
            <button
              type="button"
              data-testid="new-allowance-button"
              onClick={() => setShowForm((v) => !v)}
              className="btn-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-base font-semibold"
            >
              <Plus className="h-4 w-4" />
              New allowance
            </button>
          )}
        </div>

        {status !== 'connected' ? (
          <div className="card mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Wallet className="h-7 w-7" />
            </span>
            <h2 className="font-display text-xl font-bold text-ink">
              Connect your wallet to begin
            </h2>
            <p className="max-w-md text-ink-soft">
              Bakti keeps no accounts and no passwords. Connect a Stellar wallet to create a monthly
              allowance and sign each payout yourself — you always stay in control of the funds.
            </p>
            <button
              type="button"
              data-testid="connect-cta"
              disabled={status === 'connecting' || status === 'loading'}
              onClick={() => void connect()}
              className="btn-primary inline-flex h-11 items-center gap-2 rounded-full px-6 text-base font-semibold disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              {status === 'connecting' ? 'Connecting…' : 'Connect wallet'}
            </button>
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                testid="stat-active"
                icon={<HeartHandshake className="h-5 w-5" />}
                label="Active allowances"
                value={String(stats.active)}
              />
              <StatCard
                testid="stat-parents"
                icon={<Users className="h-5 w-5" />}
                label="Parents supported"
                value={String(stats.parents)}
              />
              <StatCard
                testid="stat-delivered"
                icon={<Wallet className="h-5 w-5" />}
                label="Payouts on record"
                value={String(stats.delivered)}
              />
            </section>

            {showForm && (
              <CreateForm
                publicKey={publicKey}
                onClose={() => setShowForm(false)}
                onCreated={() => {
                  setShowForm(false);
                  void refresh();
                }}
              />
            )}

            <section className="card mt-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-lg font-bold text-ink">
                  {publicKey ? `Signed in as ${shortKey(publicKey)}` : 'Your allowances'}
                </h2>
                <span className="text-sm text-ink-soft">{allowances.length} total</span>
              </div>

              {loading ? (
                <p className="px-5 py-10 text-center text-ink-soft">Loading your allowances…</p>
              ) : allowances.length === 0 ? (
                <div
                  data-testid="empty-state"
                  className="flex flex-col items-center gap-3 px-6 py-16 text-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <HeartHandshake className="h-6 w-6" />
                  </span>
                  <p className="max-w-md text-ink-soft">
                    You have not set up any allowances yet. Add the parent you support, choose a
                    monthly amount and a pickup corridor, and Bakti will line up the first payout
                    for you to sign.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="btn-primary mt-1 inline-flex h-11 items-center gap-2 rounded-full px-5 text-base font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first allowance
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left" data-testid="allowance-list">
                    <thead>
                      <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                        <th className="px-5 py-3 font-semibold">Parent</th>
                        <th className="px-5 py-3 font-semibold">Corridor</th>
                        <th className="px-5 py-3 font-semibold">Monthly</th>
                        <th className="px-5 py-3 font-semibold">Payout day</th>
                        <th className="px-5 py-3 font-semibold">This month</th>
                        <th className="px-5 py-3 font-semibold">Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances.map((a) => (
                        <tr
                          key={a.id}
                          data-testid="allowance-row"
                          onClick={() => router.push(`/allowances/${a.id}`)}
                          className="cursor-pointer border-b border-line/60 transition hover:bg-mist"
                        >
                          <td className="px-5 py-4">
                            <Link href={`/allowances/${a.id}`} className="block">
                              <span className="font-semibold text-ink">{a.recipientName}</span>
                              <span className="mt-0.5 block font-mono text-xs text-ink-soft">
                                {shortKey(a.recipientAddress, 6, 6)}
                              </span>
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-sm text-ink-soft">{a.corridor}</td>
                          <td className="px-5 py-4">
                            <span className="font-semibold tabular-nums text-ink">
                              {fmtAmount(a.monthlyAmount)}
                            </span>{' '}
                            <AssetBadge asset={a.asset} />
                          </td>
                          <td className="px-5 py-4 text-sm text-ink-soft">
                            {ordinal(a.dayOfMonth)}
                          </td>
                          <td className="px-5 py-4">
                            {a.lastPayout ? (
                              <PayoutStatusBadge status={a.lastPayout.status} />
                            ) : (
                              <span className="text-sm text-ink-soft">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <AllowanceStatusBadge status={a.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  testid,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div className="card p-5" data-testid={testid}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          {icon}
        </span>
        <div>
          <div className="font-display text-2xl font-bold tabular-nums text-ink">{value}</div>
          <div className="text-sm text-ink-soft">{label}</div>
        </div>
      </div>
    </div>
  );
}

function CreateForm({
  publicKey,
  onClose,
  onCreated,
}: {
  publicKey: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [corridor, setCorridor] = useState(CORRIDORS[0]);
  const [asset, setAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [months, setMonths] = useState('3');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const base = { recipientName, recipientAddress, corridor, asset, monthlyAmount, dayOfMonth, months };
      if (asset === 'XLM') {
        if (!publicKey) throw new Error('Connect your wallet to pre-fund the on-chain schedule.');
        const intent = await api('/api/allowances/escrow-intent', 'POST', base);
        const signedXdr = await sign(intent.xdr, publicKey);
        await api('/api/allowances', 'POST', { ...base, signedXdr });
      } else {
        await api('/api/allowances', 'POST', base);
      }
      toast.success('Allowance created', { description: `${recipientName} is set up.` });
      onCreated();
    } catch (err) {
      const msg = err instanceof WalletError || err instanceof Error ? err.message : undefined;
      toast.error('Could not create allowance', { description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card mt-6 p-6" data-testid="create-allowance-form">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Set up a monthly allowance</h2>
        <button
          type="button"
          aria-label="Close form"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-soft transition hover:bg-mist"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Parent's name</span>
          <input
            data-testid="recipient-name"
            className="field"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="e.g. Bapak Bambang"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Pickup corridor</span>
          <select
            data-testid="corridor"
            className="field"
            value={corridor}
            onChange={(e) => setCorridor(e.target.value)}
          >
            {CORRIDORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Parent's Stellar address
          </span>
          <input
            data-testid="recipient-address"
            className="field font-mono text-sm"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="G…"
            required
          />
        </label>

        <div className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Asset</span>
          <div className="flex gap-2">
            {(['XLM', 'USDC'] as const).map((a) => (
              <button
                key={a}
                type="button"
                data-testid={`asset-${a}`}
                onClick={() => setAsset(a)}
                className={
                  asset === a
                    ? 'btn-primary h-11 flex-1 rounded-xl text-sm font-semibold'
                    : 'btn-ghost h-11 flex-1 rounded-xl text-sm font-semibold'
                }
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Monthly amount</span>
          <input
            data-testid="monthly-amount"
            className="field tabular-nums"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 25"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Payout day of month</span>
          <input
            data-testid="day-of-month"
            className="field tabular-nums"
            type="number"
            min={1}
            max={28}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Months to pre-fund</span>
          <input
            data-testid="months"
            className="field tabular-nums"
            type="number"
            min={1}
            max={12}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            required
          />
        </label>

        <div className="sm:col-span-2">
          <SimulationNote>
            {asset === 'XLM'
              ? 'Creating an XLM allowance escrows the whole run (monthly × months) into the Bakti Soroban contract up front. Each monthly send is a permissionless on-chain release from that escrow. The cash-pickup step (MoneyGram / Hana) is a mainnet simulation of a SEP-24 anchor off-ramp.'
              : 'You send real Stellar payments on mainnet. The cash-pickup step (MoneyGram / Hana) is a mainnet simulation of a SEP-24 anchor off-ramp.'}
          </SimulationNote>
        </div>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost h-11 rounded-full px-5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="submit-allowance"
            disabled={saving}
            className="btn-primary h-11 rounded-full px-6 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create allowance'}
          </button>
        </div>
      </form>
    </section>
  );
}

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
import { getClientNetworkId } from '@/ui/network/client-network';
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

/** All payouts now go through a SEP-31 partner anchor. */
const SEP31_CORRIDOR = 'sep31';
const SEP31_LABEL_TESTNET = 'Partner anchor · SEP-31 (testnet)';
// No mainnet partner is signed yet — these are display-only samples.
const MAINNET_SAMPLE_ANCHORS = ['Anchor A (sample — not yet integrated)', 'Anchor B (sample — not yet integrated)'];

/** Human label for a stored corridor value (old rows may hold legacy names). */
function corridorLabel(corridor: string): string {
  return corridor === SEP31_CORRIDOR ? 'Partner anchor (SEP-31)' : corridor;
}

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
    if (status !== 'connected') return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void api('/api/allowances')
        .then((d) => setAllowances(d))
        .catch(() => {});
    }, 10_000);
    return () => clearInterval(timer);
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
                                {a.recipientAddress
                                  ? shortKey(a.recipientAddress, 6, 6)
                                  : 'cash pickup — no wallet'}
                              </span>
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-sm text-ink-soft">{corridorLabel(a.corridor)}</td>
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
  const [corridor, setCorridor] = useState(SEP31_CORRIDOR);
  const [kyc, setKyc] = useState({
    senderFirstName: '',
    senderLastName: '',
    senderIdType: 'national_id',
    senderIdNumber: '',
    receiverFirstName: '',
    receiverLastName: '',
    receiverIdType: 'national_id',
    receiverIdNumber: '',
  });
  const [isTestnet] = useState(() => getClientNetworkId() === 'testnet');
  const isSep31 = corridor === SEP31_CORRIDOR;
  const [asset, setAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [months, setMonths] = useState('3');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const base = {
        recipientName,
        // SEP-31: the parent collects cash from the anchor — no wallet needed.
        recipientAddress: isSep31 ? '' : recipientAddress,
        corridor,
        asset,
        monthlyAmount,
        dayOfMonth,
        months,
        ...(isSep31 ? { kyc } : {}),
      };
      if (isSep31) {
        if (!isTestnet) {
          throw new Error('No partner anchor is live on mainnet yet — switch to Testnet to try SEP-31.');
        }
        if (asset === 'XLM') {
          // Escrow the whole run into the contract; the keeper then pays the
          // anchor automatically each period. KYC is registered (and approved)
          // by the anchor BEFORE the signature locks any money.
          if (!publicKey) throw new Error('Connect your wallet to pre-fund the on-chain schedule.');
          const intent = await api('/api/allowances/escrow-intent', 'POST', base);
          const signedXdr = await sign(intent.xdr, publicKey);
          await api('/api/allowances', 'POST', { ...base, kyc: intent.kyc ?? kyc, signedXdr });
        } else {
          // USDC has no escrow contract — stays on the manual monthly path.
          await api('/api/allowances', 'POST', base);
        }
      } else if (asset === 'XLM') {
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
            {isTestnet ? (
              <option value={SEP31_CORRIDOR}>{SEP31_LABEL_TESTNET}</option>
            ) : (
              MAINNET_SAMPLE_ANCHORS.map((label) => (
                <option key={label} value={SEP31_CORRIDOR} disabled>
                  {label}
                </option>
              ))
            )}
          </select>
          {!isTestnet && (
            <p className="mt-1.5 text-xs text-ink-soft">
              No partner anchor is live on mainnet yet — switch to Testnet in the header to
              rehearse the SEP-31 flow.
            </p>
          )}
        </label>

        {isSep31 && (
          <div className="sm:col-span-2 grid gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-xs text-amber-800">
              The partner anchor requires KYC (SEP-12) for both sides: full name and a government
              ID. The parent shows this exact ID at the cash-pickup counter.
            </p>

            <p className="sm:col-span-2 -mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
              You (sender)
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">First name</span>
              <input data-testid="kyc-sender-first" className="field" value={kyc.senderFirstName}
                onChange={(e) => setKyc({ ...kyc, senderFirstName: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Last name</span>
              <input data-testid="kyc-sender-last" className="field" value={kyc.senderLastName}
                onChange={(e) => setKyc({ ...kyc, senderLastName: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">ID type</span>
              <select data-testid="kyc-sender-id-type" className="field" value={kyc.senderIdType}
                onChange={(e) => setKyc({ ...kyc, senderIdType: e.target.value })}>
                <option value="national_id">National ID card</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's license</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">ID number</span>
              <input data-testid="kyc-sender-id-number" className="field font-mono text-sm"
                value={kyc.senderIdNumber} placeholder="e.g. 079123456789"
                onChange={(e) => setKyc({ ...kyc, senderIdNumber: e.target.value })} required />
            </label>

            <p className="sm:col-span-2 -mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
              Parent (receiver)
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">First name</span>
              <input data-testid="kyc-receiver-first" className="field" value={kyc.receiverFirstName}
                onChange={(e) => setKyc({ ...kyc, receiverFirstName: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Last name</span>
              <input data-testid="kyc-receiver-last" className="field" value={kyc.receiverLastName}
                onChange={(e) => setKyc({ ...kyc, receiverLastName: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">ID type</span>
              <select data-testid="kyc-receiver-id-type" className="field" value={kyc.receiverIdType}
                onChange={(e) => setKyc({ ...kyc, receiverIdType: e.target.value })}>
                <option value="national_id">National ID card</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's license</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">ID number</span>
              <input data-testid="kyc-receiver-id-number" className="field font-mono text-sm"
                value={kyc.receiverIdNumber} placeholder="ID shown at pickup"
                onChange={(e) => setKyc({ ...kyc, receiverIdNumber: e.target.value })} required />
            </label>
          </div>
        )}

        {!isSep31 && (
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
        )}

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
              ? 'Creating an XLM allowance escrows the whole run (monthly × months) into the Bakti Soroban contract up front. Each monthly send is a permissionless on-chain release from that escrow. The cash-pickup step is handled by a SEP-31 partner anchor (rehearsal anchor on testnet).'
              : 'You send real Stellar payments. The cash-pickup step is handled by a SEP-31 partner anchor (rehearsal anchor on testnet; no mainnet partner is live yet).'}
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

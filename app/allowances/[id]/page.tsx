'use client';

import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Copy,
  ExternalLink,
  Pause,
  Play,
  Radio,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { publicEnv } from '@/server/config/env.public';
import { Header } from '@/ui/components/Header';
import {
  AllowanceStatusBadge,
  AssetBadge,
  Footer,
  PayoutStatusBadge,
  SimulationNote,
} from '@/ui/components/ui';
import { explorerAccount, explorerTx, fmtAmount, fmtPeriod, shortKey } from '@/ui/lib/format';
import { enableUsdc, sendAllowance, sign, WalletError } from '@/ui/wallet/stellarClient';
import { useWallet } from '@/ui/wallet/WalletProvider';

type Payout = {
  id: string;
  amount: string;
  asset: string;
  period: string;
  status: string;
  txHash: string | null;
  pickupRef: string | null;
};
type Allowance = {
  id: string;
  recipientName: string;
  recipientAddress: string;
  corridor: string;
  asset: 'XLM' | 'USDC';
  monthlyAmount: string;
  dayOfMonth: number;
  months: number;
  status: string;
  scheduleId: string | null;
  contractId: string | null;
  muxedAttribution: string;
  payouts: Payout[];
};

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

export default function AllowanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { status: walletStatus, publicKey, connect } = useWallet();
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setAllowance(await api(`/api/allowances/${id}`));
    } catch (e) {
      toast.error('Could not load allowance', {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (walletStatus === 'connected') void refresh();
    if (walletStatus === 'disconnected') setLoading(false);
  }, [walletStatus, refresh]);

  async function sendThisMonth() {
    if (!allowance || !publicKey) return;
    setBusy(true);
    try {
      if (allowance.scheduleId) {
        const intent = await api(`/api/allowances/${id}/release-intent`, 'POST', {});
        const signedXdr = await sign(intent.xdr, publicKey);
        await api(`/api/allowances/${id}/payouts`, 'POST', { signedXdr });
      } else {
        const txHash = await sendAllowance({
          from: publicKey,
          to: allowance.recipientAddress,
          asset: allowance.asset,
          amount: allowance.monthlyAmount,
          memo: `Bakti ${allowance.recipientName}`.slice(0, 28),
        });
        await api(`/api/allowances/${id}/payouts`, 'POST', {
          txHash,
          amount: allowance.monthlyAmount,
        });
      }
      toast.success('Allowance sent', { description: 'Cash-pickup reference issued.' });
      await refresh();
    } catch (e) {
      const msg = e instanceof WalletError || e instanceof Error ? e.message : 'Payment failed';
      toast.error('Could not send this month', { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function onEnableUsdc() {
    if (!publicKey) return;
    setBusy(true);
    try {
      await enableUsdc(publicKey);
      toast.success('USDC enabled', { description: 'Your wallet can now hold USDC.' });
    } catch (e) {
      const msg = e instanceof WalletError || e instanceof Error ? e.message : 'Could not enable';
      toast.error('Enable USDC failed', { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(action: 'pause' | 'resume' | 'end') {
    setBusy(true);
    try {
      await api(`/api/allowances/${id}`, 'PATCH', { action });
      await refresh();
    } catch (e) {
      toast.error('Could not update', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCollected(payoutId: string) {
    setBusy(true);
    try {
      await api(`/api/allowances/${id}/payouts/${payoutId}/collect`, 'POST', {});
      toast.success('Marked as collected');
      await refresh();
    } catch (e) {
      toast.error('Could not update', { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  if (walletStatus !== 'connected') {
    return (
      <Shell>
        <div className="card mt-8 flex flex-col items-center gap-4 px-6 py-16 text-center">
          <h2 className="font-display text-xl font-bold text-ink">Connect your wallet</h2>
          <p className="max-w-md text-ink-soft">
            Connect the Stellar wallet that owns this allowance to view its payout history and send
            this month.
          </p>
          <button
            type="button"
            onClick={() => void connect()}
            className="btn-primary h-11 rounded-full px-6 text-base font-semibold"
          >
            Connect wallet
          </button>
        </div>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <p className="mt-10 text-center text-ink-soft">Loading allowance…</p>
      </Shell>
    );
  }

  if (!allowance) {
    return (
      <Shell>
        <p className="mt-10 text-center text-ink-soft">This allowance was not found.</p>
      </Shell>
    );
  }

  const ended = allowance.status === 'ended';
  const active = allowance.status === 'active';

  return (
    <Shell>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All allowances
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-ink">
                  {allowance.recipientName}
                </h1>
                <AllowanceStatusBadge status={allowance.status} />
              </div>
              <a
                href={explorerAccount(allowance.recipientAddress, publicEnv.network)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-ink-soft hover:text-brand-700"
              >
                {shortKey(allowance.recipientAddress, 8, 8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold tabular-nums text-ink">
                {fmtAmount(allowance.monthlyAmount)}
              </div>
              <div className="mt-1">
                <AssetBadge asset={allowance.asset} /> · monthly
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="Corridor" value={allowance.corridor} />
            <Info label="Payout day" value={`Day ${allowance.dayOfMonth}`} />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            {ended ? (
              <p className="text-sm text-ink-soft">This allowance has ended.</p>
            ) : active ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="send-button"
                  disabled={busy}
                  onClick={() => void sendThisMonth()}
                  className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {busy
                    ? 'Working…'
                    : `Send ${fmtAmount(allowance.monthlyAmount)} ${allowance.asset} now`}
                </button>
                {allowance.asset === 'USDC' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onEnableUsdc()}
                    className="btn-ghost inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold"
                  >
                    Enable USDC
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('pause')}
                  className="btn-ghost inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void changeStatus('resume')}
                  className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold"
                >
                  <Play className="h-4 w-4" />
                  Resume allowance
                </button>
              </div>
            )}
            {!ended && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void changeStatus('end')}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-800"
              >
                <Ban className="h-4 w-4" />
                End this allowance
              </button>
            )}
          </div>

          <div className="mt-6">
            <SimulationNote>
              Payments are real on Stellar mainnet. The MoneyGram / Hana cash-pickup step is a
              mainnet simulation of a SEP-24 anchor off-ramp — the reference code below is what the
              anchor would issue.
            </SimulationNote>
          </div>
        </div>

        <OffRampPanel allowance={allowance} />
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Payout history</h2>
        </div>
        {allowance.payouts.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-soft">
            No payouts yet. Send this month to create the first on-chain record for this parent.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left" data-testid="payout-list">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-semibold">Month</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Pickup reference</th>
                  <th className="px-5 py-3 font-semibold">On-chain</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {allowance.payouts.map((p) => (
                  <tr key={p.id} className="border-b border-line/60">
                    <td className="px-5 py-4 text-sm font-medium text-ink">
                      {fmtPeriod(p.period)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold tabular-nums text-ink">
                        {fmtAmount(p.amount)}
                      </span>{' '}
                      <AssetBadge asset={p.asset} />
                    </td>
                    <td className="px-5 py-4">
                      <PayoutStatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-soft">
                      {p.pickupRef ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      {p.txHash ? (
                        <a
                          href={explorerTx(p.txHash, publicEnv.network)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          View tx
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-sm text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {p.status === 'settled' && (
                        <button
                          type="button"
                          data-testid="confirm-collected"
                          disabled={busy}
                          onClick={() => void confirmCollected(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Confirm collected
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      <Footer />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-mist px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-0.5 font-medium text-ink">{value}</div>
    </div>
  );
}

function OffRampPanel({ allowance }: { allowance: Allowance }) {
  const [uri, setUri] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    api(`/api/allowances/${allowance.id}/pay-uri`)
      .then((d) => {
        if (mounted) setUri(d.uri);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [allowance.id]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    void streamRecipientPayments(allowance.recipientAddress, controller.signal, () =>
      setLive(true),
    );
    return () => controller.abort();
  }, [allowance.recipientAddress]);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">Cash off-ramp</h2>
        <span
          className={
            live
              ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'
              : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600'
          }
        >
          <Radio className="h-3.5 w-3.5" />
          {live ? 'Live on Horizon' : 'Watching…'}
        </span>
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        The anchor attributes each deposit to this family with a SEP-23 muxed address, then
        off-ramps to a {allowance.corridor} pickup.
      </p>

      <div className="mt-4 rounded-xl bg-mist px-4 py-3">
        <div className="text-xs uppercase tracking-wide text-ink-soft">
          Anchor deposit reference
        </div>
        <div className="mt-1 break-all font-mono text-xs text-ink">
          {shortKey(allowance.muxedAttribution, 12, 12)}
        </div>
      </div>

      {uri && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-ink-soft">SEP-7 pay link</div>
          <div className="mt-1.5 flex items-center gap-2">
            <a
              href={uri}
              className="btn-ghost inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold"
            >
              Open in a Stellar wallet
            </a>
            <button
              type="button"
              aria-label="Copy pay link"
              onClick={() => {
                void navigator.clipboard?.writeText(uri);
                toast('SEP-7 link copied');
              }}
              className="btn-ghost inline-flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Best-effort Horizon SSE: watch the recipient's payments stream. Purely
 * additive live feedback — never blocks the pay flow. Manual fetch + reader per
 * the workspace SSE rule (no sdk.stream()).
 */
async function streamRecipientPayments(
  account: string,
  signal: AbortSignal,
  onEvent: () => void,
): Promise<void> {
  try {
    const url = `${publicEnv.horizonUrl}/accounts/${account}/payments?cursor=now&limit=1`;
    const res = await fetch(url, {
      headers: { Accept: 'text/event-stream' },
      signal,
    });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const chunks = buf.split('\n\n');
      buf = chunks.pop() ?? '';
      for (const chunk of chunks) {
        const line = chunk.split('\n').find((l) => l.startsWith('data: '));
        if (line && line.length > 8) onEvent();
      }
    }
  } catch {
    /* best-effort; ignore aborts and network errors */
  }
}

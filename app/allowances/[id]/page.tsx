'use client';

import {
  ArrowLeft,
  BadgeCheck,
  Ban,
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
import { normalizeNetworkId } from '@/shared/network-config';
import { getClientNetworkConfig } from '@/ui/network/client-network';
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
  sep31Id?: string | null;
  sep31Status?: string | null;
};

/** Friendly wording for the anchor-side (SEP-31) state of a payout. */
function anchorStatusLabel(p: Payout): { text: string; tone: 'ok' | 'busy' | 'warn' } | null {
  if (!p.sep31Id) return null;
  switch (p.sep31Status) {
    case 'pending_sender':
      return { text: 'Awaiting transfer', tone: 'busy' };
    case 'pending_stellar':
      return { text: 'Confirming on-chain', tone: 'busy' };
    case 'pending_receiver':
    case 'pending_external':
      return { text: 'Funds received — paying out', tone: 'busy' };
    case 'completed':
      return { text: 'Funds received · cash paid out', tone: 'ok' };
    case 'refunded':
      return { text: 'Refunded by anchor', tone: 'warn' };
    case 'expired':
      return { text: 'Expired at anchor', tone: 'warn' };
    case 'error':
      return { text: 'Anchor reported an error', tone: 'warn' };
    default:
      return { text: p.sep31Status ?? 'Opened at anchor', tone: 'busy' };
  }
}
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
  network?: string;
  payouts: Payout[];
};

/** Explorer + Horizon endpoints follow the network this allowance lives on. */
function allowanceNet(a: Allowance) {
  return getClientNetworkConfig(normalizeNetworkId(a.network));
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

  // Live view: the keeper settles periods on its own schedule, so poll quietly
  // and let the table update itself — with a toast when a new pickup ref lands.
  const settledSeen = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const p of allowance?.payouts ?? []) {
      if (p.status === 'settled' || p.status === 'collected') settledSeen.current.add(p.id);
    }
  }, [allowance]);
  // Change-driven live updates: subscribe to the SSE feed — the server only
  // pushes when payout state actually changes, so the UI updates exactly when
  // the keeper/anchor did something, not on a dumb timer.
  useEffect(() => {
    if (walletStatus !== 'connected') return;
    const controller = new AbortController();
    let stopped = false;
    void (async () => {
      while (!stopped) {
        try {
          const res = await fetch(`/api/allowances/${id}/events`, {
            headers: { Accept: 'text/event-stream' },
            signal: controller.signal,
          });
          if (!res.ok || !res.body) {
            await new Promise((r) => setTimeout(r, 8000));
            continue;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const chunks = buf.split('\n\n');
            buf = chunks.pop() ?? '';
            for (const chunk of chunks) {
              const line = chunk.split('\n').find((l) => l.startsWith('data: '));
              if (!line) continue;
              const fresh = JSON.parse(line.slice(6)) as Allowance;
              const newlySettled = fresh.payouts.filter(
                (p) => p.status === 'settled' && !settledSeen.current.has(p.id),
              );
              for (const p of newlySettled) {
                settledSeen.current.add(p.id);
                toast.success('Allowance sent automatically', {
                  description: `The anchor confirmed the transfer — pickup ref ${p.pickupRef ?? '—'}`,
                });
              }
              setAllowance(fresh);
            }
          }
        } catch {
          /* aborted or network hiccup — fall through to reconnect */
        }
        if (!stopped) await new Promise((r) => setTimeout(r, 3000));
      }
    })();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [walletStatus, id]);

  async function sendThisMonth() {
    if (!allowance || !publicKey) return;
    setBusy(true);
    try {
      const netId = allowanceNet(allowance).id;
      if (allowance.corridor === 'sep31') {
        // SEP-31: the anchor tells us where to pay and which memo to attach.
        const intent = await api(`/api/allowances/${id}/sep31-intent`, 'POST', {});
        await sendAllowance({
          from: publicKey,
          to: intent.destination,
          asset: allowance.asset,
          amount: intent.amount,
          memo: intent.memo,
          memoType: intent.memoType,
          network: netId,
        });
        // Give the anchor a moment to observe the payment, then sync status.
        let synced = null;
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          synced = await api(`/api/allowances/${id}/sep31-status`, 'POST', {});
          if (synced.anchorStatus === 'completed') break;
        }
        if (synced?.anchorStatus === 'completed') {
          toast.success('Anchor confirmed the transfer', {
            description: `Cash pickup ref ${synced.pickupRef ?? '—'}`,
          });
        } else {
          toast.message('Payment sent — anchor is processing', {
            description: `Anchor status: ${synced?.anchorStatus ?? 'pending'}`,
          });
        }
        await refresh();
        return;
      }
      if (allowance.scheduleId) {
        const intent = await api(`/api/allowances/${id}/release-intent`, 'POST', {});
        const signedXdr = await sign(intent.xdr, publicKey, netId);
        await api(`/api/allowances/${id}/payouts`, 'POST', { signedXdr });
      } else {
        const txHash = await sendAllowance({
          from: publicKey,
          to: allowance.recipientAddress,
          asset: allowance.asset,
          amount: allowance.monthlyAmount,
          memo: `Bakti ${allowance.recipientName}`.slice(0, 28),
          network: netId,
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
      await enableUsdc(publicKey, allowance ? allowanceNet(allowance).id : undefined);
      toast.success('USDC enabled', { description: 'Your wallet can now hold USDC.' });
    } catch (e) {
      const msg = e instanceof WalletError || e instanceof Error ? e.message : 'Could not enable';
      toast.error('Enable USDC failed', { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function syncAnchor() {
    setBusy(true);
    try {
      const synced = await api(`/api/allowances/${id}/sep31-status`, 'POST', {});
      toast.message(`Anchor status: ${synced.anchorStatus}`, {
        description: synced.pickupRef ? `Pickup ref ${synced.pickupRef}` : undefined,
      });
      await refresh();
    } catch (e) {
      toast.error('Could not reach the anchor', {
        description: e instanceof Error ? e.message : undefined,
      });
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
              {allowance.recipientAddress ? (
                <a
                  href={explorerAccount(allowance.recipientAddress, allowanceNet(allowance).explorerSlug)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-ink-soft hover:text-brand-700"
                >
                  {shortKey(allowance.recipientAddress, 8, 8)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="mt-1 block text-xs text-ink-soft">
                  Cash pickup via partner anchor — no wallet on the parent's side
                </span>
              )}
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
            <Info
              label="Corridor"
              value={allowance.corridor === 'sep31' ? 'Partner anchor (SEP-31)' : allowance.corridor}
            />
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
              Payments are real on Stellar. The cash-pickup step is handled by a SEP-31 partner
              anchor — the reference code below is what the anchor issues (on testnet, a rehearsal
              anchor stands in until a mainnet partner goes live).
            </SimulationNote>
          </div>
        </div>

        {allowance.corridor !== 'sep31' && <OffRampPanel allowance={allowance} />}
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold text-ink">Payout history</h2>
          {allowance.corridor === 'sep31' && (
            <button
              type="button"
              data-testid="sync-anchor"
              disabled={busy}
              onClick={() => void syncAnchor()}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink disabled:opacity-60"
            >
              <Radio className="h-3.5 w-3.5" />
              Sync anchor status
            </button>
          )}
        </div>
        {allowance.payouts.length === 0 ? (
          <p className="px-5 py-10 text-center text-ink-soft">
            No payouts yet. Send this month to create the first on-chain record for this parent.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left" data-testid="payout-list">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-semibold">Month</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Anchor</th>
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
                    <td className="px-5 py-4">
                      {(() => {
                        const a = anchorStatusLabel(p);
                        if (!a) return <span className="text-sm text-ink-soft">—</span>;
                        const tone =
                          a.tone === 'ok'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : a.tone === 'warn'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200';
                        return (
                          <span
                            data-testid="anchor-status"
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
                          >
                            {a.tone === 'busy' && (
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            )}
                            {a.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-ink-soft">
                      {p.pickupRef ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      {p.txHash ? (
                        <a
                          href={explorerTx(p.txHash, allowanceNet(allowance).explorerSlug)}
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
  const [live, setLive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    if (!allowance.recipientAddress) return;
    void streamRecipientPayments(allowanceNet(allowance).horizonUrl, allowance.recipientAddress, controller.signal, () =>
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
        Legacy allowance: payments go straight to the recipient's wallet, watched live on Horizon.
        New allowances use the SEP-31 partner-anchor corridor instead.
      </p>
    </div>
  );
}

/**
 * Best-effort Horizon SSE: watch the recipient's payments stream. Purely
 * additive live feedback — never blocks the pay flow. Manual fetch + reader per
 * the workspace SSE rule (no sdk.stream()).
 */
async function streamRecipientPayments(
  horizonUrl: string,
  account: string,
  signal: AbortSignal,
  onEvent: () => void,
): Promise<void> {
  try {
    const url = `${horizonUrl}/accounts/${account}/payments?cursor=now&limit=1`;
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

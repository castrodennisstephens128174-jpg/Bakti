import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Globe,
  HandCoins,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/ui/components/Header';
import { Footer } from '@/ui/components/ui';

const BSP_OFW = 'https://www.bsp.gov.ph/statistics/external/ofw.aspx';
const BSP_SOURCE = 'https://www.bsp.gov.ph/statistics/external/ofw2.aspx';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-5">
        <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <Globe className="h-3.5 w-3.5" /> Malaysia → Philippines · research corridor
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
              Plan salary-day support for family in the Philippines.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Bakti is a testnet prototype for Filipino workers in Malaysia who want a clear family
              support plan and a verifiable Stellar transfer. Today, the recipient must have a
              Stellar address. Cash-out through a licensed provider is the next integration, not a
              current feature.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                data-testid="cta-button"
                className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold"
              >
                Create a support plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stats"
                className="btn-ghost inline-flex h-12 items-center rounded-full px-5 text-base font-medium"
              >
                See prototype activity
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Freighter signs a custom manageData session challenge and each on-chain action.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-ink-soft">Product boundary</span>
                <div className="mt-1 font-display text-2xl font-bold text-ink">Today vs next</div>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                Testnet prototype
              </span>
            </div>
            <div className="my-5 h-px bg-line" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <FlowColumn
                title="Today · working"
                tone="current"
                steps={[
                  'Sender connects Freighter',
                  'Creates a planning record',
                  'Transfers XLM or USDC to a recipient Stellar address',
                  'Bakti verifies the transaction on-chain',
                ]}
              />
              <FlowColumn
                title="Next · planned"
                tone="future"
                steps={[
                  'Certified SEP-24 / licensed anchor integration',
                  'Provider authentication and KYC',
                  'Quote, deposit routing, and status tracking',
                  'PHP cash-out and provider-confirmed collection',
                ]}
              />
            </div>
            <div className="mt-5 rounded-xl bg-mist px-4 py-3 text-sm text-brand-800">
              <strong>Not automatic:</strong> the chosen day is reminder metadata. The sender still
              signs each transfer or contract release.
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-6 sm:grid-cols-3">
          <Feature
            icon={CalendarClock}
            title="Make support intentional"
            body="Keep amount, recipient, and a salary-day reminder together. No scheduler currently sends funds automatically."
          />
          <Feature
            icon={BadgeCheck}
            title="Verify what moved"
            body="Direct payments are checked against Horizon; XLM escrow releases are confirmed by Soroban RPC and retain a transaction hash."
          />
          <Feature
            icon={UserRound}
            title="Recipient wallet required today"
            body="The current destination is the Stellar address entered by the sender. Bakti does not yet create a cash-pickup route."
          />
        </section>

        <section className="card mt-6 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Corridor evidence
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold text-ink">
            A large national flow, with a measured Malaysia signal
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <StatCard
              value="US$39.619B"
              label="Philippines personal remittances, 2025 preliminary"
              detail="Cash remittances were US$35.634B; both grew 3.3%."
            />
            <StatCard
              value="US$675.153M"
              label="Malaysia-attributed Philippine cash remittances, 2025 provisional"
              detail="This is the immediate source of funds reported by BSP, not proven true origin and not a corridor TAM."
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-ink-soft">
            Jan–May 2026 preliminary: personal remittances US$15.735B, cash remittances US$14.110B,
            and Malaysia-attributed cash remittances US$279.807M. Sources:{' '}
            <a className="text-brand-700 underline" href={BSP_OFW} target="_blank" rel="noreferrer">
              BSP OFW remittances
            </a>{' '}
            and{' '}
            <a
              className="text-brand-700 underline"
              href={BSP_SOURCE}
              target="_blank"
              rel="noreferrer"
            >
              BSP source-country tables
            </a>
            .
          </p>
        </section>

        <section className="card mt-6 p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            One understandable flow
          </p>
          <h2 className="font-display mt-2 text-2xl font-bold text-ink">
            Sender → Bakti plan → Stellar → recipient wallet
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch">
            <FlowNode label="Sender" detail="Filipino worker in Malaysia" />
            <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-brand-700 md:block" />
            <FlowNode label="Bakti plan" detail="Amount + recipient + reminder date" />
            <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-brand-700 md:block" />
            <FlowNode label="Stellar" detail="Direct transfer or XLM escrow release" />
            <ArrowRight className="mx-auto hidden h-5 w-5 self-center text-brand-700 md:block" />
            <FlowNode label="Recipient wallet" detail="Entered Stellar address" />
          </div>
          <div className="mt-5 rounded-2xl border-2 border-dashed border-brand-100 bg-brand-50/40 p-5">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <CircleDollarSign className="h-5 w-5 text-brand-700" /> Planned last mile
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Stellar transfer → certified SEP-24/MoneyGram Ramps or another licensed anchor → KYC
              and provider workflow → PHP cash-out. No provider API, webview, quote, routing, pickup
              reference, or collection confirmation is connected today.
            </p>
          </div>
        </section>

        <section className="card mt-6 p-7">
          <h2 className="font-display text-xl font-bold text-ink">Why Stellar for the prototype</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Feature
              icon={HandCoins}
              title="Direct wallet control"
              body="Freighter signs the session challenge and transactions; Bakti never receives a wallet secret."
              plain
            />
            <Feature
              icon={ShieldCheck}
              title="Verifiable rails"
              body="Horizon and Soroban RPC provide transaction evidence for the implemented payment paths."
              plain
            />
            <Feature
              icon={Globe}
              title="A standards-based target path"
              body="Anchors connect Stellar assets to off-chain rails. SEP-24 is a hosted interactive flow that requires anchor authentication and KYC."
              plain
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
  plain = false,
}: {
  icon: typeof CalendarClock;
  title: string;
  body: string;
  plain?: boolean;
}) {
  return (
    <div className={plain ? '' : 'card p-5'}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

function FlowColumn({
  title,
  steps,
  tone,
}: {
  title: string;
  steps: string[];
  tone: 'current' | 'future';
}) {
  return (
    <div
      className={
        tone === 'future'
          ? 'rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/30 p-4'
          : 'rounded-xl border border-line bg-white p-4'
      }
    >
      <div className="font-semibold text-ink">{title}</div>
      <ol className="mt-3 space-y-2 text-sm text-ink-soft">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="font-semibold text-brand-700">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatCard({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-accent-50 p-5">
      <div className="font-display text-3xl font-bold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{label}</div>
      <p className="mt-2 text-xs leading-5 text-ink-soft">{detail}</p>
    </div>
  );
}

function FlowNode({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 text-center">
      <div className="font-semibold text-ink">{label}</div>
      <p className="mt-1 text-xs leading-5 text-ink-soft">{detail}</p>
    </div>
  );
}

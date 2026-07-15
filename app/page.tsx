import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  HandCoins,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/ui/components/Header';
import { Footer } from '@/ui/components/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl px-5">
        <section className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <CalendarClock className="h-3.5 w-3.5" />A steady allowance, every month
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] text-ink sm:text-5xl">
              Send your parents a monthly allowance
              <span className="text-brand-700"> they collect as cash.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Bakti turns easy-to-forget remittances into a dignified, predictable income for the
              parents you support back home. Set the amount and the day once. Each month you sign a
              single Stellar payment — they pick up local cash. No smartphone or crypto on their
              side.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                data-testid="cta-button"
                className="btn-primary inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-semibold"
              >
                Set up an allowance
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stats"
                className="btn-ghost inline-flex h-12 items-center rounded-full px-5 text-base font-medium"
              >
                See live activity
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              No sign-up. Connect a Stellar wallet only when you are ready to sign.
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-soft">Monthly allowance</span>
              <span className="font-display text-2xl font-bold tabular-nums text-ink">
                25.00 <span className="text-base text-ink-soft">USDC</span>
              </span>
            </div>
            <div className="my-5 h-px bg-line" />
            <ol className="space-y-4">
              {[
                {
                  icon: HandCoins,
                  t: 'You sign one payment',
                  d: 'Freighter signs a single USDC transfer on Stellar mainnet.',
                },
                {
                  icon: ShieldCheck,
                  t: 'The anchor off-ramps',
                  d: 'Funds settle to a MoneyGram or Hana cash-pickup reference.',
                },
                {
                  icon: MapPin,
                  t: 'Your parent collects cash',
                  d: 'They walk in with the reference and take home local money.',
                },
              ].map((row, i) => (
                <li key={row.t} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <row.icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-ink">{row.t}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{row.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-xl bg-mist px-4 py-3 text-sm text-brand-800">
              Every payment is a <span className="font-semibold">real, verifiable</span> Stellar
              transaction — linked to its receipt on stellar.expert.
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-6 sm:grid-cols-3">
          {[
            {
              icon: CalendarClock,
              title: 'Predictable, not ad-hoc',
              body: 'A standing plan with a fixed amount and payout day, so support never gets forgotten in a busy month.',
            },
            {
              icon: BadgeCheck,
              title: 'Verifiable on-chain',
              body: 'Each month settles as one Stellar payment you can audit. No opaque wire, no guessing whether it arrived.',
            },
            {
              icon: MapPin,
              title: 'Cash where they are',
              body: 'The SEP-24 off-ramp turns USDC into a MoneyGram or Hana pickup code — dignity for parents who never touch crypto.',
            },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="card mt-6 p-7">
          <h2 className="font-display text-xl font-bold text-ink">How Bakti works</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-4">
            {[
              {
                n: '1',
                t: 'Connect',
                d: 'Link your Stellar wallet — pinned to mainnet whatever your wallet network.',
              },
              {
                n: '2',
                t: 'Add a parent',
                d: 'Name them, paste their Stellar address, pick a pickup corridor and amount.',
              },
              {
                n: '3',
                t: 'Sign the month',
                d: 'One tap sends the allowance in XLM or USDC. The anchor issues a pickup code.',
              },
              {
                n: '4',
                t: 'They collect',
                d: 'Your parent takes the reference to a pickup point and walks out with cash.',
              },
            ].map((s) => (
              <li key={s.n}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-display font-bold text-white">
                  {s.n}
                </div>
                <div className="mt-3 font-semibold text-ink">{s.t}</div>
                <p className="mt-1 text-sm text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
}

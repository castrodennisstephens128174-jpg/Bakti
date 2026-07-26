---
marp: true
theme: gaia
paginate: true
size: 16:9
html: true
style: |
  @import url('assets/primeicons/primeicons.css');

  /* type scale: 42 display / 30 stat / 21 body / 15 label (4 sizes, no more) */
  /* spacing scale: 8 / 16 / 24 / 32 / 48 / 64 (6 values, no more) */

  section {
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    background: #fbfaf7;
    color: #0b1b2b;
    padding: 48px 64px;
    display: flex;
    flex-direction: column;
    justify-content: safe center;
    line-height: 1.45;
    gap: 16px;
    position: relative;
  }
  section::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: #0284c7;
  }
  section.lead::before { display: none; }
  section.lead {
    background: linear-gradient(135deg, #0369a1, #0b1b2b);
    color: #ffffff;
  }
  section.lead h1 { color: #ffffff; }
  section.lead p { color: #cfe4f2; }

  h1 { font-size: 44px; font-weight: 800; color: #0b1b2b; line-height: 1.15; margin: 0; }
  h2 {
    display: inline-block;
    align-self: flex-start;
    font-size: 14px;
    font-weight: 800;
    color: #ffffff;
    background: #0284c7;
    padding: 5px 14px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0;
  }
  p, li, td, th { font-size: 21px; color: #33465e; line-height: 1.45; }
  strong { color: #0b1b2b; }

  .stats { display: flex; gap: 16px; margin-top: 8px; }
  .stat { background: #fdf1e0; border-radius: 10px; border-bottom: 3px solid #0284c7; padding: 16px 20px; flex: 1; }
  .stat .num { font-size: 30px; font-weight: 800; color: #0b1b2b; display: block; }
  .stat .num.pi { font-size: 30px; color: #0284c7; }
  .stat .lbl { display: block; max-width: 100%; font-size: 15px; line-height: 1.3; color: #51617a; }

  .source { margin-top: 8px; font-size: 15px; color: #8291a3; }
  .pill {
    display: inline-block;
    background: #fdf1e0;
    color: #0b1b2b;
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 15px;
    font-weight: 700;
    margin-right: 8px;
  }
  code { background: #f1f5f9; color: #0369a1; border-radius: 4px; padding: 1px 6px; }
  .row { display: flex; gap: 32px; align-items: flex-start; }
  .row > div { flex: 1; }
  .row img { width: 100%; }

  .bar-track { flex: 1; background: #f1f5f9; border-radius: 999px; height: 22px; overflow: hidden; }
  .bar-fill { display: block; height: 100%; border-radius: 999px; }
  .bar-fill.context { width: 100%; background: #cbd5e1; }
  .bar-fill.highlight { width: 1.9%; min-width: 6px; background: #0284c7; }
  .bar-row { display: flex; align-items: center; gap: 16px; margin-top: 10px; }
  .bar-label { width: 260px; font-size: 15px; line-height: 1.3; color: #51617a; }
  .bar-value { width: 170px; font-size: 21px; font-weight: 800; color: #0b1b2b; text-align: right; }

  .card { background: #ffffff; border: 1px solid #e6e2d8; border-radius: 10px; padding: 20px 24px; flex: 1; }
  .card ul { margin: 8px 0 0; padding-left: 20px; }
  .card li { font-size: 17px; margin-bottom: 6px; }
  .badge { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; margin-bottom: 6px; }
  .badge.now { background: #dcfce7; color: #166534; }
  .badge.next { background: #fdf1e0; color: #92400e; }
  .card-title { font-size: 19px; font-weight: 800; color: #0b1b2b; margin: 0 0 4px; }

  .flow-row { display: flex; align-items: stretch; gap: 10px; margin-top: 16px; }
  .flow-node { flex: 1; min-width: 0; background: #ffffff; border: 2px solid #0284c7; border-radius: 10px; padding: 16px 14px; text-align: center; }
  .flow-node strong { display: block; font-size: 19px; }
  .flow-node span { display: block; font-size: 14px; line-height: 1.3; color: #51617a; }
  .flow-node.target { border-style: dashed; border-color: #d18b2c; background: #fdf1e0; }
  .flow-arrow { flex: 0 0 auto; align-self: center; font-size: 22px; color: #94a3b8; }
---

<!-- _class: lead -->

# Bakti

Plan salary-day support. Verify the transfer.

Filipino workers abroad, family in the Philippines

<div class="stats">
<div class="stat"><span class="num pi pi-check-circle"></span><span class="lbl">Stellar mainnet product</span></div>
<div class="stat"><span class="num pi pi-shield"></span><span class="lbl">Non-custodial signing</span></div>
<div class="stat"><span class="num pi pi-map-marker"></span><span class="lbl">Licensed cash-out: next integration target</span></div>
</div>

<p class="source">bakti-stellar.vercel.app · Stellar APAC Hackathon 2026 · Track A</p>

---

## The moment

# "I meant to send it. The week got away from me."

<span class="badge next">Illustrative persona, not a claimed interview</span>

Maria works in Singapore, one of over 221,000 Filipino workers there. Payday comes. Some months she remembers to send money home, some months a long shift pushes it to next week. She wants a standing plan she sets up once, then signs each month on a habit, not from memory.

**Her mother, back home in the Philippines, has never used a banking app. What she actually wants is to walk in, show her ID, and leave with cash.** Today the recipient still needs a Stellar address. Cash pickup for her mother is the target, not built yet.

---

## Corridor evidence

# One anchor in the Philippines reaches every market Filipino workers send from

<div class="stats">
<div class="stat"><span class="num">397,892</span><span class="lbl">Filipino workers in the UAE, 2025, the #1 destination</span></div>
<div class="stat"><span class="num">386,699</span><span class="lbl">Filipino workers in Saudi Arabia, 2025, #2</span></div>
<div class="stat"><span class="num">7.3%</span><span class="lbl">Share of all 2025 PH cash remittances sent from Singapore, #2 source after the US</span></div>
</div>

The same Philippines anchor also covers Hong Kong (202,415 workers), Japan (60,748), South Korea (38,390), and Malaysia (35,052). Only the receiving side needs a Stellar anchor. Wherever the sender is, they just need XLM/USDC sitting in their own wallet.

<p class="source">Sources: DMW/OFW deployment reporting via businessmirror.com.ph · Bangko Sentral ng Pilipinas cash remittance data</p>

---

## Product today vs next

# Plan, sign, and verify on-chain today

<div class="row">
<div class="card">
<span class="badge now">Today · working</span>
<ul>
<li>Freighter + custom signed <code>manageData</code> session, not SEP-10</li>
<li>Support-plan records; reminder day is metadata only</li>
<li>XLM escrow/release, 60-ledger demo cadence</li>
<li>Direct XLM/USDC to a recipient address the sender enters and confirms</li>
<li>Horizon/RPC verification, SEP-7 link, recipient watcher</li>
<li>Status ends at <strong>Verified on-chain</strong></li>
</ul>
</div>
<div class="card">
<span class="badge next">Next · planned</span>
<ul>
<li>Licensed provider onboarding, KYB/compliance, agreements</li>
<li>SEP-1 + provider SEP-10 + hosted SEP-24</li>
<li>KYC, quote/limits, approved deposit routing</li>
<li>Provider transaction status and reference</li>
<li>PHP cash-out and provider-confirmed collection</li>
</ul>
</div>
</div>

---

## One simple flow

# Sender → Stellar → Anchor → Receiver

<div class="flow-row">
<div class="flow-node"><strong>Sender</strong><span>Filipino worker, any market</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node"><strong>Stellar</strong><span>Direct payment or XLM escrow, signed by sender</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node target"><strong>Anchor</strong><span>MoneyGram Ramps, target, not connected</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node"><strong>Receiver</strong><span>Her mother, cash in hand, no wallet needed</span></div>
</div>

Solid border = built today. Dashed = planned, not yet connected. Once the anchor connects, funds land in MoneyGram's own Stellar account, then flow into their agent network across the Philippines. Her mother just needs a reference number and a photo ID to walk out with cash. No wallet, no app.

---

## Why Stellar; why one anchor is enough

# One Philippines anchor serves every sending market

<div class="row">
<div class="card">
<p class="card-title">Why one anchor covers many markets</p>
<ul>
<li>Only the receiving side needs a Stellar anchor. A sender in the UAE, Saudi Arabia, Singapore, or anywhere else just needs XLM/USDC in their own wallet, bought on any exchange</li>
<li>No separate integration per sending country, no separate deal per market</li>
<li>The Philippines is the one place Bakti needs a licensed cash-out partner</li>
</ul>
</div>
<div class="card">
<p class="card-title">Why MoneyGram Ramps</p>
<ul>
<li>Real, live Stellar anchor. Been running in the Philippines since October 2021, one of the first four countries when MoneyGram launched this with Stellar, alongside Canada, Kenya, and the US</li>
<li>Funds land in MoneyGram's own Stellar account. The recipient just shows a reference number and photo ID to pick up cash, no wallet needed</li>
<li>Bakti already emailed MoneyGram Ramps about integrating. No reply yet, and nothing's confirmed</li>
</ul>
</div>
</div>

<p class="source">Sources: stellar.org/case-studies/moneygram-international (2021 launch) · developer.moneygram.com/integrate-moneygram-ramps</p>

---

## Business model + GTM

# Hypotheses to test, not forecasts

<div class="row">
<div class="card">
<span class="badge next">Unvalidated business model</span>
<ul>
<li>Transparent sender service fee within a licensed provider quote</li>
<li>Provider referral/revenue share where permitted</li>
<li>Employer, cooperative, or worker-community distribution</li>
<li>No validated price, take rate, margin, or unit economics</li>
</ul>
</div>
<div class="card">
<span class="badge now">GTM experiments</span>
<ul>
<li>Interview Filipino workers abroad (any market) and family recipients in the Philippines</li>
<li>Test planning/reminder value before automation</li>
<li>Follow up on the MoneyGram Ramps email, without claiming a partnership</li>
<li>Run testnet usability studies for signing and address safety</li>
</ul>
</div>
</div>

---

## Build status + ask

# A working mainnet core, with an honest last-mile gap

<div class="row">
<div class="card">
<span class="badge now">Built</span>
<ul>
<li>Contract itself: live on mainnet since 2026-07-12, creator key under review</li>
<li>Separately: a fresh, judge-facing demo transaction is pending, to be signed before submission</li>
<li>Direct payment verification and support-plan UI</li>
<li>Current endpoints stop at Verified on-chain</li>
</ul>
</div>
<div class="card">
<span class="badge next">Ask</span>
<ul>
<li>Warm introduction to MoneyGram Ramps, or feedback on the outreach email already sent</li>
<li>Customer-discovery introductions among Filipino worker communities abroad</li>
<li>Feedback on the planning job before adding automation</li>
</ul>
<p style="font-size:15px;color:#8291a3;margin-top:10px;"><strong>Not built:</strong> SEP-24, anchor API/webview, KYC, provider routing/status/reference, PHP cash-out, automatic scheduling.</p>
</div>
</div>

<p class="source">Contract: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR · stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR</p>

---

<!-- _class: lead -->

# The target value, in one line.

A sender signs once a month. Her mother just walks in and picks up cash. No wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet. It's exactly what the anchor connection is for.

<div class="stats">
<div class="stat"><span class="num">bakti-stellar.vercel.app</span><span class="lbl">Live app</span></div>
<div class="stat"><span class="num">Bakti · GitHub</span><span class="lbl">Source & issues</span></div>
</div>

Stellar APAC Hackathon 2026 · Track A

---
marp: true
theme: gaia
paginate: true
size: 16:9
html: true
style: |
  @import url('assets/primeicons/primeicons.css');

  /* type scale: 42 display / 30 stat / 21 body / 15 label — 4 sizes, no more */
  /* spacing scale: 8 / 16 / 24 / 32 / 48 / 64 — 6 values, no more */

  section {
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
    background: #fbfaf7;
    color: #0b1b2b;
    padding: 48px 64px;
    display: flex;
    flex-direction: column;
    justify-content: safe center;
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
  .stat .lbl { font-size: 15px; color: #51617a; }

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
  .row { display: flex; gap: 32px; align-items: center; }
  .row > div { flex: 1; }
  .row img { width: 100%; }

  .bar-track { flex: 1; background: #f1f5f9; border-radius: 999px; height: 22px; overflow: hidden; }
  .bar-fill { display: block; height: 100%; border-radius: 999px; }
  .bar-fill.context { width: 100%; background: #cbd5e1; }
  .bar-fill.highlight { width: 1.9%; min-width: 6px; background: #0284c7; }
  .bar-row { display: flex; align-items: center; gap: 16px; margin-top: 10px; }
  .bar-label { width: 260px; font-size: 15px; color: #51617a; }
  .bar-value { width: 170px; font-size: 21px; font-weight: 800; color: #0b1b2b; text-align: right; }

  .card { background: #ffffff; border: 1px solid #e6e2d8; border-radius: 10px; padding: 20px 24px; flex: 1; }
  .card ul { margin: 8px 0 0; padding-left: 20px; }
  .card li { font-size: 17px; margin-bottom: 6px; }
  .badge { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; margin-bottom: 6px; }
  .badge.now { background: #dcfce7; color: #166534; }
  .badge.next { background: #fdf1e0; color: #92400e; }
  .card-title { font-size: 19px; font-weight: 800; color: #0b1b2b; margin: 0 0 4px; }
---

<!-- _class: lead -->

# Bakti

Plan salary-day support. Verify the transfer.

Filipino workers in Malaysia → family in the Philippines

<div class="stats">
<div class="stat"><span class="num pi pi-check-circle"></span><span class="lbl">Stellar mainnet product</span></div>
<div class="stat"><span class="num pi pi-shield"></span><span class="lbl">Non-custodial signing</span></div>
<div class="stat"><span class="num pi pi-map-marker"></span><span class="lbl">Licensed cash-out: next integration</span></div>
</div>

<p class="source">bakti-stellar.vercel.app · Stellar APAC Hackathon 2026 · Track A</p>

---

## Human problem / target persona

# "I want support to be ready around salary day."

<span class="badge next">Illustrative persona · not a claimed interview</span>

Maria is a Filipino service worker in Kuala Lumpur. She wants to set aside support for her mother, remember the commitment, and know where the transfer went.

**Job: make family support intentional, legible, and verifiable.**

Today Maria still needs her mother's Stellar address and signs every transfer. Bakti does not send automatically.

---

## Corridor evidence

# A large national flow, with a measured Malaysia signal

<div class="bar-row">
<span class="bar-label">Philippines cash remittances<br>2025 preliminary</span>
<span class="bar-track"><span class="bar-fill context"></span></span>
<span class="bar-value">US$35.634B</span>
</div>
<div class="bar-row">
<span class="bar-label">Malaysia-attributed<br>2025 provisional</span>
<span class="bar-track"><span class="bar-fill highlight"></span></span>
<span class="bar-value">US$675.153M</span>
</div>

Jan–May 2026 already US$279.807M Malaysia-attributed cash. Signal, not TAM — BSP source-country attribution reflects the immediate source of funds, not necessarily true origin.

<p class="source">Source: Bangko Sentral ng Pilipinas · bsp.gov.ph/statistics/external/ofw.aspx, ofw2.aspx</p>

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
<li>Direct XLM/USDC to entered recipient address</li>
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

# Solid is current. Dashed is planned.

`Sender (Malaysia)` → `Bakti plan` → `Stellar (direct payment or XLM escrow)` → `Recipient wallet`

<span class="pill">Planned</span> Provider-approved deposit → licensed anchor → KYC → PHP cash-out → family member

---

## Why Stellar; why the provider path

# Verifiable rails now; regulated last mile next

<div class="row">
<div class="card">
<p class="card-title">Why Stellar for this prototype</p>
<ul>
<li>Freighter keeps signing with the sender</li>
<li>Horizon and Soroban RPC make transfers inspectable</li>
<li>Soroban demonstrates pre-funded XLM release rules</li>
<li>Anchors define how Stellar assets connect to off-chain rails</li>
<li>SEP-24 is hosted and interactive — anchor auth + KYC required</li>
</ul>
</div>
<div class="card">
<p class="card-title">MoneyGram Ramps as a target path</p>
<ul>
<li>Not a Bakti partner or current feature</li>
<li>Requires allowlisting, SEP-1/10/24, KYC, KYB, agreements</li>
<li>Malaysia + Philippines both cash-out only — no MY cash-in route today</li>
</ul>
<div class="stats" style="margin-top:12px;">
<div class="stat"><span class="num">$2,500</span><span class="lbl">Documented + live-API max</span></div>
<div class="stat"><span class="num">$20</span><span class="lbl">Actual cert-tier cap today ($100 total)</span></div>
</div>
</div>
</div>

<p class="source">Sources: developers.stellar.org anchors/SEP-24 docs · developer.moneygram.com integrate-moneygram-ramps · stellar.moneygram.com live info endpoint</p>

---

## Business model + GTM

# Hypotheses to test — not forecasts

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
<li>Interview Filipino workers in Malaysia and family recipients</li>
<li>Test planning/reminder value before automation</li>
<li>Map compliant Malaysia funding and Philippines payout partners</li>
<li>Run testnet usability studies for signing and address safety</li>
<li>Seek provider sandbox/certification conversations, no partnership claim</li>
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
<li>Deployed on mainnet, creator key under review</li>
<li>Mainnet release transaction: pending, to be signed before submission</li>
<li>Direct payment verification and support-plan UI</li>
<li>Current endpoints stop at Verified on-chain</li>
</ul>
</div>
<div class="card">
<span class="badge next">Ask</span>
<ul>
<li>Anchor review: confirm third-party cash pickup (no recipient wallet/KYC) and a Malaysia MYR on-ramp path</li>
<li>Customer-discovery introductions in Malaysia</li>
<li>Feedback on the planning job before adding automation</li>
</ul>
<p style="font-size:15px;color:#8291a3;margin-top:10px;"><strong>Not built:</strong> SEP-24, MoneyGram API/webview, KYC, provider routing/status/reference, PHP cash-out, automatic scheduling.</p>
</div>
</div>

<p class="source">Contract: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR · stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR</p>

---

<!-- _class: lead -->

# Thank you.

Built on Stellar · Live on mainnet · Ready to pilot.

<div class="stats">
<div class="stat"><span class="num">bakti-stellar.vercel.app</span><span class="lbl">Live app</span></div>
<div class="stat"><span class="num">Bakti · GitHub</span><span class="lbl">Source & issues</span></div>
</div>

Stellar APAC Hackathon 2026 · Track A

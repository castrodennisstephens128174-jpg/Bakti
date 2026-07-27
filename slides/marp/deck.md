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
    justify-content: flex-start;
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
    justify-content: center;
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
  .stats.hero { gap: 24px; margin-top: 24px; }
  .stats.hero .stat { padding: 32px 24px; text-align: center; }
  .stats.hero .stat .num.pi { font-size: 48px; }
  .stats.hero .stat .lbl { font-size: 19px; font-weight: 700; color: #33465e; margin-top: 10px; }

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
  .row { display: flex; gap: 32px; align-items: stretch; }
  .row > div { flex: 1; }
  .row img { width: 100%; }
  .row .img-cell { display: flex; align-items: center; justify-content: center; }
  .chart-img { max-width: 560px; max-height: 260px; width: auto; height: auto; align-self: center; object-fit: contain; }

  .card { background: #ffffff; border: 1px solid #e6e2d8; border-radius: 10px; padding: 20px 24px; flex: 1; }
  .card ul { margin: 8px 0 0; padding-left: 20px; }
  .card li { font-size: 17px; margin-bottom: 6px; }
  .card.roomy { padding: 32px 36px; }
  .card.roomy .badge { font-size: 15px; padding: 5px 14px; margin-bottom: 14px; }
  .card.roomy li { font-size: 21px; margin-bottom: 16px; line-height: 1.5; }
  .badge { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; margin-bottom: 6px; }
  .badge.now { background: #dcfce7; color: #166534; }
  .badge.next { background: #fdf1e0; color: #92400e; }
  .card-title { font-size: 19px; font-weight: 800; color: #0b1b2b; margin: 0 0 4px; }

  .flow-row { display: flex; align-items: stretch; gap: 14px; margin-top: 24px; }
  .flow-node { flex: 1; min-width: 0; background: #ffffff; border: 2px solid #0284c7; border-radius: 12px; padding: 28px 20px; text-align: center; }
  .flow-node strong { display: block; font-size: 24px; }
  .flow-node span { display: block; margin-top: 8px; font-size: 16px; line-height: 1.4; color: #51617a; }
  .flow-node.target { border-style: dashed; border-color: #d18b2c; background: #fdf1e0; }
  .flow-arrow { flex: 0 0 auto; align-self: center; font-size: 22px; color: #94a3b8; }

  .table-clean { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .table-clean th { background: #0284c7; color: #ffffff; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 14px; text-align: left; }
  .table-clean th:nth-child(3) { text-align: right; }
  .table-clean td { font-size: 17px; padding: 10px 14px; border-bottom: 1px solid #e6e2d8; color: #33465e; }
  .table-clean td.pct { font-weight: 800; color: #0b1b2b; text-align: right; white-space: nowrap; }
  .table-clean tbody tr:nth-child(even) td { background: #faf9f6; }
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

## What we heard

# A friend's problem, then 200 more

<p style="font-size:19px;margin:0;"><span class="badge next">The complaint</span> A friend back home: sending money is a hassle, parents don't know how to receive it, conversion fees eat into every transfer.</p>

<span class="badge now">The survey, 200 OFW community members</span>
<table class="table-clean">
<thead><tr><th>#</th><th>Question asked</th><th>Yes</th><th>Maps to Bakti</th></tr></thead>
<tbody>
<tr><td>Q1</td><td>Send money home every month?</td><td class="pct">78%</td><td>Baseline demand</td></tr>
<tr><td>Q2</td><td>Want a fixed schedule tied to payday?</td><td class="pct">69%</td><td>Payday plan + reminder</td></tr>
<tr><td>Q3</td><td>Pick up PHP cash with no wallet?</td><td class="pct">78%</td><td>PeraHub cash-out target</td></tr>
<tr><td>Q4</td><td>Want a receipt proving it was sent?</td><td class="pct">81%</td><td>On-chain verified record</td></tr>
</tbody>
</table>

<p class="source">Source: Bakti community survey, 200 respondents, Filipino overseas workers, 2026</p>

---

## In plain terms

# What Bakti does

<div class="stats hero">
<div class="stat"><span class="num pi pi-calendar"></span><span class="lbl">Plan the send around payday</span></div>
<div class="stat"><span class="num pi pi-key"></span><span class="lbl">Sign it once, yourself</span></div>
<div class="stat"><span class="num pi pi-shop"></span><span class="lbl">Family picks up PHP cash, no wallet</span></div>
</div>

<p style="text-align:center;font-size:24px;margin-top:24px;">Money moves on Stellar in between. That's the whole idea.</p>

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
<div class="flow-node target"><strong>Anchor</strong><span>PeraHub, SEP-31 confirmed on the Stellar directory, outreach not started</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node"><strong>Receiver</strong><span>Family member, cash in hand, no wallet needed</span></div>
</div>

Solid border marks what's built today; dashed marks what's still ahead. Once the anchor connects, funds settle through PeraHub's own rails, then reach any of their 3,000+ branches across the Philippines with just a reference number and a photo ID.

---

## Why one anchor, and who it is

# One Philippines anchor serves every sending market

<div class="row">
<div class="img-cell"><img src="assets/ofw-markets.png" style="max-width:440px;width:100%;"></div>
<div class="card">
<span class="badge now">Confirmed anchor: PeraHub</span>
<ul>
<li>Only the receiving side needs a Stellar anchor; a sender anywhere just needs XLM/USDC in their own wallet</li>
<li>PeraHub (PETNET Inc., BSP-regulated, UnionBank/UBX PH, 3,000+ branches) is on Stellar's own directory with SEP-31: USDC in, PHP or USD out, cash payout</li>
<li>SEP-31 needs no recipient wallet, a closer fit than a hosted webview</li>
<li>Bakti emailed MoneyGram Ramps earlier (SEP-24, no reply); PeraHub outreach hasn't started yet</li>
</ul>
</div>
</div>

<p class="source">Sources: DMW/OFW deployment reporting via businessmirror.com.ph · anchors.stellar.org (PeraHub, SEP-31) · perahub.com.ph (BSP regulation) · developer.moneygram.com/integrate-moneygram-ramps</p>

---

## Why Bakti, not the alternatives

# A one-off transfer versus a standing habit with proof attached

<img class="chart-img" src="assets/fee-comparison.png">

Classic apps and bank transfers happen once: no standing plan, no proof beyond a receipt, and the recipient needs a bank account or wallet. Bakti skips that, gives the sender a Stellar transaction to point to, and turns "did I remember" into a habit already set up. This chart is the classic-rail cost stack; Bakti's own total, a 2% fee plus whatever PeraHub charges to cash out, isn't on it, since PeraHub's rate isn't public yet.

<p class="source">Source: World Bank Remittance Prices Worldwide, Q3 2025</p>

---

## Market size

# The same demand, counted in dollars

<img class="chart-img" src="assets/tam-sam-som.png">

<ul>
<li>TAM $9.3B: BSP 2025 remittances, 5 of the 7 markets from the corridor chart (Korea and Malaysia aren't broken out by BSP)</li>
<li>SAM $1.6B: that same volume, cut down to senders who already hold crypto in each market</li>
<li>SOM $16M: a 1% target slice of SAM for year one or two, a goal, not a promise</li>
</ul>

<p class="source">Sources: Bangko Sentral ng Pilipinas cash remittance data, 2025 · Triple-A, State of Global Cryptocurrency Ownership 2024</p>

---

## Model and go-to-market

# Revenue plan and a sequenced launch

<div class="row">
<div class="card roomy">
<span class="badge next">Business model</span>
<ul>
<li>2% sender fee, bundled into the provider's quote</li>
<li>At SOM's $16M, roughly $300K a year</li>
<li>Later: revenue share with the anchor</li>
<li>Still open: fee tolerance, provider terms, unit economics</li>
</ul>
</div>
<div class="card roomy">
<span class="badge now">Go-to-market strategy</span>
<ul>
<li>Start in Singapore, with senders who already hold crypto, SAM's $1.6B</li>
<li>Land the PeraHub anchor connection first</li>
<li>Seed users through OFW community groups</li>
<li>Expand market by market as crypto access grows</li>
</ul>
</div>
</div>

<p class="source">Source: World Bank Remittance Prices Worldwide, Q3 2025</p>

---

## Where we are

# Phase 1 done, Phase 2 underway

<div class="row">
<div class="card roomy">
<span class="badge now">Phase 1, built and tested</span>
<ul>
<li>Mainnet contract live and working well</li>
<li>Direct payment plus on-chain verification</li>
<li>Honest boundary: status stops at Verified on-chain</li>
</ul>
</div>
<div class="card roomy">
<span class="badge next">Phase 2, in progress now</span>
<ul>
<li>Running the product, finding real users</li>
<li>Next: reach out to PeraHub for early integration</li>
<li>Awaiting feedback</li>
</ul>
</div>
</div>

<p class="source">Contract live on Stellar mainnet since 2026-07-12: stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR</p>

---

<!-- _class: lead -->

# No wallet, no app, just cash in hand

A sender signs once a month. Their family just walks in and picks up cash, no wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet; the anchor connection is what gets us there.

<div class="stats">
<div class="stat"><span class="num pi pi-globe"></span><span class="lbl">bakti-stellar.vercel.app, live app</span></div>
<div class="stat"><span class="num pi pi-github"></span><span class="lbl">Bakti · GitHub, source & issues</span></div>
</div>

Stellar APAC Hackathon 2026 · Track A

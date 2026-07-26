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

  .flow-row { display: flex; align-items: stretch; gap: 10px; margin-top: 16px; }
  .flow-node { flex: 1; min-width: 0; background: #ffffff; border: 2px solid #0284c7; border-radius: 10px; padding: 16px 14px; text-align: center; }
  .flow-node strong { display: block; font-size: 19px; }
  .flow-node span { font-size: 14px; color: #51617a; }
  .flow-node.target { border-style: dashed; border-color: #d18b2c; background: #fdf1e0; }
  .flow-arrow { flex: 0 0 auto; align-self: center; font-size: 22px; color: #94a3b8; }
---

<!-- _class: lead -->

# Bakti

Plan salary-day support. Verify the transfer.

Vietnamese workers abroad → family in Vietnam

<div class="stats">
<div class="stat"><span class="num pi pi-check-circle"></span><span class="lbl">Stellar mainnet product</span></div>
<div class="stat"><span class="num pi pi-shield"></span><span class="lbl">Non-custodial signing</span></div>
<div class="stat"><span class="num pi pi-map-marker"></span><span class="lbl">Licensed cash-out: next integration</span></div>
</div>

<p class="source">bakti-stellar.vercel.app · Stellar APAC Hackathon 2026 · Track A</p>

---

## The moment

# "I meant to send it. The week got away from me."

<span class="badge next">Illustrative persona · not a claimed interview</span>

Linh works a factory shift in Japan, one of over 700,000 Vietnamese on labor contracts abroad. Payday comes; some months she remembers to send money home, some months a double shift pushes it to next week.

**She doesn't want to "remember to send." She wants a standing plan she sets up once, then signs each month on a habit — not from memory.**

Her mother, back home, has never used a banking app — a wallet address is not something Linh can ask her to learn. **The real prize isn't the transfer. It's her mother collecting cash without having to touch a screen.**

Today the recipient still needs a Stellar address, and Linh signs every transfer herself — Bakti does not send automatically. Cash pickup for her mother is the target, not built yet.

---

## Corridor evidence

# Contract workers already send billions home

<div class="stats">
<div class="stat"><span class="num">700,000+</span><span class="lbl">Vietnamese on labor contracts abroad</span></div>
<div class="stat"><span class="num">$3.5–4B</span><span class="lbl">Remitted by contract workers per year</span></div>
<div class="stat"><span class="num">$10.34B</span><span class="lbl">Remittances to HCMC alone, 2025 (+8.3% YoY)</span></div>
</div>

Where the workers are (new deployments, 2024): **Japan 62,722 · Taiwan 48,533 · Korea 10,877** — the three markets Vietnam's labor program has run longest.

No public source breaks HCMC's remittance dollars down by sending country — worker-deployment counts and the Asia-origin remittance total are two different figures, not one TAM. Treat Japan/Taiwan/Korea as a corridor signal, not a market-size claim.

<p class="source">Sources: MOLISA via VietnamPlus/SGGP (2024 deployments) · baochinhphu.vn (HCMC 2025 remittances) · kinhtevadubao.vn (contract-worker remittance total)</p>

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
<li>VND cash-out and provider-confirmed collection</li>
</ul>
</div>
</div>

---

## One simple flow

# Sender → Stellar → Anchor → Receiver

<div class="flow-row">
<div class="flow-node"><strong>Sender</strong><span>Vietnamese worker abroad</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node"><strong>Stellar</strong><span>Direct payment or XLM escrow, signed by sender</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node target"><strong>Anchor</strong><span>SEP-24 cash-out — target, not connected</span></div>
<span class="flow-arrow">→</span>
<div class="flow-node"><strong>Receiver</strong><span>Her mother — cash in hand, no wallet needed</span></div>
</div>

Solid border = built today. Dashed = planned, not yet connected. The last box is the whole point: once the anchor connects, the receiving side never touches a wallet, an app, or crypto.

---

## Why Stellar; why these providers

# Verifiable rails now; the anchor is still a target

<div class="row">
<div class="card">
<p class="card-title">Why this customer</p>
<ul>
<li>700,000+ Vietnamese already on formal labor contracts abroad</li>
<li>Government-brokered placement → recurring, predictable monthly income</li>
<li>Japan/Taiwan/Korea are the longest-running, largest programs</li>
<li>The recipient is often an older parent — the target design ends in cash pickup, not a wallet they'd have to learn</li>
</ul>
</div>
<div class="card">
<p class="card-title">Why these provider candidates</p>
<ul>
<li><strong>Lightnet</strong> — listed on Stellar's own Anchor Directory, Vietnam in its 150+ country coverage, SEP-24, cross-border-payments focus. No live <code>stellar.toml</code> found — unverified today.</li>
<li><strong>MoneyGram Ramps</strong> — real, live Stellar anchor. Funds settle to MoneyGram's own Stellar address; the recipient collects cash via phone number/code + ID, no wallet needed on their side. This exact no-wallet pattern already runs in Kenya, Philippines, and Mexico (third-party analysis, chaingain.io — not MoneyGram's own docs) — proven mechanism, Vietnam just isn't on the country list yet.</li>
<li>Neither is a confirmed partner yet — Bakti is currently reaching out to both.</li>
</ul>
</div>
</div>

<p class="source">Sources: anchors.stellar.org (Anchor Directory) · developer.moneygram.com/integrate-moneygram-ramps · chaingain.io (independent analysis of the settlement flow)</p>

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
<li>Interview Vietnamese contract workers in Japan/Taiwan/Korea and family recipients</li>
<li>Test planning/reminder value before automation</li>
<li>Currently reaching out to Lightnet and MoneyGram about a Vietnam VND rail</li>
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
<li>Warm introduction to Lightnet or MoneyGram about a Vietnam VND rail</li>
<li>Customer-discovery introductions among Vietnamese worker communities in Japan/Taiwan/Korea</li>
<li>Feedback on the planning job before adding automation</li>
</ul>
<p style="font-size:15px;color:#8291a3;margin-top:10px;"><strong>Not built:</strong> SEP-24, anchor API/webview, KYC, provider routing/status/reference, VND cash-out, automatic scheduling.</p>
</div>
</div>

<p class="source">Contract: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR · stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR</p>

---

<!-- _class: lead -->

# The target value, in one line.

A sender signs once a month. Her mother walks in and collects the cash — no wallet, no app, no blockchain to learn. That last part isn't built yet; it's what the anchor connection is for.

<div class="stats">
<div class="stat"><span class="num">bakti-stellar.vercel.app</span><span class="lbl">Live app</span></div>
<div class="stat"><span class="num">Bakti · GitHub</span><span class="lbl">Source & issues</span></div>
</div>

Stellar APAC Hackathon 2026 · Track A

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
---

<!-- _class: lead -->

# A monthly allowance your parents collect as cash.

Stellar APAC Hackathon 2026 · Track A

You sign one Stellar payment a month. They walk into a pickup point and take home local money — no wallet, no crypto on their side.

<div class="stats">
<div class="stat"><span class="num">mainnet</span><span class="lbl">Live on Stellar public network</span></div>
<div class="stat"><span class="num">Soroban</span><span class="lbl">On-chain escrow contract</span></div>
<div class="stat"><span class="num">SEP-24</span><span class="lbl">Standardized cash off-ramp</span></div>
</div>

---

## The moment

# "I always meant to send money to Ayah."

Dewi is a caregiver from Indonesia, working in Singapore.

Some months she remembers to send money home. Some months — between double shifts — it slips away.

When she forgets, her father stretches his medicine.

He doesn't use crypto. He uses the corner pickup shop.

**Dewi doesn't want a transfer. She wants a standing allowance she can trust to land every month.**

<p class="source">Bakti</p>

---

## The problem

# Remittances reach wallets. They don't reach habits.

<div class="row">
<div>

![w:380](assets/gap.png)

</div>
<div>

- SEA diaspora sends **>$100B** home each year — much of it children supporting elderly parents
- Ad-hoc: depends on the sender remembering in a busy month
- Apps charge opaque fees; no clean audit of what landed
- A missed month = skipped medicine or groceries

</div>
</div>

<p class="source">Source: World Bank Migration &amp; Remittances data (KNOMAD, 2024)</p>

---

## Market

# Philippines remittances — $38.6B (2024)

![w:420](assets/ph-growth.png) ![w:420](assets/top-sources.png)

<p class="source">Source: Bangko Sentral ng Pilipinas (2024); +3% YoY</p>

---

## Why it costs so much

# 6.5% global avg — a $25 allowance loses $1.63 to fees

![w:400](assets/cost-regions.png) ![w:400](assets/rails.png)

<p class="source">Sources: World Bank RPW (Q4 2024) · stellar.org/developers</p>

---

## Solution

# Standing allowance. Local cash. Fixed day.

| 1 · Add a parent | 2 · Sign the month | 3 · Anchor off-ramps | 4 · They collect |
|---|---|---|---|
| Name, Stellar address, corridor, amount, payout day | One XLM or USDC payment, signed in your own wallet | Cash-pickup reference issued (SEP-24, simulated anchor today) | Local cash in hand — no wallet, no crypto on their side |

**Non-custodial the whole way — Bakti never holds your keys or your funds.**

`Dewi` → `Soroban BaktiEscrow (releases monthly)` → `SEP-24 Anchor` → `Cash pickup`

---

## Why Stellar

# The only chain where the last mile ends in cash.

<div class="stats">
<div class="stat"><span class="num">Soroban</span><span class="lbl">Permissionless escrow · on-chain</span></div>
<div class="stat"><span class="num">USDC</span><span class="lbl">Circle-issued · native on Stellar</span></div>
<div class="stat"><span class="num">SEP-24</span><span class="lbl">Standard cash off-ramp</span></div>
<div class="stat"><span class="num">SEP-23</span><span class="lbl">Muxed attribution per family</span></div>
</div>

![w:360](assets/stellar-vs.png)

<span class="pill">SEP-23</span> muxed attribution &nbsp; <span class="pill">SEP-24</span> standardized off-ramp &nbsp; <span class="pill">SEP-7</span> QR pay links

<p class="source">Source: stellar.org/developers · stellar.org/case-studies/moneygram</p>

---

## Live proof

# Not a mockup. Contract and app live on mainnet.

<div class="stats">
<div class="stat"><span class="num">bakti-stellar.vercel.app</span><span class="lbl">Live app · mainnet</span></div>
<div class="stat"><span class="num">CBVAZDK…CTHR</span><span class="lbl">Soroban contract · mainnet</span></div>
<div class="stat"><span class="num">cfa17a93…419d2</span><span class="lbl">End-to-end payout · testnet</span></div>
</div>

- → bakti-stellar.vercel.app
- → stellar.expert → end-to-end payout (testnet)
- → stellar.expert → contract (mainnet)

<p class="source">Source: Stellar public network (contract, app) · Stellar testnet (payout proof)</p>

---

## Current vs target

# Phase 1 shipped. Phase 2 is one anchor away.

<div class="row">
<div>

**Phase 1 — shipped**
- Soroban BaktiEscrow on mainnet
- Non-custodial signing
- Signed-challenge auth (not SEP-10) · SEP-23 / SEP-7 wired
- SEP-24 `cash_pickup`, simulated anchor
- Payout proven end-to-end on testnet

</div>
<div>

**Phase 2 / 3 — target**
- Anchor: **MoneyGram Access** or **Coins.ph**
- Config swap, not a rewrite
- Real 30-day cadence
- Multi-corridor, licensed rails

</div>
</div>

<p class="source">What's real today: contract, app, every signed payment — all on Stellar mainnet.</p>

---

## The ask

# Pilot an anchor. Open one corridor.

<div class="stats">
<div class="stat"><span class="num pi pi-arrow-right-arrow-left"></span><span class="lbl">Pilot SEP-24 anchor (cash_pickup)</span></div>
<div class="stat"><span class="num pi pi-users"></span><span class="lbl">Intro to PH diaspora org in the Gulf</span></div>
<div class="stat"><span class="num pi pi-shield"></span><span class="lbl">Funding for legal review</span></div>
</div>

Contact: Bakti · GitHub issues

---

<!-- _class: lead -->

# A standing allowance for parents back home.

Built on Stellar · Live on mainnet · Ready to pilot.

<div class="stats">
<div class="stat"><span class="num">bakti-stellar.vercel.app</span><span class="lbl">Live app</span></div>
<div class="stat"><span class="num">Bakti · GitHub</span><span class="lbl">Source & issues</span></div>
</div>

Stellar APAC Hackathon 2026 · Track A

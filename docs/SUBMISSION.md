# Bakti — Stellar Submission Summary

## Problem

OFW remittances into the Philippines topped **$38 billion in 2024** (World Bank /
KNOMAD). The average cost of sending $200 globally is still **~6.4%** (WB
Remittance Prices Q4 2024). Workers send ad-hoc transfers; parents cannot plan
around income that arrives unpredictably. Missed months mean parents skip medicine
or bills. Traditional standing orders require a bank account on both sides — most
OFWs and their parents do not have one.

## Market

- **Philippines 2024 inflow: ~$38B USD.** Forecast ~$38.3B in 2025. Trajectory
  ~$40B by 2026. (Source: World Bank / KNOMAD, Migration and Development Brief
  39, December 2024.)
- **Malaysia → PH/ID/BD/NP/IN outflows: ~$10–12B/year.** Malaysia is primarily a
  source country; MY→PH is the densest single intra-Asia remittance lane. Average
  cost MY→PH is **3–5%**, lower than global average.
- Top source countries into PH: Saudi Arabia, UAE, USA, Singapore, Hong Kong, Qatar,
  Kuwait, Japan, UK, Canada, Taiwan.

## Solution

**Bakti = a standing order, one Stellar payment per month, parent collects local
cash with a reference code.**

- Sender connects a Stellar wallet (Freighter), names the recipient, sets amount
  and payout day, picks a corridor.
- For XLM: signs one `create_schedule` Soroban transaction that escrows the full
  run (monthly × months) into the BaktiEscrow contract; each month a permissionless
  `release` call pays out one period.
- For USDC: classic Horizon-verified payment per period.
- Anchor off-ramps to a cash-pickup reference. Parent walks to a pickup point
  and collects local money — no wallet, no crypto on their side.

## Business Model

Take rate on the on-ramp leg once a fiat on-ramp partner (e.g. a PH exchange or
e-money wallet) signs. Anchor referral fee for driving users to SEP-24 partners.
Target all-in cost to sender ≤2% once live, compared to 6.4% global average.

## Go-to-Market

1. **Philippines first.** Coins.ph ecosystem + OFW community channels (Facebook
   groups, diaspora orgs, remittance clinics in GCC host countries).
2. **Malaysia → PH second.** Existing high-volume intra-Asia corridor; MY→PH
   remittance costs already competitive, differentiate on predictability and UX.
3. **Indonesia, Vietnam, Thailand** — expansion once anchor coverage confirmed per
   corridor.

## Why Stellar

- 3–5 second settlement finality; fee ~0.00001 XLM.
- USDC natively issued by Circle on Stellar — no bridged assets.
- Soroban BaktiEscrow contract: permissionless keeper release, non-custodial,
  auditable.
- SEP-23 muxed accounts: one anchor collection account, per-family attribution,
  no memos required from senders.
- SEP-24 off-ramp standard: anchor-agnostic integration path.
- Open ecosystem: any Stellar wallet works; no proprietary signing key.

## Why Now

- Stellar has native USDC (Circle-issued) and a growing SEP-24 anchor ecosystem.
- SEP-7 / SEP-10 / SEP-23 / SEP-24 standards are stable and wallet-native.
- PH remittance market is large enough to matter and underserved on-chain.
- The corridor from Gulf countries (where most OFWs send from) to PH is dominated
  by WU / Remitly / Western Union pricing — on-chain disruption window is open.

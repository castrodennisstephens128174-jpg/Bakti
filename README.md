# Bakti

Bakti is a Stellar testnet prototype for **Filipino workers in Malaysia planning salary-day support for family in the Philippines**. It keeps a recipient, amount, and reminder date in one plan, then lets the sender sign a direct Stellar payment or release pre-funded XLM from a Soroban escrow.

**Current boundary:** the recipient needs a Stellar address. Bakti does not yet connect to a licensed cash-out provider, perform KYC, or deliver Philippine pesos.

## Problem and target user

The target user is a Filipino worker in Malaysia who wants family support to be deliberate and easy to verify rather than an ad-hoc transfer remembered late in the month. The family member may ultimately prefer cash, but the present prototype stops at the recipient's Stellar wallet.

The product hypothesis is that salary-day planning, a persistent family-support record, and verifiable payment evidence can reduce uncertainty for the sender. This has not yet been validated through a claimed interview sample or production pilot.

## Why research the Malaysia → Philippines corridor

Bangko Sentral ng Pilipinas (BSP) reports:

- **2025 preliminary personal remittances:** US$39.619B; **cash remittances:** US$35.634B; both +3.3%.
- **Jan–May 2026 preliminary:** personal remittances US$15.735B; cash remittances US$14.110B.
- **Malaysia-attributed Philippine cash remittances:** US$661.182M in 2024, US$675.153M in 2025 provisional, and US$279.807M in Jan–May 2026 provisional.

The Malaysia figure is a **corridor signal, not Bakti's TAM**. BSP attributes cash remittances to the immediate source of funds, which may differ from the worker's true location or origin of the remittance. Further customer, channel, compliance, and provider research is required.

Sources: [BSP OFW remittances](https://www.bsp.gov.ph/statistics/external/ofw.aspx) and [BSP cash remittances by source](https://www.bsp.gov.ph/statistics/external/ofw2.aspx).

## Solution

### Today

`Sender → Bakti support plan → Stellar transfer/escrow release → recipient Stellar wallet`

1. Connect Freighter.
2. Sign Bakti's custom `manageData` challenge to create an app session.
3. Save a family member, recipient Stellar address, amount, asset, and reminder day.
4. For XLM, pre-fund a fixed number of periods in the Bakti Soroban escrow and sign a release when desired.
5. For USDC, sign a direct classic Stellar payment when desired.
6. Record the transaction as **Verified on-chain** after Horizon or Soroban RPC confirmation.

The reminder day is planning metadata only. No scheduler automatically sends or releases funds. The contract's `LEDGERS_PER_PERIOD = 60` is a short demo cadence, not a calendar month.

### Target product

`Sender → Stellar → licensed anchor/provider → KYC and provider workflow → PHP cash-out → family member`

The target last mile is a certified SEP-24 integration with MoneyGram Ramps or another licensed anchor. It is not currently connected.

## Current product vs target product

| Capability | Current prototype | Target product |
|---|---|---|
| Wallet | Freighter connection and signing | Production wallet support and recovery UX |
| App session | Custom signed `manageData` challenge | Standards review; provider-specific SEP-10 where required |
| Planning | Recipient, amount, asset, reminder day, pause/end state | Validated salary-day support workflow and notifications |
| XLM | Soroban escrow and signed release | Production-reviewed contract parameters and operations |
| USDC | Direct payment to entered recipient address | Provider-approved deposit routing where applicable |
| Verification | Horizon verification and Soroban RPC confirmation | On-chain plus provider transaction/status reconciliation |
| Payment link | SEP-7 direct pay URI to recipient | Provider-aware payment/deposit instructions if certified |
| Live watcher | Horizon recipient-payment watcher | Provider webhook/polling plus user notifications |
| Provider/KYC | Not implemented | Hosted SEP-24 flow, authentication, KYC, quote/status |
| Cash-out | Not implemented | Licensed PHP cash-out and provider reference |
| Collection | Not implemented | Provider-confirmed collection status |
| Scheduling | No automatic scheduler | Only after legal, operational, and user validation |

## Implemented

- Freighter wallet access and transaction signing.
- Custom signed `manageData` session challenge. **This is not SEP-10.**
- Postgres allowance/support-plan records with active, paused, and ended states.
- XLM Soroban escrow via `create_schedule` and signed `release`.
- Direct XLM or testnet USDC payments to a recipient Stellar address.
- Horizon verification of direct payment sender, recipient, asset, and amount.
- Soroban RPC simulation, submission, and confirmation.
- SEP-7 direct payment URI.
- Best-effort Horizon SSE watcher for payments to the recipient account.
- Transaction hashes linked to the configured network explorer.

## Not implemented

- SEP-24.
- Anchor SEP-10 authentication.
- MoneyGram API or hosted webview.
- MoneyGram partnership, certification, or commercial agreement.
- KYC/KYB/compliance workflows.
- Provider quote, fees, limits, status, webhooks, or deposit routing.
- A provider-approved anchor or muxed payment destination.
- Pickup reference or fiat cash pickup.
- Provider-confirmed settlement or collection.
- Automatic monthly scheduling.
- Production mainnet release proof.

The code retains `settled` and `collected` status types for a future provider adapter, but current payment endpoints stop at `sent` / **Verified on-chain**. Manual collection confirmation is rejected.

## MoneyGram integration requirements

MoneyGram Ramps supports USDC on/off-ramp flows through Stellar, but integration requires more than sending an asset to an address. Its published path includes:

- Commercial onboarding, KYB/compliance review, agreements, and domain allowlisting.
- SEP-1 metadata.
- SEP-10 authentication for the anchor flow.
- Hosted SEP-24 deposit/withdrawal interaction.
- Required KYC fields.
- Testing and certification.
- Provider transaction status and operational handling.

MoneyGram publishes off-ramp limits of **5–2,500 USDC**. Its linked availability sheet lists Malaysia and the Philippines as **cash-out only**; this does not establish Malaysian salary cash-in or an implemented Malaysia → Philippines route for Bakti.

Source: [Integrate MoneyGram Ramps](https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps).

Stellar anchors connect on-chain assets with off-chain rails. SEP-24 is an anchor-hosted interactive deposit/withdrawal flow and requires the anchor's authentication and KYC process. Sources: [Stellar anchors](https://developers.stellar.org/docs/learn/fundamentals/anchors) and [SEP-24 getting started](https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started).

## Architecture

```text
Next.js client
  ├─ Freighter wallet access
  ├─ custom signed session challenge
  ├─ direct XLM/USDC transaction signing
  └─ Soroban escrow/release signing

Next.js server
  ├─ session and plan APIs
  ├─ Horizon payment verification
  ├─ Soroban RPC assembly/submission
  └─ Postgres persistence via Drizzle

Stellar testnet
  ├─ classic payments to recipient address
  └─ Bakti XLM escrow contract

Future provider adapter (not implemented)
  └─ SEP-1 + SEP-10 + SEP-24 + KYC + quote/status + PHP cash-out
```

Key files:

- `src/server/service/payout.service.ts` — payment verification and honest status boundary.
- `src/server/service/allowance.service.ts` — plan lifecycle and escrow creation.
- `src/server/service/auth.service.ts` — custom `manageData` challenge/session.
- `src/server/stellar/contract.ts` — Soroban transaction assembly and submission.
- `src/server/stellar/horizon.ts` — classic payment verification.
- `app/allowances/[id]/page.tsx` — direct pay tools, watcher, and planned last-mile panel.
- `contracts/bakti-escrow/src/lib.rs` — XLM escrow contract.

## Business-model hypotheses — unvalidated

- A sender-paid planning/service fee bundled transparently with a licensed provider quote.
- Provider referral or revenue share where permitted by contracts and regulation.
- Employer or worker-community distribution paid by an institution rather than the recipient.

No price, take rate, unit economics, or provider margin has been validated.

## GTM experiments

1. Interview Filipino workers in Malaysia around salary-day support behavior, recipient preferences, trust, and wallet constraints.
2. Test a no-money planning/reminder prototype before claiming a scheduling product.
3. Map regulated Malaysia funding options and Philippine payout providers with counsel and provider teams.
4. Seek a provider sandbox/certification conversation; do not market MoneyGram as a partner.
5. Run a small testnet usability study measuring plan creation, successful signing, and transaction comprehension.

## Limitations and security

- Prototype defaults to Stellar testnet; assets have no production value.
- The app is not a bank, money transmitter, anchor, KYC provider, or cash-pickup service.
- The sender controls the wallet and signs every on-chain action; Bakti must never receive secret keys.
- XLM escrow pre-funds the contract. `release` is permissionless, but always pays the recorded recipient.
- `LEDGERS_PER_PERIOD = 60` is intentionally short for demonstrations.
- `dayOfMonth` does not control the contract and does not trigger a job.
- USDC uses the official Stellar testnet issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.
- A mainnet-looking contract ID previously shown in project materials is unverified and is not release proof.
- Existing database rows may contain legacy local `settled`/`collected` demo states; the UI labels them honestly and new endpoints do not create them.

## Verified testnet proof

- **Contract:** `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
- **Contract explorer:** [Stellar Expert testnet](https://stellar.expert/explorer/testnet/contract/CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ)
- **Freighter-signed release transaction:** `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`
- **Transaction explorer:** [Stellar Expert testnet](https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2)

This proves a testnet contract release, not mainnet operation, provider settlement, or cash collection. See `contracts/DEPLOYMENT.md` for the deployment record.

## Setup

Requirements: Node.js, pnpm, PostgreSQL, Freighter, and a funded testnet wallet.

```bash
pnpm install
cp .env.example .env.local
# Set DRIZZLE_DATABASE_URL and a unique 32+ character SESSION_SECRET.
pnpm db:push
pnpm dev
```

Optional demo data:

```bash
pnpm seed
```

A real seeded testnet payment is attempted only if `DEMO_SENDER_SECRET` is explicitly supplied. Never commit secrets.

## Test and build

```bash
pnpm lint
pnpm test
pnpm build
python3 slides/build_deck.py
```

Contract tests:

```bash
cd contracts
make test
```

## Sources

- BSP, Overseas Filipino Workers' Remittances: https://www.bsp.gov.ph/statistics/external/ofw.aspx
- BSP, Cash Remittances by Country Source: https://www.bsp.gov.ph/statistics/external/ofw2.aspx
- Stellar, Anchors: https://developers.stellar.org/docs/learn/fundamentals/anchors
- Stellar Anchor Platform, SEP-24: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- MoneyGram, Integrate MoneyGram Ramps: https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps

# Bakti

Bakti is a Stellar mainnet product for **Filipino workers abroad planning salary-day support for family in the Philippines**. It keeps a recipient, amount, and reminder date in one plan, then lets the sender sign a direct Stellar payment or release pre-funded XLM from a Soroban escrow.

**Current boundary:** the recipient needs a Stellar address. Bakti does not yet connect to a licensed cash-out provider, perform KYC, or deliver Philippine pesos.

**Pitch deck:** [`slides/marp/deck.pdf`](slides/marp/deck.pdf) · [visual HTML deck](slides/index.html)

## Problem and target user

The target user is a Filipino worker abroad on a formal contract who wants family support to be deliberate and easy to verify rather than an ad-hoc transfer remembered late in the month. The family member may ultimately prefer cash, but the present prototype stops at the recipient's Stellar wallet.

The product hypothesis is that salary-day planning, a persistent family-support record, and verifiable payment evidence can reduce uncertainty for the sender. This has not yet been validated through a claimed interview sample or production pilot.

## Why the Philippines is the anchor side, not the sending side

Only the *receiving* side of this product needs a licensed Stellar anchor. A sender can be anywhere and fund their own wallet with XLM/USDC from any exchange; only the Philippines needs a certified cash-out partner. That means the addressable sending market is every country with Filipino workers abroad, not one fixed corridor.

Department of Migrant Workers (DMW) deployment reporting and Bangko Sentral ng Pilipinas (BSP) cash-remittance data show:

- **UAE**, the #1 destination for Filipino workers in 2025, at 397,892 deployments.
- **Saudi Arabia**, #2, at 386,699 deployments.
- **Singapore** alone accounted for 7.3% of all 2025 Philippine cash remittances, the #2 source country after the US (39.7%).
- The same Philippines anchor also reaches Hong Kong (202,415 workers), Japan (60,748), South Korea (38,390), and Malaysia (35,052).

These are corridor signals, not a TAM calculation, and the numbers describe worker counts and remittance share from two different measurements. Further customer, channel, compliance, and provider research is required.

Sources: [DMW/OFW deployment reporting via businessmirror.com.ph](https://businessmirror.com.ph/2026/02/04/ofw-deployments-hit-record-2-7-million-in-2025-as-kuwait-and-europe-open-doors/) and Bangko Sentral ng Pilipinas cash remittance data.

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

`Sender → Stellar → MoneyGram Ramps → MoneyGram's Philippines agent network → family member`

The target last mile is a certified SEP-24 integration with MoneyGram Ramps. It is not currently connected.

**MoneyGram Ramps is a real, live Stellar anchor, confirmed in the Philippines since October 2021**, one of the original four countries (with Canada, Kenya, and the US) when MoneyGram and the Stellar Development Foundation launched this service. Funds settle to MoneyGram's own Stellar account; the recipient collects cash with a reference number and photo ID, no Stellar wallet needed on the receiving side. Classic (non-crypto) MoneyGram already runs that same agent-based cash pickup in the Philippines today.

Bakti has emailed MoneyGram Ramps about integrating. It is not yet a confirmed partner, and there has been no response yet.

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
- Direct XLM or USDC payments to a recipient Stellar address.
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

## Anchor integration requirements

Any licensed anchor integration requires more than sending an asset to an address. The published SEP path includes:

- Commercial onboarding, KYB/compliance review, agreements, and domain allowlisting.
- SEP-1 metadata.
- SEP-10 authentication for the anchor flow.
- Hosted SEP-24 deposit/withdrawal interaction.
- Required KYC fields.
- Testing and certification.
- Provider transaction status and operational handling.

MoneyGram Ramps' supported-countries sheet lists the Philippines as cash-out enabled, matching what Bakti's target flow needs (the recipient side). Its integration docs publish **5–950 USDC on-ramp** and **5–2,500 USDC off-ramp** limits, but the live production `/info` endpoint currently reports a 1 USDC floor on both sides instead of 5, and a separate Production Preview/certification tier caps test transactions at **10–20 USDC (100 USDC aggregate)**. Treat these as three different figures from three different sources, not one clean number.

Sources: [Integrate MoneyGram Ramps](https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps), the live [`/info` endpoint](https://stellar.moneygram.com/stellaradapterservice/sep24/info), and MoneyGram's [supported-countries sheet](https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM).

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

Stellar mainnet
  ├─ classic payments to recipient address
  └─ Bakti XLM escrow contract

Future provider adapter (not implemented)
  └─ SEP-1 + SEP-10 + SEP-24 + KYC + quote/status + PHP cash-out
```

Key files:

- `src/server/service/payout.service.ts`: payment verification and honest status boundary.
- `src/server/service/allowance.service.ts`: plan lifecycle and escrow creation.
- `src/server/service/auth.service.ts`: custom `manageData` challenge/session.
- `src/server/stellar/contract.ts`: Soroban transaction assembly and submission.
- `src/server/stellar/horizon.ts`: classic payment verification.
- `app/allowances/[id]/page.tsx`: direct pay tools, watcher, and planned last-mile panel.
- `contracts/bakti-escrow/src/lib.rs`: XLM escrow contract.

## Business-model hypotheses, unvalidated

- A sender-paid planning/service fee bundled transparently with a licensed provider quote. The world average cost to remit is 6.36% (World Bank, Remittance Prices Worldwide, Q3 2025); Bakti's target is to sit meaningfully under that.
- Provider referral or revenue share where permitted by contracts and regulation.
- Employer or worker-community distribution paid by an institution rather than the recipient.

No price, take rate, unit economics, or provider margin has been validated.

For context, the same World Bank dataset puts the bank-average cost to remit at 14.99% and the cheapest available option today at 3.29%; Bakti's target sits under the 6.36% global average, though the anchor's own cash-out quote is not yet known.

## GTM experiments

1. Interview Filipino workers abroad (any market) around salary-day support behavior, recipient preferences, trust, and wallet constraints.
2. Test a no-money planning/reminder prototype before claiming a scheduling product.
3. Follow up on the MoneyGram Ramps outreach email, and map any other regulated on/off-ramp provider covering the Philippines.
4. Seek a provider sandbox/certification conversation; do not market MoneyGram as a partner.
5. Run a small testnet usability study measuring plan creation, successful signing, and transaction comprehension.

## Limitations and security

- Product defaults to Stellar mainnet; XLM and USDC sent through it are real assets with real value. Set both `STELLAR_NETWORK=testnet` and `NEXT_PUBLIC_STELLAR_NETWORK=testnet` in your own `.env.local` for free local development. The server and client resolve network independently, so both must be set together.
- The app is not a bank, money transmitter, anchor, KYC provider, or cash-pickup service.
- The sender controls the wallet and signs every on-chain action; Bakti must never receive secret keys.
- XLM escrow pre-funds the contract. `release` is permissionless, but always pays the recorded recipient.
- `LEDGERS_PER_PERIOD = 60` is intentionally short for demonstrations, not a calendar month.
- `dayOfMonth` does not control the contract and does not trigger a job.
- USDC uses the official Circle issuer on Stellar mainnet `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`.
- Existing database rows may contain legacy local `settled`/`collected` demo states; the UI labels them honestly and new endpoints do not create them.

## Verified mainnet deployment

- **Contract:** `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- **Contract explorer:** [Stellar Expert public](https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR), confirmed live on Stellar mainnet (created 2026-07-12, 7 recorded invocations as of this check).
- **Open item:** the contract's on-chain creator key does not match the admin key documented in `contracts/DEPLOYMENT.md`. A fresh, team-signed `create_schedule` + `release` call, producing a mainnet transaction hash citable as release proof, is pending; do not cite a specific transaction hash as mainnet proof until one is produced and confirmed at `horizon.stellar.org/transactions/<hash>`.

The previously-cited testnet proof (`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) remains in `contracts/DEPLOYMENT.md` for the testnet development record, but is not mainnet operation, provider settlement, or cash collection proof.

## Setup

Requirements: Node.js, pnpm, PostgreSQL, Freighter, and a funded Stellar wallet (real mainnet XLM by default; see `.env.example` for switching to testnet locally).

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

A real seeded payment on the configured network is attempted only if `DEMO_SENDER_SECRET` is explicitly supplied. Never commit secrets.

## Test and build

```bash
pnpm lint
pnpm test
pnpm build
```

Contract tests:

```bash
cd contracts
make test
```

## Sources

- DMW/OFW deployment reporting (2025), via businessmirror.com.ph: https://businessmirror.com.ph/2026/02/04/ofw-deployments-hit-record-2-7-million-in-2025-as-kuwait-and-europe-open-doors/
- Stellar, MoneyGram International case study (2021 launch): https://stellar.org/case-studies/moneygram-international
- Stellar, Anchors: https://developers.stellar.org/docs/learn/fundamentals/anchors
- Stellar Anchor Platform, SEP-24: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- MoneyGram, Integrate MoneyGram Ramps: https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- MoneyGram Ramps, live `/info` endpoint: https://stellar.moneygram.com/stellaradapterservice/sep24/info
- MoneyGram Ramps, supported-countries sheet: https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM
- Stellar Expert, Bakti mainnet contract: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

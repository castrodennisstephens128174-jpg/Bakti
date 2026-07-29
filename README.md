# Bakti

Bakti is a Stellar mainnet product for **Filipino workers abroad planning salary-day support for family in the Philippines**. It keeps a recipient, amount, and reminder date in one plan, then lets the sender sign a direct Stellar payment or release pre-funded XLM from a Soroban escrow.

**Current boundary:** the recipient needs a Stellar address. Bakti does not yet connect to a licensed cash-out provider, perform KYC, or deliver Philippine pesos.

**Network:** Stellar mainnet by default — the escrow contract is confirmed live on-chain (see [Verified mainnet deployment](#verified-mainnet-deployment)). Testnet is opt-in for free local development only.

**Pitch deck:** [`slides/marp/deck.pdf`](slides/marp/deck.pdf) · [`slides/marp/deck.pptx`](slides/marp/deck.pptx) · [visual HTML deck](slides/index.html)

**Live apps:** [bakti-stellar.vercel.app](https://bakti-stellar.vercel.app) (mainnet) · [bakti-testnet.vercel.app](https://bakti-testnet.vercel.app) (testnet, self-hosted SEP-31 anchor stub — see [Testnet anchor integration](#testnet-anchor-integration-dev))

## Problem and target user

The target user is a Filipino worker abroad on a formal contract who wants family support to be deliberate and easy to verify rather than an ad-hoc transfer remembered late in the month. The family member may ultimately prefer cash, but the present prototype stops at the recipient's Stellar wallet.

The product hypothesis is that salary-day planning, a persistent family-support record, and verifiable payment evidence can reduce uncertainty for the sender.

## Customer research

A survey of 200 members of the Filipino overseas-worker community found:

- **78%** send money home every month.
- **69%** want an automatic, payday-tied sending schedule.
- **78%** would use wallet-free cash pickup for the recipient.
- **81%** want clear proof that the money was sent.

Source: Bakti community survey, 200 respondents, Filipino overseas workers, 2026.

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

`Sender → Stellar → PeraHub → PeraHub's Philippines branch network → family member`

The target last mile is a SEP-31 integration with PeraHub. It is not currently connected.

**PeraHub, the retail brand of PETNET Inc., is listed on Stellar's own anchor directory (anchors.stellar.org) with SEP-31 support**: USDC in, PHP or USD out, cash payout, Philippines only. PETNET Inc. is regulated by the Bangko Sentral ng Pilipinas and sits in the UnionBank/UBX PH group, with 3,000+ branches nationwide. SEP-31 is an anchor-to-anchor cross-border payment API, so the recipient needs no Stellar wallet at all, a closer fit than a hosted SEP-24 webview.

Bakti had earlier emailed MoneyGram Ramps (a different confirmed Stellar anchor, live in the Philippines since October 2021, SEP-24) about integrating; there was no response. PeraHub is the better-matched pick given its PHP-native listing and BSP-regulated parent, and Bakti is now reaching out to PeraHub/Petnet directly for SEP-31 integration support.

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
| Provider/KYC | SEP-10/12/31 client, tested against a local Anchor Platform stand-in and a self-hosted anchor stub — not yet wired into the live payout flow | SEP-1/10/12/31 against PeraHub itself, once they respond |
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
- SEP-1/10/12/31 client (`src/server/stellar/anchor/`), verified end-to-end on Stellar testnet against a local Anchor Platform stand-in and against this app's own self-hosted anchor stub (`src/server/service/anchor-server.service.ts`) — real challenge-signed SEP-10 auth, real SEP-12 customer registration, a real SEP-31 transaction with a live `pending_sender` status and Stellar payment account/memo. See `anchor-platform/README.md` and `tests/integration/anchor-selfhost.test.ts`. Not wired into the live payout flow, and not connected to PeraHub (they have no testnet endpoint yet).

## Not implemented

- SEP-24.
- PeraHub or MoneyGram Ramps API integration (no production anchor connection).
- Any anchor partnership, certification, or commercial agreement.
- Production KYC/KYB/compliance workflows (the testnet SEP-12 call above is protocol plumbing, not a real compliance check).
- Provider quote, fees, limits, status, webhooks, or deposit routing.
- A provider-approved anchor or muxed payment destination.
- Pickup reference or fiat cash pickup.
- Provider-confirmed settlement or collection.
- Automatic monthly scheduling.
- Production mainnet release proof.

The code retains `settled` and `collected` status types for a future provider adapter, but current payment endpoints stop at `sent` / **Verified on-chain**. Manual collection confirmation is rejected.

## Anchor integration requirements

Any licensed anchor integration requires more than sending an asset to an address. For a SEP-31 (cross-border payments API) path, that includes:

- Commercial onboarding, KYB/compliance review, and agreements between Bakti and the anchor.
- SEP-1 metadata and SEP-10 authentication between the sending and receiving anchors.
- The SEP-31 send/receive transaction flow itself, including required KYC fields on the receiving side.
- Testing and certification.
- Provider transaction status and operational handling.

PeraHub is confirmed on Stellar's own anchor directory (anchors.stellar.org) with SEP-31 support, USDC in, PHP or USD out, cash payout, Philippines only. Its published integration requirements (fee schedule, per-transaction limits, KYC fields) aren't public on perahub.com.ph or Petnet's own site; those would need direct outreach to confirm — outreach to PeraHub/Petnet is now underway. MoneyGram Ramps, by contrast, is confirmed with SEP-24 and has full public developer docs, but no PHP-specific listing on the directory and no reply to Bakti's earlier email.

Sources: [Stellar Anchor Directory](https://anchors.stellar.org), [PeraHub / PETNET Inc.](https://perahub.com.ph), [Integrate MoneyGram Ramps](https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps).

Stellar anchors connect on-chain assets with off-chain rails. SEP-31 is an anchor-to-anchor API for cross-border payments (no recipient wallet required); SEP-24 is an anchor-hosted interactive deposit/withdrawal webview. Sources: [Stellar anchors](https://developers.stellar.org/docs/learn/fundamentals/anchors) and [SEP-24 getting started](https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started).

### Testnet anchor integration (dev)

`src/server/stellar/anchor/` is a SEP-1/10/12/31 client, tested against a
local Stellar Anchor Platform instance since PeraHub has no testnet endpoint
yet (the public `testanchor.stellar.org` reference anchor was also tried —
its `/sep31/info` currently returns an empty `receive` map, so `POST
/transactions` rejects every asset with `"has no fields definition"`; that's
a gap on Stellar's own public instance, not this client). Swapping
`ANCHOR_HOME_DOMAIN` to PeraHub's domain once they respond needs no code
changes.

```bash
cd anchor-platform && docker compose up -d
cd .. && ANCHOR_HOME_DOMAIN=localhost:8180 pnpm test:anchor
```

See `anchor-platform/README.md` for what's running, the generated testnet
keypairs, and a note on the anchor's async `pending_receiver` → `pending_sender`
transition.

Since neither of those needs to be reachable from a Vercel deploy,
`src/server/service/anchor-server.service.ts` is a small **self-hosted**
SEP-1/10/12/31 anchor stub served by this same app (`/.well-known/stellar.toml`
+ `/api/anchor/*`) — Bakti acting as its own receiving anchor for demo
purposes, so the testnet Vercel deploy can run the full round trip live with
no external host. `tests/integration/anchor-selfhost.test.ts` proves the
client and this stub complete SEP-1 → SEP-10 → SEP-12 → SEP-31 against each
other; see `.env.example` for `ANCHOR_STUB_SERVER_SIGNING_SEED`.

This is deployed and verified live at
[bakti-testnet.vercel.app](https://bakti-testnet.vercel.app) — its own
`ANCHOR_STUB_SERVER_SIGNING_SEED`, `SESSION_SECRET`, and `DRIZZLE_DATABASE_URL`
are separate from the mainnet deploy's.

```bash
# against a local pnpm dev:
SELFHOST_ANCHOR_HOME_DOMAIN=localhost:3005 pnpm test:anchor tests/integration/anchor-selfhost.test.ts

# against the live testnet deploy:
SELFHOST_ANCHOR_HOME_DOMAIN=bakti-testnet.vercel.app pnpm test:anchor tests/integration/anchor-selfhost.test.ts
```

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

SEP-1/10/12/31 anchor client (testnet dev, not wired into the payout flow)
  ├─ local Anchor Platform stand-in, or
  └─ this app's own self-hosted anchor stub (below)

Self-hosted anchor stub (testnet dev): app/.well-known/stellar.toml, app/api/anchor/*
  └─ Bakti acting as its own receiving anchor for a live Vercel demo

Future provider adapter (not implemented)
  └─ SEP-1 + SEP-10 + SEP-31 + KYC + status + PHP cash-out, against PeraHub
```

Key files:

- `src/server/service/payout.service.ts`: payment verification and honest status boundary.
- `src/server/service/allowance.service.ts`: plan lifecycle and escrow creation.
- `src/server/service/auth.service.ts`: custom `manageData` challenge/session.
- `src/server/stellar/contract.ts`: Soroban transaction assembly and submission.
- `src/server/stellar/horizon.ts`: classic payment verification.
- `src/server/stellar/anchor/index.ts`: SEP-1/10/12/31 client (`sendViaAnchor`).
- `src/server/service/anchor-server.service.ts`: self-hosted SEP-1/10/12/31 anchor stub.
- `app/allowances/[id]/page.tsx`: direct pay tools, watcher, and planned last-mile panel.
- `contracts/bakti-escrow/src/lib.rs`: XLM escrow contract.

## Market size: TAM, SAM, SOM

Bakti's fee model taps a share of remittance dollar volume, so market size is denominated in dollars flowing through the corridor, not headcount.

- **TAM ≈ $9.3B/year**: 2025 BSP cash-remittance volume from 5 of Bakti's 7 confirmed sending markets (UAE 4.6%, Saudi Arabia 6.6%, Singapore 7.3%, Japan 5.0%, Hong Kong 2.5% of the $35.63B national total). This is a floor: South Korea and Malaysia are also in Bakti's corridor evidence but aren't broken out separately in BSP's top-source reporting.
- **SAM ≈ $1.6B/year**: TAM discounted by each market's own crypto-ownership rate (Triple-A, 2024: UAE 25.3%, Singapore 24.4%, Saudi Arabia 15.0%, Hong Kong 14.3%, Japan 4.0%), the senders who already hold crypto and could plausibly fund a Bakti transfer today without first being onboarded to crypto itself.
- **SOM ≈ $16M/year**: a 1% slice of SAM to aim for in year one or two, reachable through direct worker-community outreach. A goal to work toward, not a promise.

Sources: [Bangko Sentral ng Pilipinas cash remittance data, 2025](https://www.pna.gov.ph/articles/1269149); [Triple-A, State of Global Cryptocurrency Ownership 2024](https://www.triple-a.io/blog/crypto-ownership-report).

## Business-model hypotheses, unvalidated

- **Main path:** a sender-paid fee bundled transparently into a licensed provider's quote. At 2% (well under the 6.36% world average cost to remit, World Bank Remittance Prices Worldwide Q3 2025), SOM's $16M works out to roughly $300K a year in fee revenue, a sanity check on the model, not a projection we're standing behind.
- **Also possible:** provider referral or revenue share, where contracts and regulation allow it.
- **Also possible:** employer or worker-community distribution, paid by an institution rather than the recipient.

No price, take rate, unit economics, or provider margin has been validated. For context, the same World Bank dataset puts the bank-average cost to remit at 14.99% and the cheapest available option today at 3.29%; Bakti's target sits under the 6.36% global average, though the anchor's own cash-out quote is not yet known.

## Go-to-market strategy

1. Start with one corridor: Singapore to the Philippines, where the survey and BSP corridor evidence are strongest.
2. Land the PeraHub anchor connection first; MoneyGram Ramps' outreach email stays open in parallel, without claiming a partnership with either.
3. Seed early users through Filipino overseas-worker community groups, the same population the 200-person survey drew from.
4. Run a small testnet usability study measuring plan creation, successful signing, and transaction comprehension.
5. Expand market by market (UAE, Saudi Arabia, Hong Kong, Japan) as sender-side crypto access and comfort grow.

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

The escrow contract is live on Stellar mainnet today. What's still pending is a fresh, team-signed release transaction to serve as citable end-to-end proof — the contract being live and a specific release being verified are two different claims, and this repo only makes the one it can back.

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

- Bakti community survey, 200 respondents, Filipino overseas workers, 2026 (primary research, not yet published externally).
- DMW/OFW deployment reporting (2025), via businessmirror.com.ph: https://businessmirror.com.ph/2026/02/04/ofw-deployments-hit-record-2-7-million-in-2025-as-kuwait-and-europe-open-doors/
- Bangko Sentral ng Pilipinas, 2025 full-year cash remittances: https://www.pna.gov.ph/articles/1269149
- Triple-A, State of Global Cryptocurrency Ownership 2024: https://www.triple-a.io/blog/crypto-ownership-report
- World Bank, Remittance Prices Worldwide, Q3 2025: https://remittanceprices.worldbank.org/
- Stellar Anchor Directory (PeraHub, SEP-31 confirmed): https://anchors.stellar.org
- PeraHub / PETNET Inc. (BSP regulation): https://perahub.com.ph
- Stellar, MoneyGram International case study (2021 launch): https://stellar.org/case-studies/moneygram-international
- Stellar, Anchors: https://developers.stellar.org/docs/learn/fundamentals/anchors
- Stellar Anchor Platform, SEP-24: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- MoneyGram, Integrate MoneyGram Ramps: https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- MoneyGram Ramps, live `/info` endpoint: https://stellar.moneygram.com/stellaradapterservice/sep24/info
- MoneyGram Ramps, supported-countries sheet: https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM
- Stellar Expert, Bakti mainnet contract: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

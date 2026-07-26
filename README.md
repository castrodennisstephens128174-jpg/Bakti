# Bakti

Bakti is a Stellar mainnet product for **Vietnamese contract workers abroad planning salary-day support for family in Vietnam**. It keeps a recipient, amount, and reminder date in one plan, then lets the sender sign a direct Stellar payment or release pre-funded XLM from a Soroban escrow.

**Current boundary:** the recipient needs a Stellar address. Bakti does not yet connect to a licensed cash-out provider, perform KYC, or deliver Vietnamese dong.

**Pitch deck:** [`slides/marp/deck.pdf`](slides/marp/deck.pdf) · [visual HTML deck](slides/index.html)

## Problem and target user

The target user is a Vietnamese worker on a formal labor contract abroad who wants family support to be deliberate and easy to verify rather than an ad-hoc transfer remembered late in the month. The family member may ultimately prefer cash, but the present prototype stops at the recipient's Stellar wallet.

The product hypothesis is that salary-day planning, a persistent family-support record, and verifiable payment evidence can reduce uncertainty for the sender. This has not yet been validated through a claimed interview sample or production pilot.

## Why research the Đông Á → Vietnam corridor

Vietnam's Ministry of Labour (MOLISA) and government reporting show:

- **700,000+** Vietnamese currently on formal overseas labor contracts, remitting an estimated **US$3.5–4B/year**.
- **New 2024 deployments** were concentrated in three markets: **Japan 62,722 · Taiwan 48,533 · Korea 10,877** — the longest-running, largest state-brokered labor programs.
- **Ho Chi Minh City alone received US$10.34B in remittances in 2025** (+8.3% YoY); Asia-origin inflows were ~48.9% (~US$5.06B) of that total, reported as driven mainly by Japan/Korea/Taiwan.

No public source breaks the HCMC remittance dollars down by sending country. The worker-deployment counts (MOLISA) and the Asia-origin remittance total (SBV/HCMC) are two different figures from two different measurements — **a corridor signal, not Bakti's TAM.** Further customer, channel, compliance, and provider research is required.

Sources: [MOLISA overseas labor deployment via VietnamPlus](https://en.vietnamplus.vn/vietnam-aims-to-send-130000-workers-abroad-in-2024-post304865.vnp), [SGGP 2024 deployment figures](https://en.sggp.org.vn/share113776.html), [HCMC 2025 remittances via baochinhphu.vn](https://en.baochinhphu.vn/hcmc-absorbs-over-1034-billion-of-remittances-in-2025-111260123102358585.htm), and [kinhtevadubao.vn on contract-worker remittances](https://kinhtevadubao.vn/dong-kieu-hoi-tang-tich-cuc-nho-xuat-khau-lao-dong-25022.html).

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

`Sender → Stellar → licensed anchor/provider → KYC and provider workflow → VND cash-out → family member`

The target last mile is a certified SEP-24 integration with a licensed Stellar anchor. It is not currently connected.

**No anchor has a publicly verified live VND rail today.** The two closest candidates:

- **Lightnet.** Listed on Stellar's own [Anchor Directory](https://anchors.stellar.org/) with Vietnam among its 150+ country coverage, SEP-24 support, and a cross-border-payments focus. Its listed `stellar.toml` URL (`lightnet.io/.well-known/stellar.toml`) returns 404 — the directory listing is not independently verifiable against a live anchor endpoint.
- **MoneyGram Ramps.** A real, live Stellar anchor. Funds settle to a MoneyGram-controlled Stellar address; the recipient collects cash via phone number/code plus ID — no Stellar wallet needed on the receiving side. That exact no-wallet mechanism already runs in Kenya, Philippines, and Mexico (independent analysis, [chaingain.io](https://chaingain.io/moneygram-stellar-crypto-remittance-2026/) — not MoneyGram's own docs, which were inaccessible for direct verification). It's a proven pattern; Vietnam does not appear in any MoneyGram Ramps source checked.

Neither is a confirmed partner yet — Bakti is currently reaching out to both.

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
| Cash-out | Not implemented | Licensed VND cash-out and provider reference |
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

MoneyGram Ramps' integration docs publish **5–950 USDC on-ramp** and **5–2,500 USDC off-ramp** limits; the live production `/info` endpoint currently reports a 1 USDC floor on both sides instead of 5, and a separate Production Preview/certification tier caps test transactions at **10–20 USDC (100 USDC aggregate)**. These three sources disagree on the exact minimum — and none of them list Vietnam as a supported country to begin with.

Lightnet's [Stellar Anchor Directory listing](https://anchors.stellar.org/) includes Vietnam in its country coverage and SEP-24 support, but its `stellar.toml` is unreachable (404), so its actual integration requirements and limits are unconfirmed.

Sources: [Integrate MoneyGram Ramps](https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps), the live [`/info` endpoint](https://stellar.moneygram.com/stellaradapterservice/sep24/info), MoneyGram's [supported-countries sheet](https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM), and the [Stellar Anchor Directory](https://anchors.stellar.org/).

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
  └─ SEP-1 + SEP-10 + SEP-24 + KYC + quote/status + VND cash-out
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

1. Interview Vietnamese contract workers in Japan/Taiwan/Korea around salary-day support behavior, recipient preferences, trust, and wallet constraints.
2. Test a no-money planning/reminder prototype before claiming a scheduling product.
3. Currently reaching out to Lightnet and MoneyGram about a Vietnam VND rail, and mapping any other regulated on/off-ramp provider covering Vietnam.
4. Seek a provider sandbox/certification conversation; do not market either provider as a partner.
5. Run a small testnet usability study measuring plan creation, successful signing, and transaction comprehension.

## Limitations and security

- Product defaults to Stellar mainnet; XLM and USDC sent through it are real assets with real value. Set both `STELLAR_NETWORK=testnet` and `NEXT_PUBLIC_STELLAR_NETWORK=testnet` in your own `.env.local` for free local development — the server and client resolve network independently, so both must be set together.
- The app is not a bank, money transmitter, anchor, KYC provider, or cash-pickup service.
- The sender controls the wallet and signs every on-chain action; Bakti must never receive secret keys.
- XLM escrow pre-funds the contract. `release` is permissionless, but always pays the recorded recipient.
- `LEDGERS_PER_PERIOD = 60` is intentionally short for demonstrations, not a calendar month.
- `dayOfMonth` does not control the contract and does not trigger a job.
- USDC uses the official Circle issuer on Stellar mainnet `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`.
- Existing database rows may contain legacy local `settled`/`collected` demo states; the UI labels them honestly and new endpoints do not create them.

## Verified mainnet deployment

- **Contract:** `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- **Contract explorer:** [Stellar Expert public](https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR) — confirmed live on Stellar mainnet (created 2026-07-12, 7 recorded invocations as of this check).
- **Open item:** the contract's on-chain creator key does not match the admin key documented in `contracts/DEPLOYMENT.md`. A fresh, team-signed `create_schedule` + `release` call — producing a mainnet transaction hash citable as release proof — is pending; do not cite a specific transaction hash as mainnet proof until one is produced and confirmed at `horizon.stellar.org/transactions/<hash>`.

The previously-cited testnet proof (`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) remains in `contracts/DEPLOYMENT.md` for the testnet development record, but is not mainnet operation, provider settlement, or cash collection proof.

## Setup

Requirements: Node.js, pnpm, PostgreSQL, Freighter, and a funded Stellar wallet (real mainnet XLM by default — see `.env.example` for switching to testnet locally).

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
python3 slides/build_deck.py
```

Contract tests:

```bash
cd contracts
make test
```

## Sources

- MOLISA overseas labor deployment (2024), via VietnamPlus: https://en.vietnamplus.vn/vietnam-aims-to-send-130000-workers-abroad-in-2024-post304865.vnp
- MOLISA overseas labor deployment (2024), via SGGP: https://en.sggp.org.vn/share113776.html
- HCMC 2025 remittances, via baochinhphu.vn: https://en.baochinhphu.vn/hcmc-absorbs-over-1034-billion-of-remittances-in-2025-111260123102358585.htm
- Contract-worker remittance total, kinhtevadubao.vn: https://kinhtevadubao.vn/dong-kieu-hoi-tang-tich-cuc-nho-xuat-khau-lao-dong-25022.html
- Stellar, Anchors: https://developers.stellar.org/docs/learn/fundamentals/anchors
- Stellar Anchor Platform, SEP-24: https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- Stellar Anchor Directory (Lightnet listing): https://anchors.stellar.org/
- MoneyGram, Integrate MoneyGram Ramps: https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- MoneyGram Ramps, live `/info` endpoint: https://stellar.moneygram.com/stellaradapterservice/sep24/info
- MoneyGram Ramps, supported-countries sheet: https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM
- Stellar Expert, Bakti mainnet contract: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

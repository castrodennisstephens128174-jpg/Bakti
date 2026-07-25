# Bakti — Technical Flow

## Product boundary

Current flow:

```text
Sender → Bakti support-plan record → Stellar → recipient Stellar address
```

Planned flow:

```text
Sender → Stellar → certified anchor/provider → KYC and provider workflow → PHP cash-out
```

The planned provider segment is not implemented.

## 1. Wallet session

```text
Freighter requestAccess()
  → POST /api/auth/challenge { publicKey }
  → server builds manageData("bakti_auth", nonce) transaction
  → Freighter signs transaction XDR
  → POST /api/auth/verify { publicKey, signedNonce }
  → server verifies signature + nonce and sets session cookie
```

This is Bakti's own signed challenge. It is **not SEP-10** and does not produce an anchor JWT.

Key code:

- `src/server/service/auth.service.ts`
- `src/ui/wallet/WalletProvider.tsx`
- `src/ui/wallet/stellarClient.ts`

## 2. Create support plan — XLM escrow path

```text
POST /api/allowances/escrow-intent
  → validate recipient, amount, reminder day, periods
  → buildCreateScheduleXdr()
  → Soroban RPC simulate/assemble
  → return unsigned XDR

Freighter signs

POST /api/allowances { ..., signedXdr }
  → validate source, source signature, single Bakti create_schedule invoke, and typed args
  → submitCreateSchedule()
  → RPC confirms SUCCESS
  → persist allowance + scheduleId + escrow txHash
  → create one scheduled app record for current YYYY-MM
```

The contract transfers `monthly_amount × months` native XLM from the sender to the contract at `create_schedule` time.

`dayOfMonth` is not passed to the contract and does not schedule anything.

## 3. Create support plan — USDC path

```text
POST /api/allowances { ..., asset: "USDC" }
  → persist plan
  → create one scheduled app record for current YYYY-MM
```

No escrow or automatic payment is created. The configured issuer is the official Circle USDC issuer on Stellar mainnet:

`GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`

## 4. XLM contract release

```text
POST /api/allowances/:id/release-intent
  → reject paused or ended plan
  → buildReleaseXdr(scheduleId)
  → Soroban RPC simulate/assemble
  → return unsigned XDR

Freighter signs

POST /api/allowances/:id/payouts { signedXdr }
  → reject paused or ended plan
  → validate source, source signature, single Bakti release invoke, scheduleId, and caller
  → submitSorobanSigned()
  → RPC confirms SUCCESS
  → record txHash with status sent
```

The UI labels `sent` as **Verified on-chain**. It does not advance to provider settlement.

The contract's `release` entrypoint is permissionless: the caller pays the transaction fee, while the contract always transfers XLM to the recipient stored in the schedule.

## 5. Direct XLM/USDC payment

```text
Browser builds classic payment to allowance.recipientAddress
  → Freighter signs
  → Horizon submission returns txHash

POST /api/allowances/:id/payouts { txHash }
  → reject paused or ended plan
  → load the expected monthly amount from the allowance record
  → verifyAllowancePayment()
      - transaction exists and succeeded
      - sender matches owner
      - recipient matches entered G-address
      - asset matches XLM or the configured USDC issuer
      - amount matches the database value
  → record txHash with status sent
```

No anchor deposit address, muxed address, pickup reference, or provider status is involved.

## 6. SEP-7 and recipient watcher

`GET /api/allowances/:id/pay-uri` returns a SEP-7 pay URI whose destination is the recipient Stellar address.

The allowance detail page also opens a best-effort Horizon SSE stream for payments to that recipient account. It is visual feedback only and does not change the payout state or prove provider settlement/collection.

## 7. Payout state boundary

The schema retains future provider states:

```text
scheduled → sent → settled → collected
       ↘ failed      ↘ failed
```

Current behavior:

- Direct Horizon-verified payment: `scheduled → sent`.
- RPC-confirmed contract release: `scheduled → sent`.
- `settled`: reserved for a future provider confirmation.
- `collected`: reserved for future provider-confirmed collection.
- Manual collection endpoint: returns a conflict because no provider adapter is connected.
- New current-flow records have no `pickupRef`.

Legacy database rows may contain locally acknowledged `settled` or `collected` values. They are not provider evidence.

## 8. Allowance state

```text
active → paused → active
   └────────────→ ended
paused ─────────→ ended
```

Both payout construction and payout recording reject paused and ended plans.

## 9. Demo cadence and planning metadata

- `LEDGERS_PER_PERIOD = 60` is a short contract demo cadence.
- It is not a month and has no relationship to `dayOfMonth`.
- `dayOfMonth` is stored for planning/reminder copy only.
- No cron job, queue, keeper service, or automatic monthly scheduler is implemented.

## 10. Network defaults

Defaults are internally consistent on Stellar mainnet — every value below is derived from `STELLAR_NETWORK` in `src/server/config/env.ts`, so setting that one variable is enough to switch network; explicit env vars still override any single value:

- Network: `public`
- Horizon: `https://horizon.stellar.org`
- Passphrase: `Public Global Stellar Network ; September 2015`
- Soroban RPC: `https://mainnet.sorobanrpc.com`
- Bakti contract: `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- Native XLM SAC: `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`
- USDC issuer (official Circle issuer): `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`

For free local development, set `STELLAR_NETWORK=testnet` and `NEXT_PUBLIC_STELLAR_NETWORK=testnet` in your own `.env.local` — the testnet contract/passphrase/Horizon/RPC/issuer all resolve automatically from that one change.

## 11. Last-mile integration required

A MoneyGram Ramps or other licensed anchor adapter would need, at minimum:

1. Commercial onboarding, KYB/compliance, agreements, and allowlisting.
2. SEP-1 metadata.
3. Anchor SEP-10 authentication and JWT handling.
4. Hosted SEP-24 flow and KYC fields.
5. Provider quote/limit presentation where applicable.
6. Provider-approved deposit routing.
7. Transaction status polling/webhooks and error reconciliation.
8. Provider reference and provider-confirmed cash-out/collection state.

None of these steps is implemented in the current endpoints.

Two additional gaps in this target design are open, not yet answered by any source:

- **Malaysia on-ramp.** MoneyGram Ramps' own coverage sheet lists Malaysia cash-out only — there is no MYR→USDC deposit path through it today. No Bank Negara Malaysia–licensed remittance operator found (TerraPay, Sunrate) offers a stablecoin capability; they are fiat-only. Classic (non-crypto) MoneyGram already runs a full send corridor out of Malaysia, but that path never touches Stellar or USDC.
- **Third-party cash pickup.** Classic MoneyGram has always supported sender ≠ receiver — the recipient collects with a reference number and matching photo ID, no account or KYC of their own required. Whether MoneyGram Ramps preserves that for a Stellar-funded withdrawal is unconfirmed by MoneyGram's developer docs. Beans, the one live Stellar+MoneyGram wallet with a documented flow, requires both sender and recipient to hold their own KYC'd wallet. Decaf shows a friendlier sender-only-account + recipient-claim-link pattern feeding into MoneyGram cash-out, but its recipient KYC mechanics aren't publicly confirmed.

MoneyGram's published off-ramp limits also need a caveat: the integration docs list 5–950 USDC on-ramp and 5–2,500 USDC off-ramp, but the live production `/info` endpoint currently reports a 1 USDC floor on both sides, and a separate Production Preview/certification tier caps test transactions at 10–20 USDC (100 USDC aggregate) — treat these as three different figures from three different sources, not one clean number.

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- https://stellar.moneygram.com/stellaradapterservice/sep24/info
- https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM
- https://www.moneygram.com/us/en/send-and-receive/receiving-money
- https://www.beansapp.com/moneygram
- https://decaf.so/en/use-cases/remittance-senders

## 12. Verified mainnet deployment

- Contract: `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR` — confirmed live on Stellar mainnet (created 2026-07-12, 7 recorded invocations).
- Explorer: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
- Open item: the on-chain creator key does not match the documented admin key in `contracts/DEPLOYMENT.md`. A fresh, team-signed `create_schedule` + `release` call producing a citable mainnet transaction hash is pending — do not cite a specific tx hash as mainnet proof until one is produced and confirmed at `horizon.stellar.org/transactions/<hash>`.

The previously-cited testnet proof (contract `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) is testnet contract-release proof only, kept in `contracts/DEPLOYMENT.md` as the development record.

## Key files

| File | Role |
|---|---|
| `src/server/config/env.ts` | Server env validation and network-derived (mainnet default) config |
| `src/server/config/env.public.ts` | Client-safe network configuration |
| `src/server/service/auth.service.ts` | Custom signed session challenge |
| `src/server/service/allowance.service.ts` | Plan validation and lifecycle |
| `src/server/service/payout.service.ts` | Direct/release recording and provider boundary |
| `src/server/stellar/contract.ts` | Soroban XDR build, simulation, submission, reads |
| `src/server/stellar/horizon.ts` | Direct payment verification |
| `src/server/stellar/payuri.ts` | SEP-7 direct pay URI |
| `app/allowances/[id]/page.tsx` | Payment UI, watcher, and planned integration panel |
| `contracts/bakti-escrow/src/lib.rs` | XLM escrow contract |

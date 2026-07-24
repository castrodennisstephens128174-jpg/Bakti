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

No escrow or automatic payment is created. The configured issuer is the official Stellar testnet USDC issuer:

`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

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
      - asset matches XLM or configured testnet USDC
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

Local/example defaults are internally consistent on Stellar testnet:

- Network: `testnet`
- Horizon: `https://horizon-testnet.stellar.org`
- Passphrase: `Test SDF Network ; September 2015`
- Soroban RPC: `https://soroban-testnet.stellar.org`
- Bakti contract: `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
- Native XLM SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Testnet USDC issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

Explicit deployment environment variables still override defaults. A mainnet deployment must configure a verified network-specific contract and asset issuers; changing only the network name is insufficient.

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

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps

## 12. Verified testnet proof

- Contract: `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
- Freighter-signed release: `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`
- Explorer: https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2

This is testnet contract-release proof only.

## Key files

| File | Role |
|---|---|
| `src/server/config/env.ts` | Server env validation and testnet defaults |
| `src/server/config/env.public.ts` | Client-safe network configuration |
| `src/server/service/auth.service.ts` | Custom signed session challenge |
| `src/server/service/allowance.service.ts` | Plan validation and lifecycle |
| `src/server/service/payout.service.ts` | Direct/release recording and provider boundary |
| `src/server/stellar/contract.ts` | Soroban XDR build, simulation, submission, reads |
| `src/server/stellar/horizon.ts` | Direct payment verification |
| `src/server/stellar/payuri.ts` | SEP-7 direct pay URI |
| `app/allowances/[id]/page.tsx` | Payment UI, watcher, and planned integration panel |
| `contracts/bakti-escrow/src/lib.rs` | XLM escrow contract |

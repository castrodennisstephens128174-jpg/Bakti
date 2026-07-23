# Bakti — Technical Flow

## End-to-End Flow

### 1. Onboarding (sender)
```
Connect wallet (Freighter)
  → SEP-10 challenge/verify
  → session cookie set
```

Server issues a nonce via `manageData("bakti_auth", nonce)`. Client signs it.
Server verifies the signature and creates a session row.

### 2. Create Allowance — XLM path (Soroban)
```
POST /api/allowances/escrow-intent
  → buildCreateScheduleXdr()
  → returns unsigned XDR

Client signs XDR with Freighter
POST /api/allowances { signedXdr }
  → submitCreateSchedule(signedXdr)
  → BaktiEscrow.create_schedule() on Soroban
  → scheduleId returned
  → insertAllowanceWithFirstPayout()
```

The contract `create_schedule` transfers `monthly_amount × months` XLM from the
sender into the contract. A `Schedule` is stored on-chain.

### 3. Create Allowance — USDC path (classic)
```
POST /api/allowances (no signedXdr)
  → insertAllowanceWithFirstPayout()
```

No on-chain schedule. Each payout is a separate Horizon transaction verified
against the ledger.

### 4. Monthly Release — XLM path
```
POST /api/allowances/:id/release-intent
  → buildReleaseXdr(scheduleId)
  → returns unsigned XDR

Client signs XDR with Freighter
POST /api/allowances/:id/payouts { signedXdr }
  → submitSorobanSigned(signedXdr)
  → BaktiEscrow.release() on Soroban
  → contract transfers monthly_amount XLM to recipient
  → recordRelease() → payout status: scheduled → sent → settled
```

`release()` is permissionless (keeper model). Any address can call it; the
contract always pays the recorded recipient.

### 5. Monthly Payment — USDC path
```
POST /api/allowances/:id/payouts { txHash, amount }
  → verifyAllowancePayment(txHash, asset, from, to, amount)
  → recordPayment() → payout status: scheduled → sent → settled
```

Server re-derives the transaction from Horizon and verifies asset, amount,
recipient before recording.

### 6. Off-Ramp (demo)
```
settled payout triggers makePickupRef(corridor, period)
  → "BAKTI-YYYYMM-XXXXXX"
```

On mainnet, a live SEP-24 anchor replaces this with its own `transaction_id`.

### 7. Collection
```
POST /api/allowances/:id/payouts/:payoutId/collect
  → payout status: settled → collected
```

Sender confirms the parent collected the cash.

## Key Files

| File | Role |
|------|------|
| `src/server/config/env.ts` | Zod schema, defaults, network pinning |
| `src/server/config/env.public.ts` | Client-safe env values |
| `src/server/stellar/contract.ts` | Soroban XDR build + submit |
| `src/server/stellar/horizon.ts` | Horizon payment verification |
| `src/server/stellar/muxed.ts` | SEP-23 muxed address builder |
| `src/server/stellar/payuri.ts` | SEP-7 pay URI builder |
| `src/server/service/allowance.service.ts` | Allowance lifecycle + state machine |
| `src/server/service/payout.service.ts` | Payout lifecycle + state machine |
| `src/server/service/auth.service.ts` | SEP-10 challenge/verify |
| `contracts/bakti-escrow/src/lib.rs` | Soroban contract: `create_schedule`, `release` |
| `app/ui/wallet/WalletProvider.tsx` | Client wallet state machine |
| `app/ui/wallet/stellarClient.ts` | Freighter sign + submit helpers |

## Contract Constants

- `LEDGERS_PER_PERIOD = 60` — demo cadence (~5 minutes on testnet).
- Production: `30 * DAY_IN_LEDGERS = 518_400` ledgers ≈ 30 days.
- Contract ID (mainnet): `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- Explorer: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

## SEP Coverage

| SEP | Status | Used for |
|-----|--------|----------|
| SEP-7 | Wired | Pay URI deep links from allowance detail |
| SEP-10 | Wired | Wallet authentication |
| SEP-23 | Wired | Per-allowance muxed attribution on anchor account |
| SEP-24 | Demo | Off-ramp cash-pickup reference (stubbed) |

## Environment

Pin `STELLAR_NETWORK=public` for mainnet. Default env vars are now mainnet-pinned.
See `.env.example` for all required variables.

# Bakti — Design

## UX Principles

1. **Sender-first.** The product is operated by a working adult abroad who has a
   Stellar wallet and may be comfortable with DeFi. Crypto literacy is assumed
   on the send side, zero assumed on the receive side.
2. **Receiver dignity.** The parent never touches a wallet, a seed phrase, or a
   blockchain concept. The only artifact they receive is a short reference code
   and a pickup point name.
3. **No sign-up.** The app is wallet-gated only. No email, no password, no KYC
   for the sender (KYC lives with the wallet provider, not Bakti).
4. **Provable, not opaque.** Every payment is a real Stellar transaction. The
   sender can link to stellar.expert and show the exact receipt.

## Screen Flow

```
Landing (/, public)
  → Dashboard (/dashboard, wallet-gated)
      → Create Allowance (inline form)
      → Allowance Detail (/allowances/:id)
          → Pay this month (signed release OR direct payment)
          → Confirm collected
      → Stats (/stats, public)
```

## Payout Status Machine

```
scheduled ──send──▶ sent ──settle──▶ settled ──collect──▶ collected
     │                │
     └─────fail───────┘
```

Allowed transitions are enforced by `nextPayoutStatus()` in
`src/server/service/payout.service.ts`. Invalid transitions throw CONFLICT (409).

## Allowance Status Machine

```
active ──pause──▶ paused ──resume──▶ active
   │
   └───end──▶ ended
```

Enforced by `nextAllowanceStatus()` in
`src/server/service/allowance.service.ts`.

## Corridors

Stored as free-text in `allowances.corridor`. Displayed in the dashboard select.
Corridor list is hard-coded in `app/dashboard/page.tsx` as `CORRIDORS`.

Current corridors (demo, anchor TBD):

- Philippines · Cash pickup
- Indonesia · Cash pickup
- Vietnam · Cash pickup
- Malaysia · Cash pickup
- Thailand · Cash pickup

## Token / Asset

- **XLM** — escrowed via the BaktiEscrow Soroban contract.
- **USDC** — classic Horizon payment. USDC asset issuer is
  `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.

## Wallet

Freighter is the primary wallet. SEP-7 deep links open Freighter (or any
SEP-7-aware wallet). Passphrase is pinned to the app's network, not the
wallet's active network.

## Cadence

Testnet: 60 ledgers ≈ 5 minutes per period. This is a demo cadence only.
Production would use `30 * 17_280 = 518_400` ledgers (approximately 30 days).

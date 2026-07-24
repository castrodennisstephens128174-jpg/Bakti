# Bakti — Product and UX Design

## Product boundary

Bakti currently serves a sender with a Stellar wallet. It helps that person record a family support plan and sign a transfer to a recipient Stellar address.

The intended research corridor is **Malaysia → Philippines**. The initial target user is a Filipino worker in Malaysia planning salary-day support for a family member in the Philippines.

The current experience does not hide the missing last mile:

- The recipient must have a Stellar address.
- No licensed anchor or MoneyGram integration is connected.
- No KYC, quote, provider deposit route, pickup reference, PHP cash-out, or provider collection status exists.
- The selected day is a reminder/planning field only.

## UX principles

1. **Start with the human job.** Name the worker, family member, support amount, and planning date before explaining blockchain.
2. **Keep current and planned flows visually distinct.** Implemented paths use solid cards/lines; provider steps use dashed treatment and “Not connected” labels.
3. **Never turn ledger confirmation into a cash claim.** “Verified on-chain” means the Stellar transaction was confirmed, nothing more.
4. **Show the actual destination.** Current transfers go to the entered recipient Stellar address.
5. **Ask for signatures honestly.** Freighter signs a custom session challenge and each escrow/payment action.
6. **Treat dates as metadata.** Copy must not imply that Bakti schedules or sends monthly payments automatically.
7. **Keep evidence inspectable.** Transaction hashes link to the configured network explorer.

## Screen flow

```text
Landing (public)
  → Dashboard / support plans (wallet session required for data)
      → Create support plan
          - family member
          - recipient Stellar address
          - Malaysia → Philippines research corridor
          - XLM escrow or direct USDC plan
          - reminder day (planning only)
      → Support plan detail
          - sign XLM release or direct transfer
          - SEP-7 direct pay link
          - recipient Horizon watcher
          - planned last-mile integration panel
          - payment records and tx proof
  → Prototype database activity (public)
```

## Status language

| Stored status | Visible label | Meaning |
|---|---|---|
| `scheduled` | Ready to send | An app record exists; no transfer is automatic |
| `sent` | Verified on-chain | Horizon or Soroban RPC confirmed the transaction |
| `settled` | Provider confirmed | Reserved/legacy until a provider adapter exists |
| `collected` | Collection confirmed | Reserved/legacy until provider collection evidence exists |
| `failed` | Failed | An attempted flow was recorded as failed |

Manual “confirm collected” UI is removed. The endpoint rejects manual collection claims.

## Allowance lifecycle

```text
active ──pause──▶ paused ──resume──▶ active
   │                 │
   └──────end────────┘
```

Paused and ended plans cannot build or record a send/release.

## Asset behavior

### XLM

- Creating the plan signs `create_schedule` and pre-funds `amount × periods` in the Soroban contract.
- Each release requires a signed contract invocation through the app.
- `LEDGERS_PER_PERIOD = 60` is a demonstration interval, not a month.

### USDC

- Creating the plan stores metadata only.
- “Send now” creates a direct classic payment to the recipient address.
- The default issuer is the official Stellar testnet USDC issuer.

## Session behavior

Bakti creates a transaction containing `manageData("bakti_auth", nonce)`. Freighter signs it, and the server verifies the signature and nonce before minting an app session.

This is custom authentication, not SEP-10. A future anchor integration will need that anchor's SEP-10 flow separately.

## Last-mile panel

The allowance detail screen should always explain that the following are planned:

1. Provider onboarding, commercial/compliance approval, and allowlisting.
2. SEP-1 and anchor SEP-10.
3. Hosted SEP-24 and KYC.
4. Provider quote/limits where applicable.
5. Provider-approved deposit routing.
6. Status, reference, cash-out, and collection confirmation.

MoneyGram Ramps may be named only as a target path, never as a partner or existing route.

## Metrics page

All numbers are app database counts. The page distinguishes:

- public keys/session rows,
- support-plan records,
- payment records,
- legacy local collection acknowledgements.

It must not call them user traction, live provider results, or verified cash pickup.

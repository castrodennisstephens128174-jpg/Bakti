# ⚓ bakti-anchor — a mock SEP-31 receiving anchor (testnet)

A small but protocol-faithful **receiving anchor** used to rehearse **Bakti**'s SEP-31 sending rail on Stellar testnet, before a licensed partner is connected. It plays the anchor's side of the whole conversation, strictly by the book, so the sending stack can be tested end-to-end with zero special-casing.

**Deployed at:** `https://bakti-anchor.vercel.app` · `/.well-known/stellar.toml`

## What it implements

| Endpoint | Protocol | Behaviour |
|---|---|---|
| `/.well-known/stellar.toml` | SEP-1 | `SIGNING_KEY`, `ACCOUNTS` (receiving account), `WEB_AUTH_ENDPOINT`, `KYC_SERVER`, `DIRECT_PAYMENT_SERVER` |
| `/auth` | SEP-10 | challenge transaction (manageData nonce + web_auth_domain), signature verification, JWT issuance |
| `/sep12/customer` | SEP-12 | customer registration; `ACCEPTED` only when first name, last name **and a government ID** are present, `NEEDS_INFO` with missing fields otherwise |
| `/sep31/info` | SEP-31 | supported assets (testnet USDC + native XLM) with per-side SEP-12 type requirements |
| `/sep31/transactions` | SEP-31 | order creation: validates customers are ACCEPTED, issues a **one-time text memo** and the receiving account |
| `/sep31/transactions/:id` | SEP-31 | status polling with **lazy on-chain settlement detection** (see below) |
| `/sep31/transactions/:id/callback` | SEP-31 | callback URL registration; on completion the anchor POSTs the transaction, signed `Signature: t=…, s=…` with its SEP-1 `SIGNING_KEY` |

## Settlement detection — the interesting part

Money can arrive two ways, and the observer handles both:

1. **Classic payment** to the receiving account whose envelope memo matches the order (the manual / relay path).
2. **Soroban contract payment** — Soroban transactions *cannot carry envelope memos*, so Bakti's escrow emits the memo in its `released` contract event instead. The observer finds native-SAC `transfer` events crediting the receiving account (RPC `getEvents`), then looks for a companion contract event in the same transaction carrying the memo string, and only then marks the order `completed` and issues a pickup reference.

This mirrors what a production, Soroban-aware anchor must do — and proves the escrow → anchor path with no envelope memo at all.

## Storage & config

Postgres (two tables: `customers`, `sep31_transactions`). Environment:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `ANCHOR_SIGNING_SECRET` | SEP-10 challenge signing + callback signatures (`SIGNING_KEY` is derived from it) |
| `JWT_SECRET` | SEP-10 session tokens |
| `RECEIVE_ACCOUNT` | the anchor's receiving Stellar account (published in `ACCOUNTS`) |

## Run

```bash
npm install
npm run dev
```

Testnet only. Not a product — a rehearsal partner. When Bakti signs a real licensed anchor, the sending stack points at their `stellar.toml` instead and this repo's job is done.

# Session summary — mainnet migration, deck rework, docs reconciliation

Date: 2026-07-25. Branch this session worked from: `release/bakti-product-update-2026-07-24`, merged into `main` at commit `1ac8fec`.

## Why

`main` claimed "Mainnet (LIVE)" but paired a real mainnet contract ID with a transaction hash that only exists on testnet (verified: 404 on `horizon.stellar.org`, 200 on `horizon-testnet.stellar.org`). A separate `release/...` branch had already rewritten the product to be honest — by retreating to testnet framing everywhere. The team decided the product runs for real on mainnet, so the job was to make mainnet actually work, then carry the honest framing forward pointed at mainnet instead of retreating to testnet.

## What changed

### 1. Network configuration (`src/server/config/env.ts`, `env.public.ts`, `stellar.ts`, `src/server/stellar/network.ts`)

Root bug: `STELLAR_NETWORK_PASSPHRASE` / `STELLAR_HORIZON_URL` / `SOROBAN_RPC_URL` always had non-empty testnet defaults in the zod schema, so `env.STELLAR_NETWORK_PASSPHRASE || PASSPHRASE_BY_NETWORK[env.STELLAR_NETWORK]` never fell through to the network-keyed map — setting `STELLAR_NETWORK=public` alone didn't switch anything except one string.

Fix: network-keyed maps in `env.ts`, resolved once into exported `*_VALUE` constants, consumed everywhere instead of raw env fields. Setting `STELLAR_NETWORK=public` (the new default) now correctly resolves passphrase, Horizon URL, Soroban RPC URL, Bakti contract ID, native XLM SAC, and USDC issuer together. Explicit env vars still override any single value.

Also found and fixed: the old mainnet RPC default (`https://soroban-rpc.public.stellar.org`) is dead — confirmed unreachable by direct connection test. Replaced with `https://mainnet.sorobanrpc.com` (verified working).

Verified live facts used as the new mainnet defaults:
- Bakti contract `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR` — confirmed live on mainnet (created 2026-07-12, 7 recorded invocations). Its on-chain creator key does **not** match the documented admin key — disclosed everywhere this contract is discussed, not papered over.
- Native XLM SAC `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA` and USDC issuer `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` (official Circle issuer) — both computed and verified live, not guessed.
- No fresh mainnet release transaction exists yet — this is the one remaining manual step (see "What's left").

### 2. Downstream bugs from the network flip (found in code review, not assumed)

- Six UI strings across `app/page.tsx`, `app/layout.tsx`, `src/ui/components/ui.tsx`, `app/allowances/[id]/page.tsx`, `app/dashboard/page.tsx` still said "testnet" after the default flipped to mainnet — fixed.
- `src/ui/wallet/stellarClient.ts` told users to "fund with the Friendbot" on error — Friendbot doesn't exist on mainnet. Made network-aware.
- `.env.example` had explicit per-value overrides (Horizon URL, RPC URL, contract ID, etc.) that would silently keep mainnet values even if a developer set `STELLAR_NETWORK=testnet` locally. Commented out so the single network variable is genuinely sufficient.
- `app/allowances/[id]/page.tsx` built explorer links from the *global* configured network instead of each payout/allowance row's own stored network — meaning legacy testnet transaction hashes would render as broken `/explorer/public/` links. Fixed to use the row's own `network` field.
- `src/ui/lib/format.ts`'s `explorerTx`/`explorerAccount` had a `network = 'testnet'` default parameter — a landmine in a mainnet product. Made the parameter required.

### 3. Docs and README (`README.md`, `docs/design.md`, `docs/technical-flow.md`, `docs/SUBMISSION.md`, `docs/description.md`, `contracts/DEPLOYMENT.md`, `package.json`)

Flipped every genuine network claim from testnet to mainnet while keeping every honest "not implemented" disclosure intact — only the network label changed, not the boundary. `contracts/DEPLOYMENT.md` used to have two sections both titled "## Mainnet" that contradicted each other (one said deployed, one said "not deployed") — rewritten into one consistent "Mainnet deploy status" table with the admin-key mismatch and pending-transaction items called out explicitly.

Two research-backed gaps added to the target-design description (not previously known, found by deep research this session), present everywhere the target SEP-24/MoneyGram design is discussed:

- **Malaysia on-ramp gap.** MoneyGram Ramps' own coverage sheet lists Malaysia cash-out only — no MYR→USDC deposit path exists through it today. No BNM-licensed remittance operator found (checked TerraPay, Sunrate) offers a stablecoin capability.
- **Third-party cash pickup gap.** Classic MoneyGram lets a recipient collect with just a reference number and ID, no wallet/KYC of their own. Whether MoneyGram Ramps (the Stellar/crypto rail) preserves that is unconfirmed — the one live analog with a documented flow, Beans, requires **both** sender and recipient to hold their own KYC'd wallet, the opposite of Bakti's stated goal.

MoneyGram's off-ramp limit figure was also corrected: three different sources give three different numbers (integration docs: 5–950 on-ramp / 5–2,500 off-ramp; live `/info` endpoint: floors at 1; Production Preview/certification tier: 10–20 capped, 100 aggregate) — all three are now cited together instead of one clean (wrong) number.

### 4. Pitch deck (`slides/index.html`, `slides/slides.md`, `slides/build_deck.py`, `slides/Bakti.pptx`)

Two review passes: Opus reviewed the code diff, Fable reviewed the deck specifically for a 3-minute live pitch. Net result: 9 slides → 8.

- Cut the customer/JTBD slide — fully redundant with the persona slide.
- Rewrote the Solution headline positive ("Plan, sign, and verify on-chain today" instead of leading with what's *not* built).
- Replaced three confusing MoneyGram stat tiles (two identical "$2,500" tiles reading like a layout bug) with a two-tile "$2,500 documented/live max → but the tier you can test today is → $20" comparison.
- Deduplicated the "no MoneyGram partnership" disclaimer from 4 places down to 1 (the slide that actually discusses MoneyGram).
- Fixed a CSS bug (`align-items: start` on the two-column grid) that stretched the shorter of two cards to match its taller sibling, leaving a large empty bordered box.
- Removed a broken-looking abstract "portrait" graphic on the persona slide.
- Added one real chart: a magnitude-comparison bar showing Malaysia-attributed remittances (US$675.153M) as a true-to-scale ~1.9% sliver against total Philippine cash remittances (US$35.634B) — verified BSP numbers, no fabricated figures.
- Rebuilt `Bakti.pptx` to match; verified via Playwright screenshots of every slide (contrast, no text overflow, no duplicate content).

### 5. Tests

- Added `tests/unit/config/env.test.ts` — 4 cases proving the network-resolution fix actually closes the original bug (would have failed against the old code).
- `tests/e2e/prod-real.spec.ts`: removed the testnet-only Friendbot funding call (replaced with `E2E_MAINNET_RECIPIENT_PUBLIC_KEY`, a pre-funded real account — there is no mainnet faucet), flipped the explorer-URL assertion from `/explorer/testnet/` to `/explorer/public/`.
- Full suite: 80/80 unit tests passing, `tsc --noEmit` clean, both before and after every batch of changes in this session.

## Deployed

- `main` on GitHub is at `1ac8fec`, includes everything above.
- Vercel production (`bakti-sooty.vercel.app`) redeployed directly from local build via Vercel CLI (the GitHub↔Vercel git integration is currently broken — "unable to fetch required git information" — needs reconnecting in the Vercel dashboard before the normal push-to-deploy flow works again).
- Verified live: `/api/health` returns ok, homepage shows "Mainnet product" / "Stellar mainnet product", no leftover "testnet prototype" copy.
- Vercel production env vars `STELLAR_NETWORK` and `NEXT_PUBLIC_STELLAR_NETWORK` updated to `public`.

## What's left (needs a human, not code)

1. **A real signed mainnet transaction.** The contract is live on mainnet but no fresh `create_schedule`/`release` call has been signed yet — the deck and docs say so explicitly ("pending — to be signed before submission") rather than citing a fabricated hash. Run once ready:
   ```bash
   E2E_MAINNET_RECIPIENT_PUBLIC_KEY=<a real, pre-funded mainnet public key> \
   PLAYWRIGHT_BASE_URL=https://bakti-sooty.vercel.app \
   pnpm test:e2e
   ```
   This drives real Freighter, costs real XLM, and prints `PROD_TX_HASH=<hash>` on success — that hash then replaces the "pending" line in `README.md`, `contracts/DEPLOYMENT.md`, and slide 8.
2. **Reconnect the Vercel↔GitHub git integration** so future pushes auto-deploy again without a manual CLI deploy.
3. **Resolve the mainnet contract's admin-key mismatch** — confirm the team controls the on-chain creator key, or redeploy the contract from the documented admin key.

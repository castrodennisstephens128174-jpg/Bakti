# Bakti Escrow — Deployment Record

## Release status

The product runs on **Stellar mainnet**.

The contract ID previously flagged in this document as "unverified" — `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR` — is confirmed live on Stellar mainnet: created 2026-07-12T17:36:56Z, with 7 recorded events/invocations (checked via `https://api.stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`).

**Open item:** its on-chain creator key (`GBSNLAAEV4EVDDGBC4DOBN4PJK7WLSZG56UNS2K65SRQ3JNOCZPTCWF7`) does not match the admin/deployer key documented below (`GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47`). This must be resolved — either confirm the team controls the creator key, or redeploy from the documented admin key — before citing this contract as clean release proof.

**No fresh mainnet release transaction exists yet.** A team member still needs to sign one real `create_schedule` + `release` call with Freighter to produce a citable mainnet transaction hash. Do not cite any transaction hash as mainnet proof until it resolves at `https://horizon.stellar.org/transactions/<hash>`.

## Contract v2 — built, not deployed anywhere yet

`contracts/bakti-escrow/src/lib.rs` now builds a **different ABI** than either
contract address below: `release` takes a required `memo` argument (the
SEP-31 settlement reference, emitted in the `released` event for anchor
reconciliation), and a new `set_recipient` entrypoint lets the schedule's
sender re-point future releases. Neither the mainnet contract
(`CBVAZDK2...`) nor the testnet contract (`CATFEIDC4...`) documented below
runs this ABI — both still only accept the old 2-arg `release(schedule_id,
caller)`. The keeper (`src/server/service/keeper.service.ts`) and
`bakti-anchor/` integration are written against v2 and are **not runnable
against either currently-deployed contract** until a v2 build is deployed
and initialized on that network. Do not deploy v2 to mainnet without an
explicit, separate go — it changes fund-release semantics.

## Verified mainnet configuration

- Network: Stellar mainnet (`public`)
- Contract ID: `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- Explorer: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
- Admin/deployer (documented, not yet confirmed against on-chain creator — see above): `GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47`
- Native XLM SAC: `CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA`
- Network passphrase: `Public Global Stellar Network ; September 2015`
- Horizon: `https://horizon.stellar.org`
- Soroban RPC: `https://mainnet.sorobanrpc.com` (the previously-documented `https://soroban-rpc.public.stellar.org` is dead — confirmed unreachable — do not use it)

## Mainnet deploy status

| Step | Status |
|---|---|
| Contract built and deployed to mainnet | Done — confirmed live on-chain |
| Contract has recorded invocations | Done — 7 events as of this check |
| Creator key matches documented admin | **Not confirmed — mismatch flagged above** |
| Deploy/initialize/create/release transactions independently verified | **Not done** — no mainnet tx hash produced yet |
| Application network/RPC/Horizon/contract/asset-issuer values configured together | Done — see `src/server/config/env.ts` |
| This record updated with verified evidence | Pending the fresh mainnet transaction |

## Verified testnet configuration (historical dev record — not mainnet proof)

- Network: Stellar testnet
- Contract ID: `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
- Explorer: https://stellar.expert/explorer/testnet/contract/CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ
- Admin/deployer: `GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47`
- Native XLM SAC: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Network passphrase: `Test SDF Network ; September 2015`
- Horizon: `https://horizon-testnet.stellar.org`
- Soroban RPC: `https://soroban-testnet.stellar.org`

## Recorded testnet transactions

- Contract deploy: `375280f4a1395e12a12f5be99629e8e4242d4d40cc18e17f9a27fd2e1ecc0626`
- Initialize: `27e9aad1588de27bf15935fb134e1fe3460e299fd2ff9a0aa9babe597b29009e`
- Release, period 1: `0ea8338a79799b49c08ffaa757599d6ca4bd9ea3d364f5165b7175461587c52e`
  - https://stellar.expert/explorer/testnet/tx/0ea8338a79799b49c08ffaa757599d6ca4bd9ea3d364f5165b7175461587c52e
- Freighter-signed release: `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`
  - https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2 (confirmed 200 on testnet Horizon, 404 on mainnet Horizon — this hash is testnet-only and must never be cited as mainnet proof)

The Freighter-signed transaction contains an `invoke_host_function` operation and testnet asset balance changes showing the contract paying the recorded recipient. It proves an XLM contract release on testnet. It does not prove mainnet operation, provider settlement, cash pickup, or collection.

## Contract behavior (v2 source — not yet deployed; see callout above)

| Method | Authorization | Effect |
|---|---|---|
| `initialize(admin, token)` | admin | One-time configuration of admin and escrow SAC token |
| `create_schedule(sender, recipient, monthly_amount, months, first_due_ledger) -> u64` | sender | Transfers `monthly_amount × months` from sender to contract and stores a schedule |
| `release(schedule_id, caller, memo) -> u32` | caller/keeper | If due, transfers one period from contract to recorded recipient, advances the ledger deadline, and emits `memo` (the SEP-31 settlement reference) in the `released` event |
| `set_recipient(schedule_id, new_recipient)` | schedule's sender only | Re-points where future releases settle (e.g. onboarding a new anchor) |
| `schedule_status(schedule_id)` | view | Returns amount, periods, releases, and next due ledger |
| `get_schedule(schedule_id)` | view | Returns the stored schedule |
| `get_admin()` / `get_token()` | view | Returns configuration |

`release` is permissionless: any caller may pay the transaction fee and trigger a due release, but funds always go to the recipient stored at schedule creation (or re-pointed via `set_recipient` by the sender).

The deployed contract is initialized with the native XLM SAC, so this escrow deployment supports XLM. The app's USDC flow is a separate classic payment to the entered recipient address.

## Demo cadence

Both currently-deployed contracts (mainnet and testnet, old ABI) use `LEDGERS_PER_PERIOD = 60` — a deliberately short test/demo interval, not a calendar month, and independent of the app's `dayOfMonth` field. The unreleased v2 source sets it to `2` for a faster live-demo cadence; that value only takes effect once v2 is built and deployed.

`src/server/service/keeper.service.ts` is a cron-driven automated keeper, but it targets v2's `release(..., memo)` and is not wired against either currently-deployed (v1) contract — see the callout above. Until a v2 contract is deployed, releases against the live mainnet/testnet contracts still require the sender to sign each one from the UI.

A production cadence would need an explicitly reviewed operational model; merely replacing 60 with an approximate month is not a complete production-readiness decision.

## Reproduce on testnet

Testnet stays the default for free local development and iteration. From the repository root:

```bash
cd contracts
make test
stellar contract build --optimize
./scripts/deploy.sh testnet
```

Then initialize the returned contract ID with the verified network-specific admin and native testnet XLM SAC:

```bash
stellar contract invoke \
  --id <TESTNET_CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47 \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Never commit deployer secret keys.

## Outstanding before this record is complete

1. Resolve the admin-key mismatch on the mainnet contract (confirm control of the creator key, or redeploy from the documented admin key).
2. Sign one real `create_schedule` + `release` call against the mainnet contract with Freighter and record the resulting transaction hash here, verified at `horizon.stellar.org/transactions/<hash>`.
3. Update the "Mainnet deploy status" table above once both are done.

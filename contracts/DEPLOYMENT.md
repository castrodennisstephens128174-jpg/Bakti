# Bakti Allowance Escrow — Deployment Record

## Testnet (LIVE)

- Contract ID: `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
- Admin: `GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47` (deployer)
- Escrow token (SAC): native XLM `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- Network passphrase: `Test SDF Network ; September 2015`
- Soroban RPC: `https://soroban-testnet.stellar.org`

Explorer: https://stellar.expert/explorer/testnet/contract/CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ

### Deploy + verification transactions (real, on-chain)
- deploy (create contract): `375280f4a1395e12a12f5be99629e8e4242d4d40cc18e17f9a27fd2e1ecc0626`
- initialize: `27e9aad1588de27bf15935fb134e1fe3460e299fd2ff9a0aa9babe597b29009e`
  (`get_token` reads back the native XLM SAC; `get_admin` reads the deployer)
- create_schedule (escrow 2 XLM, months=2) — schedule_id `0`, recipient
  `GB742LFQAX3KRRFIOWYQB2HEG6426XZOE3TDRTVAASE3N5NFEXPJNLCO`
- release (period 1, contract -> recipient 1 XLM), via `stellar contract invoke`:
  `0ea8338a79799b49c08ffaa757599d6ca4bd9ea3d364f5165b7175461587c52e`
  https://stellar.expert/explorer/testnet/tx/0ea8338a79799b49c08ffaa757599d6ca4bd9ea3d364f5165b7175461587c52e
- release (real Freighter browser signature, real-Freighter e2e run, contract -> recipient 3 XLM):
  `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`
  https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2
  (Horizon-verified: `invoke_host_function` op, asset_balance_changes shows the contract
  paying `GC5J5N53SWVTOVXV3BZSEUYDP7VEUVCY6QJRJN5MZDANANYS6MMGRTNV` — matches the e2e recipient.)

## Demo cadence

`LEDGERS_PER_PERIOD = 60` (~5 minutes at ~5s/ledger). This is a SHORT
testnet-demo cadence so a live demo can release a second period within minutes,
NOT a real 30-day month. A production deploy would set this to ~30 days of
ledgers (30 * 17_280 = 518_400). Documented in lib.rs and docs/technical-flow.txt.

## Entrypoints

| Method | Auth | Effect |
|---|---|---|
| `initialize(admin, token)` | admin | one-time; records admin + escrow SAC token |
| `create_schedule(sender, recipient, monthly_amount, months, first_due_ledger) -> u64` | sender | escrows `monthly_amount * months` (SAC transfer sender -> contract) up front; stores the schedule; returns schedule_id |
| `release(schedule_id, caller) -> u32` | caller (ANY — permissionless keeper) | requires ledger >= next_due (else NotDueYet) and periods_released < months (else AllReleased); SAC transfer contract -> recipient of one month; advances next_due by LEDGERS_PER_PERIOD; returns the period number just released |
| `schedule_status(schedule_id) -> (i128,u32,u32,u32)` | — (view) | (monthly_amount, months, periods_released, next_due_ledger) |
| `get_schedule(schedule_id) -> Schedule` | — (view) | full schedule row |
| `get_admin() / get_token()` | — (view) | config |

`release` is permissionless: any wallet can trigger a due period (a keeper
pattern), but the recipient recorded at create time is always the fund
destination regardless of who calls. The funds move from the contract's own
escrow, not from the caller.

Contract binds a SINGLE token at `initialize` (native XLM SAC), so the on-chain
escrow path serves XLM allowances. USDC allowances keep the classic Stellar
payment path (see docs/technical-flow.txt).

## Tests

`cd source-code/contracts && make test` → 9 passed; 0 failed. Covers all 6 spec
cases (escrow-on-create, NotDueYet, release pays recipient, AllReleased,
permissionless caller, status after 2 releases) plus initialize-twice, bad-input,
and unknown-schedule guards.

## Reproduce

```bash
cd source-code/contracts
make test                              # 9 passed; 0 failed
stellar contract build --optimize
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bakti_escrow.optimized.wasm \
  --source deployer --network testnet
stellar contract invoke --id <ID> --source deployer --network testnet -- \
  initialize --admin GBL5RJKF4QNJ4ZPLJZ7PS7K5A4J44VEZJRV2CRTFFDRVSY2N76AIIE47 \
  --token CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

## Mainnet

- Contract ID: (not deployed) — switch via `./scripts/deploy.sh public`, set
  `STELLAR_NETWORK=public` and `SOROBAN_RPC_URL=https://soroban.stellar.org`
  in `.env.local`, re-`initialize` with the mainnet native XLM SAC, and set
  `LEDGERS_PER_PERIOD` to ~30 days of ledgers before shipping real allowances.

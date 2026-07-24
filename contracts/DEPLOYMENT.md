# Bakti Escrow — Verified Testnet Deployment

## Release status

The verified deployment documented here is on **Stellar testnet**.

A contract ID previously presented in project materials as mainnet — `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR` — has not been verified by this repository's deployment record. Treat it as **unverified and not release proof**. The recorded `cfa17...` transaction is testnet.

## Verified testnet configuration

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
  - https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2

The Freighter-signed transaction contains an `invoke_host_function` operation and testnet asset balance changes showing the contract paying the recorded recipient. It proves an XLM contract release on testnet. It does not prove mainnet operation, provider settlement, cash pickup, or collection.

## Contract behavior

| Method | Authorization | Effect |
|---|---|---|
| `initialize(admin, token)` | admin | One-time configuration of admin and escrow SAC token |
| `create_schedule(sender, recipient, monthly_amount, months, first_due_ledger) -> u64` | sender | Transfers `monthly_amount × months` from sender to contract and stores a schedule |
| `release(schedule_id, caller) -> u32` | caller/keeper | If due, transfers one period from contract to recorded recipient and advances the ledger deadline |
| `schedule_status(schedule_id)` | view | Returns amount, periods, releases, and next due ledger |
| `get_schedule(schedule_id)` | view | Returns the stored schedule |
| `get_admin()` / `get_token()` | view | Returns configuration |

`release` is permissionless: any caller may pay the transaction fee and trigger a due release, but funds always go to the recipient stored at schedule creation.

The deployed contract is initialized with the native XLM SAC, so this escrow deployment supports XLM. The app's USDC flow is a separate classic payment to the entered recipient address.

## Demo cadence

`LEDGERS_PER_PERIOD = 60` is a deliberately short test/demo interval. It is not a calendar month and does not use the app's `dayOfMonth` field.

The app does not run an automatic keeper or monthly scheduler. The current UI asks the sender to sign each release.

A production deployment would need an explicitly reviewed cadence and operational model; merely replacing 60 with an approximate month is not a complete production-readiness decision.

## Reproduce on testnet

From the repository root:

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

## Mainnet requirements

There is no verified mainnet release proof in this document. Before claiming mainnet deployment:

1. Review contract code, cadence, upgrade strategy, storage/TTL behavior, authorization, incident handling, and operations.
2. Build and deploy against the public network with a controlled deployment identity.
3. Initialize with the correct public-network native XLM SAC.
4. Record and independently verify deploy, initialize, create, and release transactions.
5. Configure all application network, RPC, Horizon, contract, and asset-issuer values together.
6. Update this record with the verified evidence.

Until those steps are complete, project materials must describe Bakti's contract proof as testnet only.

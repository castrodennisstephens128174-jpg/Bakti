# Bakti — Submission Summary

## Problem and customer

Bakti focuses on a specific research customer: **a Filipino worker in Malaysia who plans support around salary day for a family member in the Philippines**.

The job is not simply “send crypto.” It is to decide an amount, remember the commitment, direct it to the right family member, and know whether the transfer reached the intended Stellar address. The current prototype tests planning and on-chain proof. It does not yet solve fiat funding or family cash pickup.

The persona used in the pitch is illustrative and is not presented as a completed interview.

## Corridor evidence

BSP reports 2025 preliminary Philippine personal remittances of **US$39.619B** and cash remittances of **US$35.634B**, both up 3.3%. Jan–May 2026 preliminary figures were US$15.735B and US$14.110B respectively.

BSP reports Malaysia-attributed Philippine cash remittances of **US$661.182M in 2024**, **US$675.153M in 2025 provisional**, and **US$279.807M in Jan–May 2026 provisional**.

This is evidence that the national market matters and that Malaysia appears in the reported source tables. It is **not** a Malaysia → Philippines TAM calculation: BSP attribution reflects the immediate source of funds and may not be the remittance's true origin.

Sources:

- https://www.bsp.gov.ph/statistics/external/ofw.aspx
- https://www.bsp.gov.ph/statistics/external/ofw2.aspx

## Product today

```text
Sender → Bakti plan → Stellar transfer or XLM escrow release → recipient Stellar wallet
```

- Freighter wallet connection.
- Custom signed `manageData` session challenge; not SEP-10.
- Family support plan with amount, recipient address, asset, and reminder day.
- XLM Soroban escrow and signed release using a short 60-ledger demo cadence.
- Direct XLM/USDC transfer to the entered recipient Stellar address.
- Horizon verification for classic payments and Soroban RPC confirmation for contract releases.
- SEP-7 direct pay link.
- Best-effort Horizon watcher for recipient payments.
- Status stops at **Verified on-chain**. No provider settlement is inferred.

The reminder day is metadata only. There is no automatic monthly scheduler.

## Target product

```text
Sender → Stellar → licensed anchor/provider → KYC → PHP cash-out → family member
```

The target path is a certified SEP-24 integration with MoneyGram Ramps or another licensed anchor. Stellar anchors connect network assets to off-chain rails. SEP-24 is a hosted interactive deposit/withdrawal flow that requires anchor authentication and KYC.

MoneyGram Ramps is a target path, not a Bakti partner. Its integration requirements include domain allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, and agreements. Its docs publish a 5–950 USDC on-ramp and 5–2,500 USDC off-ramp range, but the live production `/info` endpoint currently floors both sides at 1 USDC, and a separate Production Preview/certification tier caps test transactions at 10–20 USDC (100 USDC aggregate) — three figures, not one clean number. Its availability sheet lists Malaysia and the Philippines as cash-out only, which does not prove Malaysian salary cash-in or a Bakti Malaysia → Philippines route.

Two parts of this target design are still open:

- **Malaysia on-ramp.** No licensed Malaysian rail (checked TerraPay, Sunrate) offers a stablecoin capability today; MoneyGram Ramps itself lists Malaysia cash-out only.
- **Third-party cash pickup.** Classic MoneyGram lets a recipient collect with just a reference number and matching photo ID — no account or KYC of their own. Whether MoneyGram Ramps preserves that for a Stellar withdrawal is unconfirmed; Beans, the one live Stellar+MoneyGram wallet with a documented flow, requires both parties to hold their own KYC'd wallet instead.

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- https://stellar.moneygram.com/stellaradapterservice/sep24/info
- https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM
- https://www.moneygram.com/us/en/send-and-receive/receiving-money
- https://www.beansapp.com/moneygram

## Why Stellar

- Freighter provides user-controlled signing.
- Horizon and Soroban RPC provide verifiable transaction evidence.
- Soroban can pre-fund and release XLM according to contract rules.
- Stellar's anchor standards provide a defined integration target for regulated off-chain rails.

## Business-model hypotheses — unvalidated

- Transparent sender service fee within a licensed provider quote.
- Provider referral or revenue share where contractually and legally permitted.
- Employer, cooperative, or worker-community distribution paid by an institution.

No fee, margin, take rate, or unit economics is validated.

## GTM experiments

1. Interview Filipino workers in Malaysia and family recipients in the Philippines.
2. Validate whether salary-day planning and reminders solve a real problem before adding automation.
3. Identify compliant Malaysian funding rails and licensed Philippine payout providers.
4. Test the current mainnet flow for trust, signing comprehension, and address errors — using a testnet usability study to iterate cheaply before spending real XLM on later rounds.
5. Pursue a provider sandbox or certification discussion without claiming partnership.

## Build status and proof

Deployed on Stellar mainnet:

`CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`

https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR — confirmed live (created 2026-07-12, 7 recorded invocations).

A fresh, team-signed mainnet release transaction is pending; the previously-cited testnet proof (`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) remains in `contracts/DEPLOYMENT.md` as the development record but is not mainnet, provider-deposit, fiat-cash-out, or collection-confirmation proof.

## Ask

- Customer-discovery introductions to Filipino worker communities in Malaysia.
- A technical/compliance conversation with a licensed anchor or MoneyGram Ramps integration team.
- Review of the Malaysia funding and Philippines payout regulatory path.
- Feedback on whether the planning job is valuable before adding provider and scheduling complexity.

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

MoneyGram Ramps is a target path, not a Bakti partner. Its integration requirements include domain allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, and agreements. It publishes an off-ramp range of 5–2,500 USDC. Its availability sheet lists Malaysia and the Philippines as cash-out only, which does not prove Malaysian salary cash-in or a Bakti Malaysia → Philippines route.

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps

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
4. Test the current testnet flow for trust, signing comprehension, and address errors.
5. Pursue a provider sandbox or certification discussion without claiming partnership.

## Build status and proof

Verified testnet contract:

`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`

Verified testnet Freighter-signed release:

`cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`

https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2

This is testnet proof of an on-chain contract release. It is not mainnet, a provider deposit, fiat cash-out, or collection confirmation.

## Ask

- Customer-discovery introductions to Filipino worker communities in Malaysia.
- A technical/compliance conversation with a licensed anchor or MoneyGram Ramps integration team.
- Review of the Malaysia funding and Philippines payout regulatory path.
- Feedback on whether the planning job is valuable before adding provider and scheduling complexity.

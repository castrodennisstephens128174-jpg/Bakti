# Bakti: Submission Summary

## Problem and customer

Bakti focuses on a specific research customer: **a Filipino worker abroad who plans support around salary day for a family member in the Philippines**.

The job is not simply "send crypto." It is to decide an amount, remember the commitment, direct it to the right family member, and know whether the transfer reached the intended Stellar address. The current prototype tests planning and on-chain proof. It does not yet solve fiat funding or family cash pickup.

The persona used in the pitch is illustrative and is not presented as a completed interview.

## Corridor evidence

Only the receiving side of this product needs a licensed Stellar anchor. A sender can be anywhere and fund their own wallet with XLM/USDC from any exchange; only the Philippines needs a certified cash-out partner. That makes the addressable sending market every country with Filipino workers abroad, not one fixed corridor.

DMW/OFW deployment reporting and BSP cash-remittance data show the UAE as the #1 destination for Filipino workers in 2025 (397,892 deployments), Saudi Arabia #2 (386,699), and Singapore alone accounting for 7.3% of all 2025 Philippine cash remittances, the #2 source country after the US. The same Philippines anchor also reaches Hong Kong (202,415 workers), Japan (60,748), South Korea (38,390), and Malaysia (35,052).

This is a corridor signal, not a TAM calculation: the worker-deployment counts and the remittance-share figure come from two different measurements.

Sources:

- https://businessmirror.com.ph/2026/02/04/ofw-deployments-hit-record-2-7-million-in-2025-as-kuwait-and-europe-open-doors/

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
Sender → Stellar → MoneyGram Ramps → KYC → PHP cash-out → family member
```

The target path is a certified SEP-24 integration with MoneyGram Ramps. Stellar anchors connect network assets to off-chain rails. SEP-24 is a hosted interactive deposit/withdrawal flow that requires anchor authentication and KYC.

**MoneyGram Ramps** is a real, live Stellar anchor, confirmed in the Philippines since October 2021, one of the original four launch countries with Canada, Kenya, and the US. It has published integration requirements (domain allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, agreements) and a 5-950 USDC on-ramp / 5-2,500 USDC off-ramp range on paper, though its live `/info` endpoint floors both sides at 1 USDC and a separate certification tier caps test transactions at 10-20 USDC (100 USDC aggregate). It is not yet a Bakti partner.

Bakti has emailed MoneyGram Ramps about integrating. There has been no response yet.

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://stellar.org/case-studies/moneygram-international
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- https://stellar.moneygram.com/stellaradapterservice/sep24/info
- https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM

## Why Stellar

- Freighter provides user-controlled signing.
- Horizon and Soroban RPC provide verifiable transaction evidence.
- Soroban can pre-fund and release XLM according to contract rules.
- Stellar's anchor standards provide a defined integration target for regulated off-chain rails.

## Business-model hypotheses, unvalidated

- Transparent sender service fee within a licensed provider quote.
- Provider referral or revenue share where contractually and legally permitted.
- Employer, cooperative, or worker-community distribution paid by an institution.

No fee, margin, take rate, or unit economics is validated.

## GTM experiments

1. Interview Filipino workers abroad (any market) and family recipients in the Philippines.
2. Validate whether salary-day planning and reminders solve a real problem before adding automation.
3. Follow up on the MoneyGram Ramps outreach email, and identify any other licensed payout provider covering the Philippines.
4. Test the current mainnet flow for trust, signing comprehension, and address errors, using a testnet usability study to iterate cheaply before spending real XLM on later rounds.
5. Pursue a provider sandbox or certification discussion without claiming partnership.

## Build status and proof

Deployed on Stellar mainnet:

`CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`

https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR, confirmed live (created 2026-07-12, 7 recorded invocations).

A fresh, team-signed mainnet release transaction is pending; the previously-cited testnet proof (`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) remains in `contracts/DEPLOYMENT.md` as the development record but is not mainnet, provider-deposit, fiat-cash-out, or collection-confirmation proof.

## Ask

- Customer-discovery introductions to Filipino worker communities abroad.
- A warm introduction to MoneyGram Ramps, or feedback on the outreach email already sent.
- Review of the Philippines payout regulatory path.
- Feedback on whether the planning job is valuable before adding provider and scheduling complexity.

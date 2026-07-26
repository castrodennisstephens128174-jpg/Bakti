# Bakti — Submission Summary

## Problem and customer

Bakti focuses on a specific research customer: **a Vietnamese contract worker abroad who plans support around salary day for a family member in Vietnam**.

The job is not simply “send crypto.” It is to decide an amount, remember the commitment, direct it to the right family member, and know whether the transfer reached the intended Stellar address. The current prototype tests planning and on-chain proof. It does not yet solve fiat funding or family cash pickup.

The persona used in the pitch is illustrative and is not presented as a completed interview.

## Corridor evidence

Vietnam has **700,000+** workers on formal overseas labor contracts, remitting an estimated **US$3.5–4B/year**. New 2024 deployments were concentrated in three government-brokered markets: **Japan 62,722 · Taiwan 48,533 · Korea 10,877** — the longest-running, largest programs.

Ho Chi Minh City alone received **US$10.34B** in remittances in 2025 (+8.3% YoY); Asia-origin inflows were ~48.9% (~US$5.06B) of that total, reported as driven mainly by Japan/Korea/Taiwan.

This is evidence that the national market matters and that Japan/Taiwan/Korea are Vietnam's largest labor-export corridors. It is **not** a TAM calculation: no public source breaks HCMC's remittance dollars down by sending country, so the worker-deployment counts and the Asia-origin remittance total are two different figures, not one number.

Sources:

- https://en.vietnamplus.vn/vietnam-aims-to-send-130000-workers-abroad-in-2024-post304865.vnp
- https://en.sggp.org.vn/share113776.html
- https://en.baochinhphu.vn/hcmc-absorbs-over-1034-billion-of-remittances-in-2025-111260123102358585.htm
- https://kinhtevadubao.vn/dong-kieu-hoi-tang-tich-cuc-nho-xuat-khau-lao-dong-25022.html

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
Sender → Stellar → licensed anchor/provider → KYC → VND cash-out → family member
```

The target path is a certified SEP-24 integration with a licensed Stellar anchor. Stellar anchors connect network assets to off-chain rails. SEP-24 is a hosted interactive deposit/withdrawal flow that requires anchor authentication and KYC.

Neither candidate anchor is a Bakti partner. **MoneyGram Ramps** is a real, live Stellar anchor with published integration requirements (domain allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, agreements) and a 5–950 USDC on-ramp / 5–2,500 USDC off-ramp range on paper — but its live `/info` endpoint floors both sides at 1 USDC, a separate certification tier caps test transactions at 10–20 USDC (100 USDC aggregate), and none of its sources list Vietnam as a supported country. **Lightnet** appears on Stellar's own Anchor Directory with Vietnam among its 150+ country coverage and SEP-24 support, but its listed `stellar.toml` returns 404 — unverified against a live endpoint.

The core gap in this target design is still open:

- **No confirmed Vietnam VND anchor.** Neither MoneyGram Ramps nor Lightnet has a publicly verifiable, live VND rail today. Both are contact targets for the next research phase, not integrations.

Sources:

- https://developers.stellar.org/docs/learn/fundamentals/anchors
- https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep24/getting-started
- https://anchors.stellar.org/
- https://developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- https://stellar.moneygram.com/stellaradapterservice/sep24/info
- https://docs.google.com/spreadsheets/d/1batl_ykVzF9czFpYoW3zYDSLaHu4S3KnaFUoYaS-XdM

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

1. Interview Vietnamese contract workers in Japan/Taiwan/Korea and family recipients in Vietnam.
2. Validate whether salary-day planning and reminders solve a real problem before adding automation.
3. Contact Lightnet and MoneyGram about a Vietnam VND rail, and identify any other licensed payout provider covering Vietnam.
4. Test the current mainnet flow for trust, signing comprehension, and address errors — using a testnet usability study to iterate cheaply before spending real XLM on later rounds.
5. Pursue a provider sandbox or certification discussion without claiming partnership.

## Build status and proof

Deployed on Stellar mainnet:

`CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`

https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR — confirmed live (created 2026-07-12, 7 recorded invocations).

A fresh, team-signed mainnet release transaction is pending; the previously-cited testnet proof (`CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`, tx `cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2`) remains in `contracts/DEPLOYMENT.md` as the development record but is not mainnet, provider-deposit, fiat-cash-out, or collection-confirmation proof.

## Ask

- Customer-discovery introductions to Vietnamese worker communities in Japan/Taiwan/Korea.
- A warm introduction to Lightnet or MoneyGram Ramps about a Vietnam VND rail.
- Review of the Vietnam payout regulatory path.
- Feedback on whether the planning job is valuable before adding provider and scheduling complexity.

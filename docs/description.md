# Bakti: Description

Bakti is a Stellar mainnet product for Filipino workers abroad planning salary-day support for family in the Philippines. A sender connects Freighter, saves a family member's Stellar address, amount, asset, and reminder date, then signs either a direct XLM/USDC payment or an XLM Soroban escrow release. Bakti verifies the on-chain transaction and records its hash.

Today the recipient must have a Stellar address. The reminder date does not trigger automatic payments, and the 60-ledger contract period is only a demo cadence. Bakti does not implement SEP-31, SEP-24, anchor SEP-10, an anchor API, KYC, provider quotes/status, provider deposit routing, cash pickup, or provider-confirmed collection.

A survey of 200 Filipino overseas-worker community members found 78% send money home every month, 69% want an automatic payday-tied schedule, 78% would use wallet-free cash pickup, and 81% want clear proof the money was sent (Bakti community survey, 200 respondents, Filipino overseas workers, 2026).

The target next step is a certified SEP-31 integration with PeraHub, the retail brand of PETNET Inc., a BSP-regulated remittance company in the UnionBank/UBX group listed on Stellar's own anchor directory for the Philippines; outreach to PeraHub has not started yet, and this is not a partnership claim. Bakti had earlier emailed MoneyGram Ramps, a live Stellar anchor confirmed in the Philippines since 2021, about integrating instead; there was no response.

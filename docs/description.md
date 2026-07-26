# Bakti — Description

Bakti is a Stellar mainnet product for Vietnamese contract workers abroad planning salary-day support for family in Vietnam. A sender connects Freighter, saves a family member's Stellar address, amount, asset, and reminder date, then signs either a direct XLM/USDC payment or an XLM Soroban escrow release. Bakti verifies the on-chain transaction and records its hash.

Today the recipient must have a Stellar address. The reminder date does not trigger automatic payments, and the 60-ledger contract period is only a demo cadence. Bakti does not implement SEP-24, anchor SEP-10, an anchor API, KYC, provider quotes/status, provider deposit routing, cash pickup, or provider-confirmed collection.

The target next step is a certified integration with a licensed Stellar anchor (Lightnet and MoneyGram Ramps are the two candidates found so far, neither with a confirmed live Vietnam VND rail) for an interactive KYC and VND cash-out flow. That provider path is planned, not connected and not a partnership claim.

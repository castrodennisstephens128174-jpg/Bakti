# Bakti — Description

Bakti is a Stellar testnet prototype for Filipino workers in Malaysia planning salary-day support for family in the Philippines. A sender connects Freighter, saves a family member's Stellar address, amount, asset, and reminder date, then signs either a direct XLM/USDC payment or an XLM Soroban escrow release. Bakti verifies the on-chain transaction and records its hash.

Today the recipient must have a Stellar address. The reminder date does not trigger automatic payments, and the 60-ledger contract period is only a demo cadence. Bakti does not implement SEP-24, anchor SEP-10, MoneyGram APIs, KYC, provider quotes/status, provider deposit routing, cash pickup, or provider-confirmed collection.

The target next step is a certified integration with MoneyGram Ramps or another licensed Stellar anchor for an interactive KYC and PHP cash-out flow. That provider path is planned, not connected and not a partnership claim.

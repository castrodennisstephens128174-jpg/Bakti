# Bakti Pitch Deck — slides.md (source)
# Format: one line = one slide. 9 slides · 3 minutes · Hop Stellar 2026

# TITLE
Bakti | A monthly allowance your parents collect cash.
Hop Stellar · APAC Hackathon 2026 · Track A · Payments & Commerce

# THE MOMENT
"I always meant to send money to Ayah."
Dewi is an Indonesian caregiver in Singapore. Some months she remembers. Some months — between double shifts, the money slips away. When she forgets, her father stretches his medicine.
He doesn't use crypto. He uses the corner pickup shop.
Bakti isn't about transfer. It's about a standing allowance that lands every month, in trust.

# PROBLEM
Remittances reach wallets. They don't reach habits.
SEA diaspora sends >$100B/year home — much of it from children supporting elderly parents.
Support today is ad-hoc: depends on the sender remembering in a busy month.
Apps charge opaque fees; no clean audit when money lands.
Recipients are often elderly and cannot operate a wallet app.
A missed month is not abstract — it means skipped medicine or groceries.
Source: World Bank Migration & Remittances data (KNOMAD, 2024).

# MARKET
Philippines 2024: $38.6B personal remittances (Bangko Sentral ng Pilipinas).
+3% YoY. Cash remittances alone: $35.6B.
Top sources: Saudi Arabia, UAE, USA, Singapore, Hong Kong, UK.
Global average cost to send $200: ~6.5% (World Bank Remittance Prices Worldwide, 2024).
Malaysia is a top-10 outbound corridor; MY→PH flows through MoneyGram rails into PH cash-pickup.
Sources: bsp.gov.ph · remittanceprices.worldbank.org

# SOLUTION
A standing allowance that lands on a fixed day, in local cash.
Step 1 — Schedule. Sender signs one payment in Freighter: amount, corridor, day-of-month, recipient.
Step 2 — Escrow. BaktiEscrow (Soroban) holds the funds and releases one month at a time.
Step 3 — Anchor off-ramp. A Stellar SEP-24 anchor converts USDC to local fiat and issues a cash-pickup reference.
Step 4 — Pickup. The parent collects local cash at a MoneyGram pickup point. No wallet, no app on their side.
Non-custodial end-to-end. Bakti never holds keys or funds.

# FLOW
Sender → Freighter (signs schedule)
        → Soroban BaktiEscrow (release 1 month per call)
        → SEP-24 Anchor (USDC → local fiat, cash-pickup reference)
        → MoneyGram pickup point (parent collects cash)

# WHY STELLAR
Only chain where the last mile ends in cash.
Sub-cent fees: a $25 allowance is not eaten by rails ($0.0000027 per tx).
USDC on Stellar is natively issued by Circle — no bridged assets, no counterparty risk.
Soroban escrow: permissionless keeper release, auditable on-chain.
SEP-10 auth, SEP-23 muxed accounts, SEP-24 anchor off-ramp — standardized protocol, not proprietary lock-in.
Source: stellar.org/developers · stellar.org/case-studies/moneygram

# LIVE PROOF
Not a mockup. A real mainnet payout.
Live app: https://bakti-stellar.vercel.app
Soroban contract (mainnet): CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
On-chain release: https://stellar.expert/explorer/public/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2
Sign once. Watch the payout flip Due now → Cash ready.
Verify on stellar.expert — real, permanent receipt.

# THE ASK
Pilot anchor partner for SEP-24 integration, cash_pickup type.
Intro to one Philippines diaspora organization in the Gulf (Saudi / UAE).
Connections to PH remittance compliance reviewers.
Funding support for anchor integration legal review.
Contacts: GitHub issues @ castrodennisstephens128174-jpg/Bakti

# THANK YOU
A dignified monthly allowance for parents back home.
Built on Stellar · Live on mainnet · Ready to pilot.
https://bakti-stellar.vercel.app

# Bakti Pitch Deck
# Exactly 12 slides · Stellar APAC Hackathon 2026

# TITLE
Bakti
Plan salary-day support. Verify the transfer.
Filipino workers abroad, family in the Philippines
Stellar mainnet product · licensed cash-out is the next integration target

# WHAT WE HEARD
A friend's problem, then 200 more
THE COMPLAINT
A friend back home: sending money is a hassle
Parents don't know how to receive it
Conversion fees eat into every transfer
THE SURVEY, 200 OFW COMMUNITY MEMBERS
78% send money home every month
69% want an automatic payday schedule
78% would use wallet-free cash pickup
81% want clear proof the money was sent
Source: Bakti community survey, 200 respondents, Filipino overseas workers, 2026

# EVIDENCE
Corridor evidence: one anchor reaches every sending market
397,892 | Filipino workers in the UAE, 2025, the #1 destination
386,699 | Filipino workers in Saudi Arabia, 2025, #2
7.3% | Share of all 2025 PH cash remittances sent from Singapore, #2 source after the US
The same Philippines anchor also covers Hong Kong (202,415), Japan (60,748), South Korea (38,390), and Malaysia (35,052).
Only the receiving side needs a Stellar anchor. Wherever the sender is, they just need XLM/USDC sitting in their own wallet.
Source: DMW/OFW deployment reporting via businessmirror.com.ph; Bangko Sentral ng Pilipinas cash remittance data

# WHAT BAKTI DOES
In plain terms
Plan the send around payday
Sign it once, yourself
Family picks up PHP cash, no wallet
Money moves on Stellar in between. That's the whole idea.

# PRODUCT
Product today vs next
TODAY, WORKING
Freighter connection + custom signed manageData session (not SEP-10)
Support-plan records; reminder day is metadata only
XLM Soroban escrow/release with 60-ledger demo cadence
Direct XLM/USDC payment to a recipient address the sender enters and confirms
Horizon/RPC verification, SEP-7 direct pay link, recipient watcher
Status ends at Verified on-chain
NEXT, PLANNED
Licensed anchor/provider onboarding and agreements
SEP-1 + provider SEP-10 + hosted SEP-24
KYC, quote/limits, approved deposit routing, provider status
PHP cash-out, provider reference, provider-confirmed collection

# FLOW
One flow: solid is current, dashed is planned
Sender → Stellar transfer or XLM escrow → recipient Stellar wallet
Planned continuation: Anchor (PeraHub, SEP-31 confirmed on the Stellar directory, Bakti's connection is next) → PeraHub's 3,000+ Philippines branches → cash in hand, no wallet needed

# WHY
Why Stellar; why one anchor is enough
Architecture: only the receiving side needs a Stellar anchor. A sender in the UAE, Saudi Arabia, Singapore, or anywhere else just needs XLM/USDC in their own wallet, bought on any exchange. No separate integration per sending country. The Philippines is the one place Bakti needs a licensed cash-out partner.
Confirmed anchor: PeraHub, PETNET Inc.'s retail brand (BSP-regulated, UnionBank/UBX PH group, 3,000+ branches), is listed on Stellar's own anchor directory with SEP-31 support, USDC in, PHP or USD out, cash payout. SEP-31 is anchor-to-anchor, no wallet required on the recipient's side, a closer fit than a hosted webview. Bakti also emailed MoneyGram Ramps earlier (SEP-24, live in PH since 2021, no reply yet); PeraHub is the better-matched pick, outreach hasn't started.
Sources: anchors.stellar.org (PeraHub, SEP-31); perahub.com.ph (BSP regulation); developer.moneygram.com/integrate-moneygram-ramps

# USP
Why Bakti, not the alternatives
A one-off transfer versus a standing habit with proof attached
Cost to remit, % of amount sent: Banks (avg) 14.99% | Global average 6.36% | Cheapest available today 3.29% | Stellar network fee ~$0.00001/tx
Classic apps and bank transfers happen once: no standing plan, no proof beyond a receipt, and the recipient still needs a bank account or a wallet of their own. Bakti skips the wallet requirement on the recipient's side, gives the sender a Stellar transaction they can actually point to, and turns "did I remember this month" into a habit that's already set up. The network layer itself costs next to nothing; what's still missing is the anchor's own cash-out quote.
Source: World Bank Remittance Prices Worldwide, Q3 2025

# MARKET
The same demand, counted in dollars
The survey's 78% monthly senders, sized in dollars
TAM $9.3B: BSP 2025 remittances, 5 confirmed OFW markets
SAM $1.6B: cut down by each market's crypto-ownership rate (UAE 25.3%, Singapore 24.4%, Saudi Arabia 15.0%, Hong Kong 14.3%, Japan 4.0%)
SOM $16M: a 1% target slice for year one or two, a goal
Sources: Bangko Sentral ng Pilipinas cash remittance data, 2025; Triple-A, State of Global Cryptocurrency Ownership 2024

# MODEL
Revenue plan and a sequenced launch
BUSINESS MODEL
2% sender fee, bundled into the provider's quote
At SOM's $16M, roughly $300K a year
Later: revenue share with the anchor
Still open: fee tolerance, provider terms, unit economics
GO-TO-MARKET STRATEGY
Start with one corridor: Singapore to the Philippines
Land the PeraHub anchor connection first
Seed users through OFW community groups
Expand market by market as crypto access grows
Source: World Bank Remittance Prices Worldwide, Q3 2025

# STATUS
Phase 1 done, Phase 2 underway
PHASE 1, BUILT AND TESTED
Mainnet contract live and working well
Direct payment plus on-chain verification
Honest boundary: status stops at Verified on-chain
PHASE 2, IN PROGRESS NOW
Reaching out to PeraHub for early integration
Found via anchors.stellar.org: SEP-31, Philippines
Running the product, finding real users
Awaiting feedback
Contract live on Stellar mainnet since 2026-07-12: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR, stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

# VALUE
The target value, in one line
A sender signs once a month. Her mother just walks in and picks up cash — no wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet; the anchor connection is what gets us there.

# Bakti Pitch Deck
# Exactly 11 slides · Stellar APAC Hackathon 2026

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
Planned continuation: Anchor (PeraHub, SEP-31 confirmed on the Stellar directory, outreach not started) → PeraHub's 3,000+ Philippines branches → cash in hand, no wallet needed

# WHY AND WHO
One Philippines anchor serves every sending market
397,892 | Filipino workers in the UAE, 2025, the #1 destination
386,699 | Filipino workers in Saudi Arabia, 2025, #2
The same Philippines anchor also reaches Singapore (221,492), Hong Kong (202,415), Japan (60,748), South Korea (38,390), and Malaysia (35,052).
Only the receiving side needs a Stellar anchor; a sender anywhere just needs XLM/USDC in their own wallet.
CONFIRMED ANCHOR: PERAHUB
PeraHub (PETNET Inc., BSP-regulated, UnionBank/UBX PH, 3,000+ branches) is on Stellar's own directory with SEP-31: USDC in, PHP or USD out, cash payout.
SEP-31 needs no recipient wallet, a closer fit than a hosted webview.
Bakti emailed MoneyGram Ramps earlier (SEP-24, no reply); PeraHub outreach hasn't started yet.
Sources: DMW/OFW deployment reporting via businessmirror.com.ph; anchors.stellar.org (PeraHub, SEP-31); perahub.com.ph (BSP regulation); developer.moneygram.com/integrate-moneygram-ramps

# USP
Why Bakti, not the alternatives
A one-off transfer versus a standing habit with proof attached
Cost to remit, % of amount sent: Banks (avg) 14.99% | Global average 6.36% | Cheapest available today 3.29%
Classic apps and bank transfers happen once: no standing plan, no proof beyond a receipt, and the recipient needs a bank account or wallet. Bakti skips that, gives the sender a Stellar transaction to point to, and turns "did I remember" into a habit already set up. This chart is the classic-rail cost stack; Bakti's own total, a 2% fee plus whatever PeraHub charges to cash out, isn't on it, since PeraHub's rate isn't public yet.
Source: World Bank Remittance Prices Worldwide, Q3 2025

# MARKET
The same demand, counted in dollars
TAM $9.3B: BSP 2025 remittances, 5 of the 7 markets from the corridor chart (Korea and Malaysia aren't broken out by BSP)
SAM $1.6B: that same volume, cut down to senders who already hold crypto (UAE 25.3%, Singapore 24.4%, Saudi Arabia 15.0%, Hong Kong 14.3%, Japan 4.0%)
SOM $16M: a 1% target slice of SAM for year one or two, a goal, not a promise
Sources: Bangko Sentral ng Pilipinas cash remittance data, 2025; Triple-A, State of Global Cryptocurrency Ownership 2024

# MODEL
Revenue plan and a sequenced launch
BUSINESS MODEL
2% sender fee, bundled into the provider's quote
At SOM's $16M, roughly $300K a year
Later: revenue share with the anchor
Still open: fee tolerance, provider terms, unit economics
GO-TO-MARKET STRATEGY
Start in Singapore, with senders who already hold crypto, SAM's $1.6B
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
Running the product, finding real users
Next: reach out to PeraHub for early integration
Awaiting feedback
Contract live on Stellar mainnet since 2026-07-12: stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR

# VALUE
No wallet, no app, just cash in hand
A sender signs once a month. Their family just walks in and picks up cash, no wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet; the anchor connection is what gets us there.

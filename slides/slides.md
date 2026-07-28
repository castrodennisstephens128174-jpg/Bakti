# Bakti Pitch Deck
# Exactly 10 slides · Stellar APAC Hackathon 2026

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
THE SURVEY, 200 OFW COMMUNITY MEMBERS (OFW = Overseas Filipino Worker)
Q1 | Send money home every month? | 78% yes | Baseline demand
Q2 | Want a fixed schedule tied to payday? | 69% yes | Payday plan + reminder
Q3 | Pick up PHP cash with no wallet? | 78% yes | PeraHub cash-out target
Q4 | Want a receipt proving it was sent? | 81% yes | On-chain verified record
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
SEP-1/10/12/31 anchor flow integrated on Stellar testnet, tested end-to-end against a self-run reference anchor and Bakti's own anchor stub
Freighter connection + custom signed manageData session (not SEP-10)
XLM escrow holds funds; sender signs release to the recipient wallet, on mainnet
Direct XLM/USDC payments, Horizon/RPC verification, SEP-7 direct pay link, recipient watcher
Status ends at Verified on-chain
NEXT, PLANNED
Connect SEP-31 to a live receiving anchor (PeraHub) once onboarded
Support from anchors and the Stellar Foundation
Expand to other sending markets
PHP cash-out and provider-confirmed collection

# FLOW
One flow: solid is current, dashed is planned
Sender → Stellar transfer or XLM escrow → recipient Stellar wallet
Planned continuation: Anchor (PeraHub, SEP-31 confirmed on the Stellar directory) → PeraHub's 3,000+ Philippines branches → cash in hand, no wallet needed

# WHY AND WHO
One Philippines anchor serves every sending market
397,892 | Filipino workers in the UAE, 2025, the #1 destination
386,699 | Filipino workers in Saudi Arabia, 2025, #2
The same Philippines anchor also reaches Singapore (221,492), Hong Kong (202,415), Japan (60,748), South Korea (38,390), and Malaysia (35,052).
Only the receiving side needs a Stellar anchor; a sender anywhere just needs XLM/USDC in their own wallet.
CONFIRMED ANCHOR: PERAHUB
PeraHub (PETNET Inc., BSP-regulated, UnionBank/UBX PH, 3,000+ branches) is on Stellar's own directory with SEP-31: USDC in, PHP or USD out, cash payout.
SEP-31 needs no recipient wallet, a closer fit than a hosted webview.
Sources: DMW/OFW deployment reporting via businessmirror.com.ph; anchors.stellar.org (PeraHub, SEP-31); perahub.com.ph (BSP regulation); developer.moneygram.com/integrate-moneygram-ramps

# USP
Against the alternatives
A one-off transfer versus a standing habit with proof attached
Cost to remit, % of amount sent: Banks (avg) 14.99% | Global average 6.36% | Cheapest available today 3.29%
Classic apps and bank transfers happen once: no standing plan, no proof beyond a receipt, and the recipient needs a bank account or wallet. Bakti skips that. The sender gets a Stellar transaction to point to, and "did I remember" turns into a habit already set up. This chart is the classic-rail cost stack; Bakti's own total, a 2% fee plus whatever PeraHub charges to cash out, isn't on it, since PeraHub's rate isn't public yet.
Source: World Bank Remittance Prices Worldwide, Q3 2025

# MARKET
The same demand, counted in dollars
TAM (total market) $9.3B, SAM (reachable today) $1.6B, SOM (year-one target) $16M
TAM: yearly remittances from the 5 biggest sending markets we track
SAM: the part of that already sent by people who own crypto today
SOM: 1% of SAM, Bakti's own year-one goal, not a promise
Sources: BSP (Bangko Sentral ng Pilipinas) 2025 remittance data, 5 of 7 corridor markets; Triple-A, State of Global Cryptocurrency Ownership 2024

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

# VALUE
No wallet, no app, just cash in hand
A sender signs once a month. Their family walks into a branch and picks up cash — nothing to install, nothing about blockchain to learn. That part isn't built yet; the anchor connection is what gets us there.

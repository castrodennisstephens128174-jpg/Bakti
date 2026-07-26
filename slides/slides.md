# Bakti Pitch Deck
# Exactly 11 slides · Stellar APAC Hackathon 2026

# TITLE
Bakti
Plan salary-day support. Verify the transfer.
Filipino workers abroad, family in the Philippines
Stellar mainnet product · licensed cash-out is the next integration target

# THE MOMENT
"I meant to send it. The week got away from me."
Illustrative persona, not a claimed interview
Maria works in Singapore, one of over 221,000 Filipino workers there. Payday comes. Some months she remembers to send money home, some months a long shift pushes it to next week. She wants a standing plan she sets up once, then signs each month on a habit, not from memory.
Her mother, back home in the Philippines, has never used a banking app. What she actually wants is to walk in, show her ID, and leave with cash.
Today the recipient still needs a Stellar address, and Maria signs every transfer herself. Bakti does not send automatically. Cash pickup for her mother is the next milestone.

# EVIDENCE
Corridor evidence: one anchor reaches every sending market
397,892 | Filipino workers in the UAE, 2025, the #1 destination
386,699 | Filipino workers in Saudi Arabia, 2025, #2
7.3% | Share of all 2025 PH cash remittances sent from Singapore, #2 source after the US
The same Philippines anchor also covers Hong Kong (202,415), Japan (60,748), South Korea (38,390), and Malaysia (35,052).
Only the receiving side needs a Stellar anchor. Wherever the sender is, they just need XLM/USDC sitting in their own wallet.
Source: DMW/OFW deployment reporting via businessmirror.com.ph; Bangko Sentral ng Pilipinas cash remittance data

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
Planned continuation: Anchor (MoneyGram Ramps, live in PH since 2021, Bakti's connection is next) → MoneyGram's Philippines agent network → cash in hand, no wallet needed

# WHY
Why Stellar; why one anchor is enough
Architecture: only the receiving side needs a Stellar anchor. A sender in the UAE, Saudi Arabia, Singapore, or anywhere else just needs XLM/USDC in their own wallet, bought on any exchange. No separate integration per sending country. The Philippines is the one place Bakti needs a licensed cash-out partner.
Confirmed anchor: MoneyGram Ramps has been running in the Philippines since October 2021, one of the first four countries when MoneyGram launched this with Stellar, alongside Canada, Kenya, and the US. Funds land in MoneyGram's own Stellar account. The recipient just shows a reference number and photo ID to pick up cash, no wallet needed. What's still pending is Bakti's own connection to it: an email is out, no reply yet, nothing's confirmed as a partner.
Sources: stellar.org/case-studies/moneygram-international (2021 launch); developer.moneygram.com/integrate-moneygram-ramps

# USP
Why Bakti, not the alternatives
A one-off transfer versus a standing habit with proof attached
Cost to remit, % of amount sent: Banks (avg) 14.99% | Global average 6.36% | Cheapest available today 3.29% | Stellar network fee ~$0.00001/tx
Classic apps and bank transfers happen once: no standing plan, no proof beyond a receipt, and the recipient still needs a bank account or a wallet of their own. Bakti skips the wallet requirement on the recipient's side, gives the sender a Stellar transaction they can actually point to, and turns "did I remember this month" into a habit that's already set up. The network layer itself costs next to nothing; what's still missing is the anchor's own cash-out quote.
Source: World Bank Remittance Prices Worldwide, Q3 2025

# MARKET
Sizing the corridor: TAM $9.3B → SAM $1.6B → SOM $16M
TAM comes from 2025 cash-remittance volume in 5 of Bakti's 7 confirmed sending markets (UAE, Saudi Arabia, Singapore, Japan, Hong Kong); a floor, since BSP doesn't break out South Korea or Malaysia separately.
SAM applies each market's own crypto-ownership rate (UAE 25.3%, Singapore 24.4%, Saudi Arabia 15.0%, Hong Kong 14.3%, Japan 4.0%) to that volume, the senders who already hold crypto today.
SOM is a 1% slice of SAM to aim for in year one or two, a goal to work toward, not a promise.
Sources: Bangko Sentral ng Pilipinas cash remittance data, 2025; Triple-A, State of Global Cryptocurrency Ownership 2024

# MODEL
Where the fee comes from, and what we still don't know
BUSINESS MODEL HYPOTHESES
Main path: a sender-paid fee bundled into the provider's quote. At 2% (under the 6.36% world average), SOM's $16M works out to roughly $300K a year, a sanity check, not a projection we're standing behind
Also possible: provider referral or revenue share, where contracts and regulation allow it
Also possible: employer or worker-community distribution, paid by an organization instead of the individual sender
Still open: whether senders actually tolerate this fee, what a provider will share, and the real cost per transaction
GTM EXPERIMENTS
Interview Filipino workers abroad (any market) and family recipients in the Philippines
Test planning/reminder value before automation
Follow up on the MoneyGram Ramps email, without claiming a partnership
Map how senders in each market actually acquire XLM/USDC today (exchange on-ramps in UAE, Saudi Arabia, Singapore), the same senders SAM counts
Run testnet usability studies for signing, address safety, and proof

# STATUS
Build status + ask
BUILT
Contract itself: live on mainnet since 2026-07-12, creator key under review: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
Separately: a fresh, judge-facing demo transaction is pending, to be signed before submission
Direct payment verification; support-plan UI; honest status boundary
Current endpoints stop at Verified on-chain
NOT BUILT
SEP-24, anchor API/webview, KYC, provider routing/status/reference, PHP cash-out, automatic scheduling
ASK
Warm introduction to MoneyGram Ramps, or feedback on the outreach email already sent
Customer-discovery introductions among Filipino worker communities abroad
Feedback on the planning job before adding last-mile complexity
Proof: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR (testnet release history: contracts/DEPLOYMENT.md)

# VALUE
The target value, in one line
A sender signs once a month. Her mother just walks in and picks up cash — no wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet; the anchor connection is what gets us there.

# Bakti Pitch Deck
# Exactly 10 slides · Stellar APAC Hackathon 2026

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
Today the recipient still needs a Stellar address, and Maria signs every transfer herself. Bakti does not send automatically. Cash pickup for her mother is the target, not built yet.

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
Planned continuation: Anchor (MoneyGram Ramps, real and live in PH, Bakti's connection is next) → MoneyGram's Philippines agent network → cash in hand, no wallet needed

# WHY
Why Stellar; why one anchor is enough
Architecture: only the receiving side needs a Stellar anchor. A sender in the UAE, Saudi Arabia, Singapore, or anywhere else just needs XLM/USDC in their own wallet, bought on any exchange. No separate integration per sending country. The Philippines is the one place Bakti needs a licensed cash-out partner.
Confirmed anchor: MoneyGram Ramps is real and live. Been running in the Philippines since October 2021, one of the first four countries when MoneyGram launched this with Stellar, alongside Canada, Kenya, and the US. Funds land in MoneyGram's own Stellar account. The recipient just shows a reference number and photo ID to pick up cash, no wallet needed. What's still pending is Bakti's own connection to it: an email is out, no reply yet, nothing's confirmed as a partner.
Sources: stellar.org/case-studies/moneygram-international (2021 launch); developer.moneygram.com/integrate-moneygram-ramps

# USP
Why Bakti, not the alternatives
Classic remittance is transactional. Bakti is a standing habit with on-chain proof.
Cost to remit, % of amount sent: Banks (avg) 14.99% | Global average 6.36% | Cheapest available today 3.29% | Stellar network fee ~$0.00001/tx
Classic apps and bank transfers are one-off: no standing plan, no proof beyond a receipt, and the recipient still needs a bank account or a wallet of their own. Bakti's target is different on all three: no wallet needed on the recipient's side, a verifiable Stellar transaction the sender can point to, and a monthly habit instead of "did I remember this month." The network layer itself costs next to nothing; the number still missing is the anchor's own cash-out quote.
Source: World Bank Remittance Prices Worldwide, Q3 2025

# MODEL
Business model + GTM hypotheses, unvalidated
BUSINESS MODEL HYPOTHESES
Transparent sender service fee within a licensed provider quote, the world average cost to remit is 6.36% (World Bank, Q3 2025); target is to sit meaningfully under that
Provider referral/revenue share where permitted
Employer, cooperative, or worker-community distribution
No validated price, take rate, margin, or unit economics
GTM EXPERIMENTS
Interview Filipino workers abroad (any market) and family recipients in the Philippines
Test planning/reminder value before automation
Follow up on the MoneyGram Ramps email, without claiming a partnership
Map how senders in each market actually acquire XLM/USDC today (exchange on-ramps in UAE, Saudi Arabia, Singapore)
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
A sender signs once a month. Her mother just walks in and picks up cash. No wallet, no app to install, nothing about blockchain to figure out. That part isn't built yet. It's exactly what the anchor connection is for.

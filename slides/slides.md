# Bakti Pitch Deck
# Exactly 8 slides · Hop Stellar 2026

# TITLE
Bakti
Plan salary-day support. Verify the transfer.
Filipino workers in Malaysia → family in the Philippines
Stellar mainnet product · licensed cash-out is the next integration

# PERSONA
Human problem / target persona
Illustrative persona — not a claimed interview
Maria is a Filipino service worker in Kuala Lumpur. Around salary day she wants to set aside support for her mother in the Philippines, remember the commitment, and know where the transfer went.
Today she still needs her mother's Stellar address. Maria signs every transfer; Bakti does not send automatically.
Job: make family support intentional, legible, and verifiable.

# EVIDENCE
Corridor evidence — signal, not TAM
US$35.634B | Philippines cash remittances, 2025 preliminary
US$675.153M | Malaysia-attributed Philippine cash remittances, 2025 provisional
Jan–May 2026 already US$279.807M Malaysia-attributed cash.
BSP source-country attribution is the immediate source of funds, not necessarily true origin.
Source: BSP https://www.bsp.gov.ph/statistics/external/ofw.aspx and https://www.bsp.gov.ph/statistics/external/ofw2.aspx

# PRODUCT
Product today vs next
TODAY — WORKING
Freighter connection + custom signed manageData session (not SEP-10)
Support-plan records; reminder day is metadata only
XLM Soroban escrow/release with 60-ledger demo cadence
Direct XLM/USDC payment to entered recipient address
Horizon/RPC verification, SEP-7 direct pay link, recipient watcher
Status ends at Verified on-chain
NEXT — PLANNED
Licensed anchor/provider onboarding and agreements
SEP-1 + provider SEP-10 + hosted SEP-24
KYC, quote/limits, approved deposit routing, provider status
PHP cash-out, provider reference, provider-confirmed collection

# FLOW
One flow — solid is current, dashed is planned
Sender → Bakti plan → Stellar transfer or XLM escrow → recipient Stellar wallet
Planned continuation: Stellar/provider deposit → licensed anchor → KYC → PHP cash-out → family member

# WHY
Why Stellar; why the provider path
Freighter keeps transaction signing with the sender.
Horizon and Soroban RPC make the implemented transfers inspectable.
Soroban demonstrates pre-funded XLM release rules.
Stellar anchors connect network assets to off-chain rails.
SEP-24 is a hosted interactive deposit/withdrawal flow with anchor authentication and KYC.
MoneyGram Ramps is a target path, not a partner: integration requires allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, and agreements.
MoneyGram limits, three sources disagree: docs 5–950 on-ramp/5–2,500 off-ramp USDC; live endpoint floors at 1; certification tier caps 10–20 (100 aggregate). Malaysia and Philippines are both cash-out only — no MY salary cash-in route exists today.
Sources: Stellar anchors/SEP-24 docs; MoneyGram Ramps integration docs

# MODEL
Business model + GTM hypotheses — unvalidated
BUSINESS MODEL HYPOTHESES
Transparent sender service fee within a licensed provider quote
Provider referral/revenue share where permitted
Employer, cooperative, or worker-community distribution
No validated price, take rate, margin, or unit economics
GTM EXPERIMENTS
Interview Filipino workers in Malaysia and family recipients
Test planning/reminder value before automation
Map compliant Malaysia funding and Philippines payout partners
Run testnet usability studies for signing, address safety, and proof
Seek provider sandbox/certification conversations without claiming partnership

# STATUS
Build status + ask
BUILT
Deployed on mainnet, creator key under review: CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
Mainnet release transaction: pending — to be signed before submission
Direct payment verification; support-plan UI; honest status boundary
Current endpoints stop at Verified on-chain
NOT BUILT
SEP-24, MoneyGram API/webview, KYC, provider routing/status/reference, PHP cash-out, automatic scheduling
ASK
Customer-discovery introductions in Malaysia
Anchor review: confirm third-party cash pickup (no recipient wallet/KYC) and a Malaysia MYR on-ramp path
Feedback on the planning job before adding last-mile complexity
Help mapping a compliant Malaysia funding → Philippines payout path
Proof: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR (testnet release history: contracts/DEPLOYMENT.md)

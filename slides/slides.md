# Bakti Pitch Deck
# Exactly 9 slides · Hop Stellar 2026

# TITLE
Bakti
Plan salary-day support. Verify the transfer.
Filipino workers in Malaysia → family in the Philippines
Stellar testnet prototype · licensed cash-out is the next integration

# PERSONA
Human problem / target persona
Illustrative persona — not a claimed interview
Maria is a Filipino service worker in Kuala Lumpur. Around salary day she wants to set aside support for her mother in the Philippines, remember the commitment, and know where the transfer went.
Today she still needs her mother's Stellar address. Maria signs every transfer; Bakti does not send automatically.
Job: make family support intentional, legible, and verifiable.

# EVIDENCE
Corridor evidence — signal, not TAM
US$39.619B | Philippines personal remittances, 2025 preliminary
US$35.634B | Philippines cash remittances, 2025 preliminary
US$675.153M | Malaysia-attributed Philippine cash remittances, 2025 provisional
Jan–May 2026: US$15.735B personal; US$14.110B cash; US$279.807M Malaysia-attributed cash.
BSP source-country attribution is the immediate source of funds, not necessarily true origin.
Source: BSP https://www.bsp.gov.ph/statistics/external/ofw.aspx and https://www.bsp.gov.ph/statistics/external/ofw2.aspx

# CUSTOMER
Customer and job to be done
Customer | Filipino worker in Malaysia with a Stellar wallet
Recipient today | Family member with a Stellar address in the Philippines
Trigger | Salary day or another chosen planning date
Functional job | Store recipient + amount + date, then sign a transfer
Emotional job | Feel responsible without pretending the transfer is automatic
Evidence job | Open a real transaction hash and verify the destination
Research next | Recipient cash preference, funding rail, provider trust, compliance path

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
No current MoneyGram partnership or connected cash route

# FLOW
One flow — solid is current, dashed is planned
Sender → Bakti plan → Stellar transfer or XLM escrow → recipient Stellar wallet
Planned continuation: Stellar/provider deposit → licensed anchor → KYC → PHP cash-out → family member
Current product requires the recipient wallet address.
No provider destination, pickup reference, or automatic monthly scheduler is wired.

# WHY
Why Stellar; why the provider path
Freighter keeps transaction signing with the sender.
Horizon and Soroban RPC make the implemented transfers inspectable.
Soroban demonstrates pre-funded XLM release rules.
Stellar anchors connect network assets to off-chain rails.
SEP-24 is a hosted interactive deposit/withdrawal flow with anchor authentication and KYC.
MoneyGram Ramps is a target path, not a partner: integration requires allowlisting, SEP-1, SEP-10, SEP-24, KYC fields, testing/certification, KYB/compliance, and agreements.
Published MoneyGram off-ramp range: 5–2,500 USDC. Malaysia and Philippines are listed cash-out only; this does not prove a MY salary cash-in route.
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
Verified Stellar testnet contract: CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ
Verified testnet Freighter-signed release: cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2
Direct payment verification; support-plan UI; honest status boundary
NOT BUILT
SEP-24, MoneyGram API/webview, KYC, provider routing/status/reference, PHP cash-out, automatic scheduling
ASK
Customer-discovery introductions in Malaysia
Licensed anchor/provider technical and compliance review
Feedback on the planning job before adding last-mile complexity
Proof: https://stellar.expert/explorer/testnet/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2

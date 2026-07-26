# Bakti Pitch Deck
# Exactly 10 slides · Stellar APAC Hackathon 2026

# TITLE
Bakti
Plan salary-day support. Verify the transfer.
Vietnamese workers abroad → family in Vietnam
Stellar mainnet product · licensed cash-out is the next integration

# THE MOMENT
"I meant to send it. The week got away from me."
Illustrative persona — not a claimed interview
Linh works a factory shift in Japan, one of over 700,000 Vietnamese on labor contracts abroad. Some months she remembers to send money home; some months a double shift pushes it to next week.
She doesn't want to "remember to send." She wants a standing plan she sets up once, then signs each month on a habit — not from memory.
Her mother, back home, has never used a banking app — a wallet address is not something Linh can ask her to learn. The real prize isn't the transfer. It's her mother collecting cash without touching a screen.
Today the recipient still needs a Stellar address, and Linh signs every transfer herself — Bakti does not send automatically. Cash pickup for her mother is the target, not built yet.

# EVIDENCE
Corridor evidence — signal, not TAM
700,000+ | Vietnamese on labor contracts abroad
US$3.5–4B | Remitted by contract workers per year
US$10.34B | Remittances to HCMC alone, 2025 (+8.3% YoY)
Where the workers are (new deployments, 2024): Japan 62,722 · Taiwan 48,533 · Korea 10,877 — the three markets Vietnam's labor program has run longest.
No public source breaks HCMC's remittance dollars down by sending country. Worker-deployment counts and the Asia-origin remittance total are two different figures, not one TAM.
Source: MOLISA via VietnamPlus/SGGP; baochinhphu.vn; kinhtevadubao.vn

# PRODUCT
Product today vs next
TODAY — WORKING
Freighter connection + custom signed manageData session (not SEP-10)
Support-plan records; reminder day is metadata only
XLM Soroban escrow/release with 60-ledger demo cadence
Direct XLM/USDC payment to a recipient address the sender enters and confirms
Horizon/RPC verification, SEP-7 direct pay link, recipient watcher
Status ends at Verified on-chain
NEXT — PLANNED
Licensed anchor/provider onboarding and agreements
SEP-1 + provider SEP-10 + hosted SEP-24
KYC, quote/limits, approved deposit routing, provider status
VND cash-out, provider reference, provider-confirmed collection

# FLOW
One flow — solid is current, dashed is planned
Sender → Bakti plan → Stellar transfer or XLM escrow → recipient Stellar wallet
Planned continuation: Stellar → licensed anchor (SEP-24 cash-out, target not connected) → KYC → VND cash-out → family member

# WHY
Why Stellar; why these provider candidates
Why this customer: 700,000+ Vietnamese already on formal labor contracts abroad; government-brokered placement means recurring, predictable monthly income; Japan/Taiwan/Korea are the longest-running, largest programs.
Freighter keeps transaction signing with the sender.
Horizon and Soroban RPC make the implemented transfers inspectable.
Soroban demonstrates pre-funded XLM release rules.
Stellar anchors connect network assets to off-chain rails.
SEP-24 is a hosted interactive deposit/withdrawal flow with anchor authentication and KYC.
Lightnet is listed on Stellar's own Anchor Directory with Vietnam in its 150+ country coverage and SEP-24 support, but its stellar.toml 404s — unverified today.
MoneyGram Ramps is a real, live Stellar anchor. Funds settle to MoneyGram's own Stellar address; the recipient collects cash via phone number/code + ID, no wallet needed on their side — this exact pattern already runs in Kenya, Philippines, and Mexico (chaingain.io independent analysis), just not confirmed for Vietnam yet.
Neither is a confirmed partner yet — Bakti is currently reaching out to both.
Sources: anchors.stellar.org (Anchor Directory); Stellar anchors/SEP-24 docs; MoneyGram Ramps integration docs

# RAILS
Vietnam is already building the rails — cash infrastructure exists, regulation is catching up
Classic MoneyGram runs cash-pickup agents across Vietnam today — reference number + photo ID, no account needed. Unconfirmed: whether MoneyGram Ramps, the Stellar bridge, routes into that same Vietnam agent network.
Vietnam's Resolution 05/2025/NQ-CP (Sep 2025) opened a 5-year regulated crypto pilot — VND-only settlement, up to 5 licensed exchanges. CAEX is a shortlisted candidate, backed by OKX Ventures and HashKey Capital — not a confirmed Stellar anchor.
Sources: moneygram.com/intl/com-vn/en; Resolution 05/2025/NQ-CP (ssc.gov.vn); fintechnews.sg (CAEX investment)

# MODEL
Business model + GTM hypotheses — unvalidated
BUSINESS MODEL HYPOTHESES
Transparent sender service fee within a licensed provider quote
Provider referral/revenue share where permitted
Employer, cooperative, or worker-community distribution
No validated price, take rate, margin, or unit economics
GTM EXPERIMENTS
Interview Vietnamese contract workers in Japan/Taiwan/Korea and family recipients
Test planning/reminder value before automation
Currently reaching out to Lightnet and MoneyGram about a Vietnam VND rail
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
SEP-24, anchor API/webview, KYC, provider routing/status/reference, VND cash-out, automatic scheduling
ASK
Warm introduction to Lightnet or MoneyGram about a Vietnam VND rail
Customer-discovery introductions among Vietnamese worker communities in Japan/Taiwan/Korea
Feedback on the planning job before adding last-mile complexity
Proof: https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR (testnet release history: contracts/DEPLOYMENT.md)

# VALUE
The value, in one line
A sender signs once a month. Her mother walks in and collects the cash — no wallet, no app, no blockchain to learn. That last part isn't built yet; it's what the anchor connection is for.

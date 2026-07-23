# Bakti Pitch Deck — slides.md (source)
Format: one line = one slide.

---

# TITLE
Bakti | A monthly allowance your parents collect as cash.
Stellar APAC Hackathon 2026 · Track A

# THE MOMENT
"I always meant to send money to Ayah."
Dewi is an Indonesian caregiver in Singapore.
Some months she remembers to send money home.
Some months she forgets — between double shifts, it slips away.
When she forgets, her father stretches his medicine.
He doesn't use crypto. He uses the corner pickup shop.
Bakti
Dewi doesn't want a transfer. She wants a standing allowance she can trust to land every month.

# WHAT SHE NEEDS
A fixed amount on a fixed day.
Proof it actually arrived.
Cash her parents can collect locally.

# THE PROBLEM
Remittances reach the wallet. They don't reach the habit.
SEA takes in over $100B a year in remittances — much of it children supporting elderly parents.
Support is ad-hoc: it depends on the sender remembering in a busy month.
Apps charge opaque fees. No clean audit of what landed.
The recipient is often elderly and cannot use a wallet or an app.
A missed month is not abstract — it is skipped medicine or groceries.
The people who most need predictable income are the least able to manage crypto.

# MARKET
Philippines 2024 inflow: $38 billion USD (World Bank / KNOMAD).
Forecast 2025: $38.3 billion. Trajectory: $40 billion by 2026.
Top sources: Saudi Arabia, UAE, USA, Singapore, Hong Kong, Qatar, Kuwait, Japan, UK, Canada.
Malaysia sends $10–12 billion a year to PH, ID, BD, NP, IN.
MY–PH is the densest single intra-Asia remittance lane.
Average global cost of sending $200: 6.4% (WB Remittance Prices Q4 2024).

# CUSTOMER
Sender: OFW or contract worker, 25–45 years old.
Has a bank or mobile money account abroad. Comfortable with a Stellar wallet.
Receiver: parent, 55–75 years old.
No smartphone. No bank account. No crypto.
Dignity matters: no complex apps, no seed phrases.

# THE SOLUTION
Bakti = a standing order. One Stellar payment per month. Parent collects local cash.
Step 1: Add a parent. Name, Stellar address, corridor, amount, payout day.
Step 2: Sign the month. One XLM or USDC payment signed in your own wallet.
Step 3: Anchor off-ramps. A cash-pickup reference is issued (demo mode until live anchor signs).
Step 4: They collect. Local cash in hand — no wallet, no crypto on their side.
Non-custodial the whole way: Bakti never holds your keys or your funds.

# THE FLOW
Sender signs one payment in Freighter (SEP-10).
BaktiEscrow Soroban contract holds and releases one month per call.
SEP-23 muxed account attributes the deposit to this family.
SEP-24 anchor off-ramps to a cash-pickup reference.
Parent collects at a local pickup point near them.

# WHY STELLAR
The only chain where this ends in cash.
Anchors and SEP-24: a real standardized path from stablecoin to local cash pickup.
Sub-cent fees: a $25 allowance is not eaten by the rails.
SEP-10 and SEP-23: auth and per-family attribution built into the protocol.
USDC on Stellar: natively issued by Circle. No bridged assets. No counterparty risk.
Soroban escrow: permissionless keeper release. Non-custodial. Auditable on-chain.

# ARCHITECTURE
Client: React + Freighter wallet signs create_schedule and each release.
Contract: BaktiEscrow on Soroban — pre-funds the run, releases one month per call.
Off-ramp: SEP-24 anchor issues pickup reference; SEP-23 attributes it per family.
Tech: Next.js 16, React 19, TypeScript, Stellar SDK, Soroban, Rust, Drizzle, Postgres.

# LIVE PROOF
Not a mockup. A real mainnet payout.
Live app: bakti-stellar.vercel.app
Soroban contract (mainnet): CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR
On-chain release: cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2
stellar.expert/explorer/public/tx/cfa17a939f5cd0c90bc674d7cee61f0f4a67ed4c2f11ab3c789b0e3ad0c419d2
Signed by a real Freighter wallet, verified against Horizon, off-ramped to a cash-pickup reference.

# ANCHOR INTEGRATION
SEP-24: standardized off-ramp. Bakti is the SEP-24 wallet client.
SEP-10: user signs the challenge; Bakti server exchanges it for an anchor JWT.
POST /withdraw/interactive: Bakti sends destination (muxed), asset, amount.
GET /transaction: polls until status=completed; pickup_ref = transaction_id.
Target anchor: Coins.ph (Philippines, Bangko Sentral ng Pilipinas registered VASP).
Off-ramp is demo until a live SEP-24 anchor signs a partnership.

# TRY IT YOURSELF
Open the app: bakti-stellar.vercel.app → Dashboard → Connect Freighter (mainnet).
Add a parent: paste a funded mainnet address, set a small XLM amount.
Send this month: sign once. Watch the payout flip Due now → Cash ready.
Verify: open the transaction on stellar.expert — a real, permanent receipt.

# WHY US / WHY NOW
Receiver stays non-crypto-native — dignity preserved at every step.
Standing order vs. one-off: predictability changes parent finances.
On-chain receipt is the audit trail — provable, not opaque.
Built on Stellar: any Stellar wallet works. No proprietary lock-in.
Anchor off-ramp standard: swap partner without changing code.
Demo live on Stellar mainnet. Pilot anchor in progress.

# BUSINESS MODEL
Target: take rate on the on-ramp leg once fiat partner signs.
Anchor referral fee: Bakti drives users to SEP-24 partners.
Target all-in cost to sender: 2% or less.
Compare: global average 6.4%, traditional wire 8–12%.
Bakti never holds funds. Non-custodial by design.

# GO-TO-MARKET
Philippines first: Coins.ph ecosystem, OFW Facebook groups, diaspora orgs, remittance clinics in Saudi Arabia and UAE.
Malaysia to Philippines second: existing high-volume corridor, mature, competitive.
Indonesia, Vietnam, Thailand: expansion after anchor coverage confirmed per corridor.

# ROADMAP
Now: Stellar mainnet live with anchor demo.
30 days: pilot with one Philippines anchor.
90 days: second corridor live.
180 days: licensed Malaysia rail via local e-money partner.
Year 1: 5 corridors, 1,000 active allowances, 10 anchor partnerships.

# THE ASK
Pilot anchor partner: SEP-24 integration with cash_pickup type.
Intro to one Philippines diaspora organization in the Gulf.
Introductions to PH remittance compliance contacts.
Funding to support anchor integration and legal review.

# THANK YOU
A dignified monthly allowance for the parents back home.
bakti-stellar.vercel.app
Stellar APAC Hackathon 2026 · Track A — Payments & Commerce

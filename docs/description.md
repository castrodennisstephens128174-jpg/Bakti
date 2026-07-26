# Bakti — Description

Bakti is a dignified monthly allowance for parents back home, sent on Stellar and
collected as local cash. A working adult abroad sets up a standing plan: amount,
payout day, and recipient. Each month they sign one Stellar transaction. The
anchor off-ramps the funds to a cash-pickup reference; the parent collects at a
pickup point without needing a smartphone or a crypto wallet.

Built on Stellar mainnet with a Soroban BaktiEscrow contract backing XLM
allowances. USDC allowances use classic Horizon-verified payments. Wallet
login uses Bakti's own signed challenge (not SEP-10 — no anchor JWT), and
SEP-23 muxed attribution and SEP-7 pay links are wired. The end-to-end flow —
sign, verify, off-ramp, cash pickup — has been proven on testnet. The SEP-24
off-ramp is implemented to the published spec and runs against a simulated
anchor; integration targets are MoneyGram Access and Coins.ph, and going live
is a config swap, not a rewrite.

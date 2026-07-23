<div align="center">

## 🌐 Mainnet (LIVE)

- **Live app:** https://bakti-sooty.vercel.app
- **Network:** Stellar public (mainnet)
- **Soroban contract:** `CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR`
- **Explorer:** https://stellar.expert/explorer/public/contract/CBVAZDK2GAX5MJ7SSSQKRLY33TO7Q6DG3ZGZK6WMZSGI63XRMIR2CTHR


# 🫶 Bakti — a monthly allowance your parents collect as cash

**Turn easy-to-forget remittances into a steady, provable monthly income for the elderly parents back home. You sign one Stellar payment a month; they walk into a cash pickup point with a reference code and take home local money — no wallet, no crypto on their side.**

![Stellar](https://img.shields.io/badge/Stellar-Public-0284c7)
![Soroban](https://img.shields.io/badge/Soroban-BaktiEscrow-7c3aed)
![SEP-10](https://img.shields.io/badge/Auth-SEP--10-075985)
![SEP-24](https://img.shields.io/badge/Off--ramp-SEP--24-0369a1)
![Asset](https://img.shields.io/badge/Asset-XLM%20%2F%20USDC-16803d)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Mainnet-ready](https://img.shields.io/badge/Mainnet--ready-network--aware-d97706)

**Live demo → https://bakti-sooty.vercel.app**

<img src="screen-shot/01-landing.jpg" width="780" alt="Bakti landing — send your parents a monthly allowance they collect as cash" />

<img src="screen-shot/02-dashboard.jpg" width="390" alt="Dashboard — standing allowances in a data table" /> <img src="screen-shot/04-allowance-detail.jpg" width="390" alt="Allowance detail — real on-chain payout, HANA pickup reference, SEP-23 muxed attribution" />

<img src="screen-shot/05-stats.jpg" width="390" alt="Live stats" /> <img src="screen-shot/06-mobile.jpg" width="250" alt="Mobile landing at 375px" />

<sub>Landing → dashboard of standing allowances → an allowance with a real, Horizon-verified payout and a cash-pickup reference → live stats → mobile.</sub>

</div>

---

## What is Bakti?

Across Southeast Asia, children working abroad support elderly parents back home. The support is real, but the delivery is chaotic — it depends on the sender remembering, on remittance apps with opaque fees, and on a parent who cannot use a wallet. A missed month means a parent skips medicine or groceries.

Bakti is a standing-order layer built on **classic Stellar primitives**. A working child sets up an allowance once — the parent's Stellar address, a pickup corridor, an asset, a monthly amount, and a payout day. Each month they sign **one real payment**, which the server verifies against Horizon before recording. An anchor off-ramps the deposit into a **MoneyGram / Hana cash-pickup reference** (SEP-24), and the parent collects local cash. The on-chain receipt and the cash reference come from the same verified transaction, so support is both provable and collectable.

## 🔁 How it works

1. **Connect** — link a Stellar wallet. Bakti proves ownership with a SEP-10 challenge (a signed, non-submitted transaction), pinned to testnet whatever the wallet's active network.
2. **Add a parent** — name them, paste their Stellar address, pick a pickup corridor, an asset (XLM by default, USDC opt-in), a monthly amount, and a payout day.
3. **Sign the month** — one tap sends the allowance as a single payment. The server re-derives and verifies it against Horizon before recording anything.
4. **Off-ramp** — the anchor issues a cash-pickup reference (SEP-24), attributed per family with a SEP-23 muxed address; a Horizon SSE stream shows the payment landing.
5. **Collect** — the parent takes the reference to a pickup point and walks out with local cash. The sender confirms it collected.

## ✨ Highlights

- **🔒 Non-custodial** — you sign every payment in your own wallet. Bakti never holds keys or funds.
- **⛓️ Provable, not opaque** — every monthly payout is a real Stellar transaction, verified against Horizon and linked to its receipt on stellar.expert.
- **💵 Cash at the other end** — the SEP-24 off-ramp turns USDC/XLM into a MoneyGram or Hana pickup code, so a parent who never touches crypto still gets local money.
- **🧬 SEP-23 muxed attribution** — one anchor account serves every family; each allowance gets its own muxed deposit reference.
- **📱 SEP-7 pay link** — pay a month by QR from any Stellar wallet.
- **🪙 XLM-first, USDC opt-in** — a one-tap changeTrust enables USDC, so you're never stranded at `op_no_trust`.
- **🗓️ Predictable** — a standing plan with a fixed amount and payout day, so support never gets forgotten in a busy month.

## ⛓️ The on-chain flow — Soroban contract (XLM) + classic (USDC)

Bakti ships a **BaktiEscrow Soroban contract** (`source-code/contracts/bakti-escrow`) that backs the XLM allowance path: the sender pre-funds the whole run (`monthly_amount * months`) into the contract's own escrow at `create_schedule`, and each monthly send is a permissionless `release` that pays exactly one period from that escrow to the recipient. USDC allowances stay on the classic Horizon-verified payment path (see below) — the contract binds a single escrow token (native XLM SAC) at `initialize`.

Contract id (Stellar testnet): `CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ`
Explorer: https://stellar.expert/explorer/testnet/contract/CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ

| Primitive | Role in Bakti |
| --- | --- |
| BaktiEscrow (Soroban) | `create_schedule` escrows an XLM allowance's full run; `release` is a permissionless keeper call that pays one due period to the recipient |
| SEP-10 | Wallet login via a signed challenge transaction |
| Payment (USDC classic path) | The monthly allowance, signed once by the sender, verified against Horizon |
| Horizon verification | Server re-derives and confirms each classic (USDC) payout on-chain before recording |
| Soroban RPC | Server assembles/simulates contract invokes for the sender/keeper to sign, then submits and polls to `SUCCESS` |
| SEP-23 muxed accounts | Per-allowance attribution on one anchor collection account |
| SEP-24 | Interactive off-ramp to a local cash-pickup reference (testnet simulation) |
| SEP-7 | Payment request URI for QR pay from any wallet |
| Horizon SSE | Live settlement indicator on the allowance page |

`LEDGERS_PER_PERIOD = 60` (~5 minutes of testnet ledgers) is a deliberate testnet-demo cadence, not a real 30-day month — see `source-code/contracts/bakti-escrow/src/lib.rs` and `docs/technical-flow.txt`.

> **Testnet honesty:** the contract escrow and every payment are real on Stellar testnet. The cash-pickup step (MoneyGram / Hana) is a clearly-labeled simulation of a SEP-24 anchor off-ramp — the reference code is what a live anchor would issue.

## FRONTEND → CONTRACT WIRING (where to look)

Every controller endpoint that triggers an on-chain action traces to a `BaktiEscrow` entry point by name. No orphan endpoints.

```
POST /api/allowances/escrow-intent           -> buildEscrow    -> create_schedule (build)
POST /api/allowances (signedXdr)             -> createEscrowed  -> create_schedule (submit)
POST /api/allowances/:id/release-intent      -> buildRelease    -> release (build)
POST /api/allowances/:id/payouts (signedXdr) -> recordRelease   -> release (submit)
```

**FILE: `src/server/stellar/contract.ts`** — the raw Soroban invoke via `new Contract(id).call(...)`:

```ts
export async function buildCreateScheduleXdr(params: {
  ...
}): Promise<{ xdr: string; firstDueLedger: number }> {
  const op = baktiContract().call(
    'create_schedule',
    new Address(params.sender).toScVal(),
    new Address(params.recipient).toScVal(),
    nativeToScVal(toStroops(params.monthlyAmount), { type: 'i128' }),
    nativeToScVal(params.months, { type: 'u32' }),
    nativeToScVal(firstDueLedger, { type: 'u32' }),
  );
  const xdrStr = await assembleForSigning(params.sender, op);
  return { xdr: xdrStr, firstDueLedger };
}
export async function buildReleaseXdr(params: { caller: string; scheduleId: string }): Promise<string> {
  const op = baktiContract().call(
    'release',
    nativeToScVal(BigInt(params.scheduleId), { type: 'u64' }),
    new Address(params.caller).toScVal(),
  );
  return assembleForSigning(params.caller, op);
}
// baktiContract() = new Contract(contractIds.bakti)
//   contractIds.bakti === 'CATFEIDC4CQ3ZSYTWAEM4SHWUB5ZK4R7VGE5QO6XDWRQ6UC4ZLB34VCQ'
```

**FILE: `src/server/service/allowance.service.ts`** — submits the signed `create_schedule`, then persists the on-chain schedule id:

```ts
async createEscrowed(
  publicKey: string,
  input: AllowanceInput,
  signedXdr: string,
): Promise<AllowanceWithPayouts> {
  assertAllowanceInput(input);
  if (input.asset !== 'XLM') {
    throw new AppError('INVALID_INPUT', 'The escrow contract holds XLM; use XLM for on-chain.', 400);
  }
  const { hash, scheduleId } = await submitCreateSchedule(signedXdr);
  return insertAllowanceWithFirstPayout(publicKey, input, {
    scheduleId,
    contractId: contractIds.bakti,
    escrowTxHash: hash,
  });
}
```

**FILE: `src/server/service/payout.service.ts`** — submits the signed `release` (RPC confirms it landed), then walks the payout to settled:

```ts
async recordRelease(
  allowanceId: string,
  publicKey: string,
  data: { signedXdr: string },
): Promise<Payout> {
  const { hash } = await submitSorobanSigned(data.signedXdr);

  const duplicate = await payoutRepo.findByTxHash(hash);
  if (duplicate) return duplicate;

  const scheduled = await payoutService.ensureScheduled(allowanceId, publicKey);
  const period = scheduled.period;

  nextPayoutStatus(scheduled.status, 'send');
  await payoutRepo.update(scheduled.id, {
    status: 'sent',
    txHash: hash,
    memo: `Bakti allowance ${period} (contract release)`,
  });

  nextPayoutStatus('sent', 'settle');
  const pickupRef = makePickupRef(allowance.corridor, period);
  return payoutRepo.update(scheduled.id, { status: 'settled', pickupRef });
}
```

USDC allowances never reach these functions — they stay on the classic Horizon-verified payment path (`payoutService.recordPayment` + `verifyAllowancePayment`), because the contract binds a single XLM SAC escrow token at `initialize`.

## 🧱 Tech stack

- **Soroban / Rust** — `bakti-escrow` contract (`source-code/contracts`), `soroban-sdk` 22
- **Next.js 16** (App Router) · **React 19** · **TypeScript** strict
- **@stellar/stellar-sdk** (Horizon + Soroban RPC) + **Freighter** for signing
- **Drizzle ORM** on **Postgres**
- **Tailwind CSS v4** · **lucide-react** icons · **Manrope + Fraunces** type
- **Vitest** (unit + component, service coverage) · **Playwright** (a11y + real-Freighter e2e)
- **Network-aware:** flip `NEXT_PUBLIC_STELLAR_NETWORK` from `testnet` to `public` to go mainnet.

## 🚀 Quick start (local dev)

```bash
pnpm install
cp .env.example .env.local
# set DRIZZLE_DATABASE_URL and a 32+ char SESSION_SECRET in .env.local
pnpm run db:push        # create the tables
pnpm run seed           # Indonesian persona + one real testnet payout
pnpm run dev            # http://localhost:3005
```

One-command demo: `pnpm run demo` (push + seed + dev).

## 🗺️ Project structure

```
app/                     Next.js routes
  api/                   auth (SEP-10), allowances, payouts, stats, health
  dashboard/  stats/  allowances/[id]/
src/server/
  service/               allowance + payout state machines, auth, stats
  db/  repos/  schema/   Drizzle repos + tables (allowances, payouts, sessions)
  stellar/               horizon verify, SEP-23 muxed, SEP-7 pay URI, network
  middleware/            error, rate-limit, auth
src/ui/                  wallet provider, Freighter client, components
scripts/                 seed-demo, capture-screens
tests/                   unit (services) + e2e (main-flow, prod-real Freighter)
docs/                    SUBMISSION, design, technical-flow, description (plain text)
```

<div align="center">
<sub>Bakti · a monthly allowance for the parents back home · built on Stellar · testnet</sub>
</div>

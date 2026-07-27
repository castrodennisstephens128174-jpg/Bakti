# SEP-31 testnet anchor stand-in

Runs Stellar's own [Anchor Platform](https://github.com/stellar/anchor-platform)
(the same software real SEP-31 anchors run) locally, on Stellar testnet, so
Bakti's SEP-1/10/12/31 client (`src/server/stellar/anchor/`) has a real,
spec-compliant anchor to integrate against. PeraHub — Bakti's actual target
anchor — has no public testnet endpoint yet (outreach in progress, see the
deck/README); this stand-in is what "testnet SEP-31 integration" is verified
against until PeraHub responds.

## What's running

`docker-compose.yaml` is vendored from Stellar's official
[`quick-run`](https://github.com/stellar/anchor-platform/tree/develop/quick-run)
stack (6 services: the Anchor Platform itself, its Kotlin reference business
server, a Postgres DB each, Kafka for the event pipeline, and a SEP-24 demo
UI Bakti doesn't use). `config/` holds this repo's own filled-in copies of
that stack's `*.template` files — normally `ap_start.sh` (which needs the
Stellar CLI) generates these; here they're pre-generated and committed
instead, since the CLI isn't installed in this environment.

Two Stellar testnet accounts were generated and funded via friendbot for this
stand-in — **testnet only, hold no real value, safe to regenerate**:

| Role | Public key |
|---|---|
| Host SEP-10 signing account | `GAYNC2CGH2ZHTQVM4HH55MYWIXR6PDZIDKXEQTTKYOJAFOU4WH663JGZ` |
| Distribution account (holds the USDC trustline, receives payments) | `GDXLIJKLBCE55IYHSBKAWSTPU5CP4NBP4XGRMYHR4CJE4UEJQTTPVCQG` |

Their secrets live in `.env` and `config/reference-config.yaml`. A separate,
also-funded testnet keypair (`SECRET_ANCHOR_SIGNING_SEED` in Bakti's own
`.env.local`) is Bakti's own client identity — the one that authenticates
*to* this anchor, unrelated to the two above.

`config/assets.yaml` enables SEP-31 receive for testnet USDC
(`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`, the same issuer
`src/server/config/env.ts` already uses for testnet) with a `CASH` funding
method — standing in for PeraHub's real cash-pickup model.

Ports: 8180 (SEP endpoints — reused from upstream's default 8080, which is
taken by code-server on this host), 8085 (platform API), 8091 (reference
server), 5432/5433 (Postgres), 29092 (Kafka), 3001 (SEP-24 demo UI — reused
from 3000, which is taken by wetty on this host).

## Run it

```bash
cd anchor-platform
cp .env.example .env   # gitignored repo-wide, so .env itself isn't committed
docker compose up -d
curl http://localhost:8180/.well-known/stellar.toml   # should return the anchor's stellar.toml
```

```bash
cd ..
ANCHOR_HOME_DOMAIN=localhost:8180 pnpm test:anchor
```

`test:anchor` runs the real SEP-10 → SEP-12 → SEP-31 chain against whatever's
running at `ANCHOR_HOME_DOMAIN` — swap it to PeraHub's home domain once they
have a testnet (or production) endpoint, no code changes needed.

## A quirk worth knowing

Right after `POST /transactions`, the reference server's status is
`pending_receiver` for a few seconds (it reviews the transaction
asynchronously via its Kafka pipeline) before moving to `pending_sender` with
the Stellar payment account/memo populated. `sendViaAnchor()` returns the
immediate status; poll `getPaymentStatus()` if you need the payment details
(the integration test does this).

## Stop it

```bash
docker compose down
```

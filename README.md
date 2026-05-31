# mrgin

Cross-margin trading on Solana — one collateral pool for perpetual futures and prediction markets.

**Live app:** [www.mrgin.me](https://www.mrgin.me) 

---

## What it does

mrgin lets traders deposit USDC once and use that balance across **perps** (SOL, BTC, ETH) and **prediction markets** (sports, events). A shared vault tracks locked vs free collateral and portfolio health, so margin isn’t siloed between products.

The public demo runs in **paper mode**: sign in, get $5,000 simulated USDC, trade with live Binance prices, and see PnL persisted to your account.

---

## Programs (Solana devnet)

| Program | Address | Role |
|---------|---------|------|
| `cross_margin` | `2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm` | Shared vault, deposits, health checks, cross-liquidation |
| `perp_engine` | `FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB` | Perpetual futures — open/close, funding, liquidation |
| `prediction_market` | `ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7` | Binary markets — bet, resolve, claim |

**SOL-PERP market PDA:** `3hEaxT34TiUd7tBHPyNXW8HEfvPAWmLWxAVZijXjx9qD`

---

## Architecture

```
User
  │
  ├─► Frontend (Next.js / Vercel)     www.mrgin.me
  │       live prices via Binance · demo accounts · trade UI
  │
  └─► Backend (Node / DigitalOcean)   api.mrgin.me
          API · matching engine · bots · Helius indexer → Postgres
                │
                └─► Solana devnet programs (cross_margin ← perp_engine, prediction_market)
```

**Cross-margin flow:** deposit USDC → vault → open perp or place bet (margin locked) → health checked across positions → liquidate if undercollateralized.

---

## Stack

| Layer | Tech |
|-------|------|
| Programs | Anchor / Rust on Solana devnet |
| Frontend | Next.js 14, wallet-adapter, lightweight-charts |
| Backend | Fastify API, Redis order book, PM2 on DigitalOcean |
| Indexer | Helius webhooks → Postgres |
| Auth & demo state | Email/password sessions, Postgres (Supabase) |

---

## Local development

**Prerequisites:** Node 20+, Rust, Anchor, Solana CLI, Postgres, Redis

```bash
# Programs
anchor build
anchor test

# Backend (from repo root)
cp app/.env.example app/.env   # fill in keys — never commit
cd app && npm install
npm run dev:api                # :3001

# Frontend
cp frontend/.env.example frontend/.env.local   # optional
cd frontend && npm install
npm run dev                    # :3000
```

Or use `./start-dev.sh` to bring up the full local stack.

**Deploy backend:** `MRGIN_DOMAIN=api.mrgin.me DROPLET_IP=<ip> ./scripts/deploy-backend-do.sh`

---

## Repo layout

```
programs/          Anchor programs (cross_margin, perp_engine, prediction_market)
frontend/          Next.js trading UI
app/               API, indexer, matching engine, bots
tests/             Anchor integration tests
scripts/           Deploy, devnet, webhook setup
deploy/            Nginx config for production
```

---

## License

See [LICENSE](LICENSE).

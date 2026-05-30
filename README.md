# mrgin — Cross-Margined Perps × Prediction Markets

Solana protocol with three Anchor programs sharing a single collateral pool.

## Programs

| Program | ID | Role |
|---|---|---|
| `perp_engine` | `FiTnBYBB...` | AMM-based perpetual futures: open/close positions, funding rate, liquidations |
| `prediction_market` | `ARFaBkMf...` | Binary event markets: create, bet YES/NO, resolve, claim |
| `cross_margin` | `2Khz6Ehr...` | Shared vault + portfolio health engine. THE hard part. |

## Architecture

```
User Wallet
    │
    ▼
cross_margin::deposit()         ← user puts USDC into shared vault
    │
    ├── perp_engine::open_position()    ← locks margin, CPI checks cross_margin health
    │       └── funding_rate settles hourly (anyone can crank)
    │
    └── prediction_market::place_bet()  ← locks collateral from same shared vault
            └── resolves by authority or Pyth oracle
    │
cross_margin::check_health()    ← aggregate PnL across both products
    │
cross_margin::cross_liquidate() ← triggered when health < 5%
        ├── CPI → prediction_market (forfeit worst bets first)
        └── CPI → perp_engine::liquidate (largest positions)
```

## Build Order

Build and test in this sequence — each program depends on the previous:

1. `cross_margin` first — other programs CPI into it
2. `perp_engine` — CPIs cross_margin for health checks
3. `prediction_market` — CPIs cross_margin for health checks
4. Integration tests — full flow across all three

## Key Design Decisions

- **Single shared vault per user** — one `PortfolioAccount` owns all collateral
- **Locked vs free collateral** — `locked_collateral` tracks margin in use; `free_collateral()` = total - locked
- **Health = equity / locked notional in bps** — 10000 = 100% collateralized; liquidation at < 500 bps (5%)
- **Funding rate** = (mark - index) / index / funding_period, accumulated into `cumulative_funding` per market
- **Liquidation waterfall** — prediction bets first (binary, lower recovery), then perp positions by size

## TODO: Real Pyth Integration

Every `get_oracle_price()` stub returns `100_000_000` (=$100 with 6 decimals).
Replace with real Pyth parsing:

```rust
use pyth_sdk_solana::load_price_feed_from_account_info;
let price_feed = load_price_feed_from_account_info(&ctx.accounts.oracle)?;
let price = price_feed.get_price_no_older_than(&Clock::get()?, 60)?;
let price_u64 = (price.price as u64) * 10u64.pow(6 - (-price.expo as u32));
```

Add to Cargo.toml: `pyth-sdk-solana = "0.10"`

## Development Commands

```bash
# Build all programs
anchor build

# Sync program IDs from keypairs
anchor keys sync

# Run tests (localnet)
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Check wallet balance
solana balance
solana airdrop 5
```

## TODO List (Build Phase)

- [ ] Replace all `get_oracle_price()` stubs with real Pyth integration
- [ ] Implement `close_position` PDA-signed vault transfer (return collateral ± PnL)
- [ ] Implement `cross_margin::check_health` CPI loop over all positions
- [ ] Implement `cross_liquidate` CPI waterfall (prediction bets → perp positions)
- [ ] Add `register_position` / `deregister_position` to portfolio when perp opens/closes
- [ ] Add `register_bet` / `deregister_bet` to portfolio when bet is placed/claimed
- [ ] Add Surfpool integration tests with mainnet state (real Pyth feeds)
- [ ] Security audit: check for integer overflow in PnL math, funding accumulation
- [ ] Fuzz test with Trident: random open/close sequences with varying prices

## Slot limits

`PortfolioAccount` currently supports max 8 perp positions + 8 bets per user.
Increase by raising array sizes (costs more rent) or switch to a linked-list account pattern.

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::{MarketParams, OpenPositionParams, PlaceLimitOrderParams};

declare_id!("FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB");

#[program]
pub mod perp_engine {
    use super::*;

    pub fn initialize_market(ctx: Context<InitializeMarket>, params: MarketParams) -> Result<()> {
        instructions::initialize_market::handler(ctx, params)
    }

    /// Devnet/test: authority sets mark price. Replaced by Pyth CPI on mainnet.
    pub fn set_oracle_price(ctx: Context<SetOraclePrice>, price: u64) -> Result<()> {
        instructions::set_oracle_price::handler(ctx, price)
    }

    /// AMM path: open at current mark price (no order book)
    pub fn open_position(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
        instructions::open_position::handler(ctx, params)
    }

    pub fn close_position(ctx: Context<ClosePosition>) -> Result<()> {
        instructions::close_position::handler(ctx)
    }

    pub fn settle_funding(ctx: Context<SettleFunding>) -> Result<()> {
        instructions::settle_funding::handler(ctx)
    }

    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        instructions::liquidate::handler(ctx)
    }

    pub fn refresh_position(ctx: Context<RefreshPosition>) -> Result<()> {
        instructions::refresh_position::handler(ctx)
    }

    /// CLOB path: place a limit order, locks collateral until fill or cancel
    pub fn place_limit_order(ctx: Context<PlaceLimitOrder>, params: PlaceLimitOrderParams) -> Result<()> {
        instructions::place_limit_order::handler(ctx, params)
    }

    /// CLOB: cancel a pending order and return collateral
    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        instructions::cancel_order::handler(ctx)
    }

    /// CLOB: sequencer-only fill — matches maker + taker orders into positions
    pub fn fill_order(ctx: Context<FillOrder>, fill_price: u64, fill_size: u64) -> Result<()> {
        instructions::fill_order::handler(ctx, fill_price, fill_size)
    }
}

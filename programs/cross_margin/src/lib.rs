use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::{HealthReport, ProductType};

declare_id!("2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm");

#[program]
pub mod cross_margin {
    use super::*;

    /// Create a portfolio account for a user — shared collateral pool for all products
    pub fn initialize_portfolio(ctx: Context<InitializePortfolio>) -> Result<()> {
        instructions::initialize_portfolio::handler(ctx)
    }

    /// Deposit USDC into the shared vault
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Withdraw USDC — only if portfolio health remains above threshold
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }

    /// Called by perp_engine / prediction_market via CPI when a position is opened.
    /// Locks margin from the user's shared collateral pool.
    pub fn lock_margin(
        ctx: Context<LockMargin>,
        position_key: Pubkey,
        amount: u64,
        product: ProductType,
    ) -> Result<()> {
        instructions::lock_margin::handler(ctx, position_key, amount, product)
    }

    /// Called by perp_engine / prediction_market via CPI when a position is closed.
    /// Unlocks margin and settles realized PnL into the portfolio.
    pub fn unlock_margin(
        ctx: Context<UnlockMargin>,
        position_key: Pubkey,
        locked_amount: u64,
        realized_pnl: i64,
        product: ProductType,
    ) -> Result<()> {
        instructions::unlock_margin::handler(ctx, position_key, locked_amount, realized_pnl, product)
    }

    /// Check overall portfolio health across all open positions + bets.
    pub fn check_health(ctx: Context<CheckHealth>) -> Result<HealthReport> {
        instructions::check_health::handler(ctx)
    }

    /// Cross-product liquidation: triggered when portfolio health < maintenance threshold
    pub fn cross_liquidate(ctx: Context<CrossLiquidate>) -> Result<()> {
        instructions::cross_liquidate::handler(ctx)
    }
}

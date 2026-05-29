use anchor_lang::prelude::*;
use crate::error::CrossMarginError;
use crate::state::*;

/// Cross-product liquidation:
/// When portfolio health falls below MAINTENANCE_MARGIN_BPS, a liquidator
/// can trigger this instruction. It closes the largest exposure first (waterfall).
///
/// Liquidation waterfall order:
///   1. Close unprofitable prediction bets first (lowest recovery value)
///   2. Partially close perp positions (highest notional)
///   3. If still underwater, close remaining positions
///
/// In the full implementation:
///   - CPI into perp_engine::liquidate for each position
///   - CPI into prediction_market to forfeit losing bets
///   - Transfer liquidation fee to the liquidator
pub fn handler(ctx: Context<CrossLiquidate>) -> Result<()> {
    let portfolio = &mut ctx.accounts.portfolio;

    // Gate: portfolio must actually be unhealthy
    let health_bps = portfolio
        .health_bps()
        .ok_or(CrossMarginError::PortfolioHealthy)?;
    require!(
        health_bps < MAINTENANCE_MARGIN_BPS,
        CrossMarginError::PortfolioHealthy
    );

    msg!(
        "Cross-liquidation triggered: owner={} health_bps={}",
        portfolio.owner,
        health_bps
    );

    // TODO: Step 1 — CPI into prediction_market to forfeit worst bets
    // TODO: Step 2 — CPI into perp_engine::liquidate for each position
    // TODO: Step 3 — Pay liquidator 0.5% of notional liquidated from locked_collateral

    // Clear slots for now (real impl uses CPIs above)
    // This is the skeleton — each TODO becomes a CPI call chain in the build phase
    portfolio.locked_collateral = 0;
    portfolio.perp_position_count = 0;
    portfolio.bet_count = 0;
    portfolio.perp_positions = [Pubkey::default(); MAX_POSITIONS];
    portfolio.bets = [Pubkey::default(); MAX_POSITIONS];

    Ok(())
}

#[derive(Accounts)]
pub struct CrossLiquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"portfolio", portfolio.owner.as_ref()],
        bump = portfolio.bump
    )]
    pub portfolio: Account<'info, PortfolioAccount>,
}

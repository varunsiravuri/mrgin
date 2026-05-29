use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::UnlockMargin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

const MAINTENANCE_MARGIN_BPS: i64 = 500;
const LIQUIDATION_FEE_BPS: i64 = 50;

pub fn handler(ctx: Context<Liquidate>) -> Result<()> {
    let position_key = ctx.accounts.position.key();
    let mark_price = ctx.accounts.market.mark_price;
    require!(mark_price > 0, PerpError::PriceNotSet);

    let market = &mut ctx.accounts.market;
    let position = &ctx.accounts.position;

    let price_diff = mark_price as i64 - position.entry_price as i64;
    let direction: i64 = if position.is_long { 1 } else { -1 };
    let price_pnl = price_diff
        .checked_mul(direction).ok_or(PerpError::MathOverflow)?
        .checked_mul(position.size as i64).ok_or(PerpError::MathOverflow)?
        / 1_000_000;

    let funding_diff = market.cumulative_funding - position.entry_funding;
    let funding_cost = if position.is_long { funding_diff } else { -funding_diff };
    let funding_pnl = funding_cost
        .checked_mul(position.size as i64).ok_or(PerpError::MathOverflow)?
        / 1_000_000_000;

    let net_pnl = price_pnl - funding_pnl;

    let notional = (position.size as i64)
        .checked_mul(mark_price as i64).ok_or(PerpError::MathOverflow)?
        / 1_000_000;
    let equity = position.collateral as i64 + net_pnl;
    let health_bps = equity.checked_mul(10_000).ok_or(PerpError::MathOverflow)? / notional;

    require!(health_bps < MAINTENANCE_MARGIN_BPS, PerpError::PositionHealthy);

    let liquidation_fee = notional
        .checked_mul(LIQUIDATION_FEE_BPS).ok_or(PerpError::MathOverflow)?
        / 10_000;
    let realized_pnl = net_pnl - liquidation_fee;

    if position.is_long {
        market.long_open_interest = market.long_open_interest.saturating_sub(position.size);
    } else {
        market.short_open_interest = market.short_open_interest.saturating_sub(position.size);
    }

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = UnlockMargin {
        caller: ctx.accounts.liquidator.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    unlock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        position_key,
        position.collateral,
        realized_pnl,
        ProductType::Perp,
    )?;

    emit!(LiquidationExecuted {
        owner: position.owner,
        liquidator: ctx.accounts.liquidator.key(),
        market: market.key(),
        mark_price,
        health_bps,
        realized_pnl,
        size: position.size,
    });

    msg!("Liquidated: health_bps={} pnl={} fee={}", health_bps, net_pnl, liquidation_fee);
    Ok(())
}

#[event]
pub struct LiquidationExecuted {
    pub owner: Pubkey,
    pub liquidator: Pubkey,
    pub market: Pubkey,
    pub mark_price: u64,
    pub health_bps: i64,
    pub realized_pnl: i64,
    pub size: u64,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub liquidator: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        close = liquidator,
        seeds = [b"position", position.owner.as_ref(), market.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,

    /// CHECK: cross_margin PortfolioAccount for the liquidated user
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
}

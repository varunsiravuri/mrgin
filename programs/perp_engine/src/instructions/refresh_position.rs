use anchor_lang::prelude::*;
use crate::error::PerpError;
use crate::state::*;

pub fn handler(ctx: Context<RefreshPosition>) -> Result<()> {
    let mark_price = ctx.accounts.market.mark_price;
    require!(mark_price > 0, PerpError::PriceNotSet);

    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.position;

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

    position.unrealized_pnl = price_pnl - funding_pnl;

    msg!("Position refreshed: unrealized_pnl={} mark={}", position.unrealized_pnl, mark_price);
    Ok(())
}

#[derive(Accounts)]
pub struct RefreshPosition<'info> {
    pub caller: Signer<'info>,

    #[account(seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        seeds = [b"position", position.owner.as_ref(), market.key().as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
}

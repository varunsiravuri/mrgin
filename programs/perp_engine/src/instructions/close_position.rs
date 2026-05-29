use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::UnlockMargin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

pub fn handler(ctx: Context<ClosePosition>) -> Result<()> {
    let position_key = ctx.accounts.position.key();
    let exit_price = ctx.accounts.market.mark_price;
    require!(exit_price > 0, PerpError::PriceNotSet);

    let market = &mut ctx.accounts.market;
    let position = &ctx.accounts.position;

    let price_diff: i64 = exit_price as i64 - position.entry_price as i64;
    let direction: i64 = if position.is_long { 1 } else { -1 };
    let pnl: i64 = price_diff
        .checked_mul(direction).ok_or(PerpError::MathOverflow)?
        .checked_mul(position.size as i64).ok_or(PerpError::MathOverflow)?
        / 1_000_000;

    let funding_diff = market.cumulative_funding - position.entry_funding;
    let funding_cost = if position.is_long { funding_diff } else { -funding_diff };
    let funding_pnl = funding_cost
        .checked_mul(position.size as i64).ok_or(PerpError::MathOverflow)?
        / 1_000_000_000;

    let realized_pnl = pnl - funding_pnl;

    if position.is_long {
        market.long_open_interest = market.long_open_interest.saturating_sub(position.size);
    } else {
        market.short_open_interest = market.short_open_interest.saturating_sub(position.size);
    }

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = UnlockMargin {
        caller: ctx.accounts.owner.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    unlock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        position_key,
        position.collateral,
        realized_pnl,
        ProductType::Perp,
    )?;

    emit!(PositionClosed {
        owner: ctx.accounts.owner.key(),
        market: market.key(),
        exit_price,
        realized_pnl,
        size: position.size,
    });

    msg!("Position closed: exit={} pnl={} funding_pnl={}", exit_price, pnl, funding_pnl);
    Ok(())
}

#[event]
pub struct PositionClosed {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub exit_price: u64,
    pub realized_pnl: i64,
    pub size: u64,
}

#[derive(Accounts)]
pub struct ClosePosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        mut,
        close = owner,
        seeds = [b"position", owner.key().as_ref(), market.key().as_ref()],
        bump = position.bump,
        constraint = position.owner == owner.key()
    )]
    pub position: Account<'info, Position>,

    /// CHECK: cross_margin PortfolioAccount
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
}

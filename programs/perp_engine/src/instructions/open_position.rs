use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::LockMargin, lock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

const MARKET_MAX_LEVERAGE: u8 = 20;

pub fn handler(ctx: Context<OpenPosition>, params: OpenPositionParams) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;

    let mark_price = market.mark_price;
    require!(mark_price > 0, PerpError::PriceNotSet);

    let notional = params
        .size
        .checked_mul(mark_price)
        .ok_or(PerpError::MathOverflow)?
        / 1_000_000;
    let leverage = if params.collateral > 0 { notional / params.collateral } else { u64::MAX };
    require!(leverage <= MARKET_MAX_LEVERAGE as u64, PerpError::ExceedsMaxLeverage);

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = LockMargin {
        caller: ctx.accounts.owner.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    lock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        position.key(),
        params.collateral,
        ProductType::Perp,
    )?;

    if params.is_long {
        market.long_open_interest = market.long_open_interest
            .checked_add(params.size).ok_or(PerpError::MathOverflow)?;
    } else {
        market.short_open_interest = market.short_open_interest
            .checked_add(params.size).ok_or(PerpError::MathOverflow)?;
    }

    position.owner = ctx.accounts.owner.key();
    position.market = market.key();
    position.cross_margin_account = ctx.accounts.portfolio.key();
    position.size = params.size;
    position.entry_price = mark_price;
    position.is_long = params.is_long;
    position.collateral = params.collateral;
    position.entry_funding = market.cumulative_funding;
    position.unrealized_pnl = 0;
    position.bump = ctx.bumps.position;

    emit!(PositionOpened {
        owner: ctx.accounts.owner.key(),
        market: market.key(),
        size: params.size,
        entry_price: mark_price,
        collateral: params.collateral,
        is_long: params.is_long,
    });

    msg!("Position opened: size={} price={} long={}", params.size, mark_price, params.is_long);
    Ok(())
}

#[event]
pub struct PositionOpened {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub size: u64,
    pub entry_price: u64,
    pub collateral: u64,
    pub is_long: bool,
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = owner,
        space = 8 + Position::LEN,
        seeds = [b"position", owner.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    /// CHECK: cross_margin PortfolioAccount
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

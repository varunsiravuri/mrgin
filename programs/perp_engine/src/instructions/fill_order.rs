use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::{LockMargin, UnlockMargin}, lock_margin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

/// Called exclusively by the sequencer (off-chain matching engine).
/// Fills two matched orders: releases order collateral locks, opens
/// Position accounts for both maker and taker at the agreed fill_price.
pub fn handler(
    ctx: Context<FillOrder>,
    fill_price: u64,
    fill_size: u64,
) -> Result<()> {
    // Verify sequencer authority
    require!(
        ctx.accounts.sequencer.key() == ctx.accounts.market.sequencer_authority,
        PerpError::UnauthorizedSequencer
    );
    require!(fill_price > 0, PerpError::InvalidPrice);
    require!(fill_size > 0, PerpError::MathOverflow);

    let market_key = ctx.accounts.market.key();
    let maker_order_key = ctx.accounts.maker_order.key();
    let taker_order_key = ctx.accounts.taker_order.key();

    let maker_collateral = ctx.accounts.maker_order.collateral;
    let taker_collateral = ctx.accounts.taker_order.collateral;
    let maker_is_long = ctx.accounts.maker_order.is_long;

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();

    // 1. Release maker order lock → re-lock under position key
    unlock_margin(
        CpiContext::new(cpi_program.clone(), UnlockMargin {
            caller: ctx.accounts.sequencer.to_account_info(),
            portfolio: ctx.accounts.maker_portfolio.to_account_info(),
        }),
        maker_order_key,
        maker_collateral,
        0,
        ProductType::Perp,
    )?;
    lock_margin(
        CpiContext::new(cpi_program.clone(), LockMargin {
            caller: ctx.accounts.sequencer.to_account_info(),
            portfolio: ctx.accounts.maker_portfolio.to_account_info(),
        }),
        ctx.accounts.maker_position.key(),
        maker_collateral,
        ProductType::Perp,
    )?;

    // 2. Release taker order lock → re-lock under position key
    unlock_margin(
        CpiContext::new(cpi_program.clone(), UnlockMargin {
            caller: ctx.accounts.sequencer.to_account_info(),
            portfolio: ctx.accounts.taker_portfolio.to_account_info(),
        }),
        taker_order_key,
        taker_collateral,
        0,
        ProductType::Perp,
    )?;
    lock_margin(
        CpiContext::new(cpi_program.clone(), LockMargin {
            caller: ctx.accounts.sequencer.to_account_info(),
            portfolio: ctx.accounts.taker_portfolio.to_account_info(),
        }),
        ctx.accounts.taker_position.key(),
        taker_collateral,
        ProductType::Perp,
    )?;

    // 3. Open maker position
    let market = &mut ctx.accounts.market;
    let maker_pos = &mut ctx.accounts.maker_position;
    maker_pos.owner = ctx.accounts.maker_order.owner;
    maker_pos.market = market_key;
    maker_pos.cross_margin_account = ctx.accounts.maker_portfolio.key();
    maker_pos.size = fill_size;
    maker_pos.collateral = maker_collateral;
    maker_pos.entry_price = fill_price;
    maker_pos.is_long = maker_is_long;
    maker_pos.entry_funding = market.cumulative_funding;
    maker_pos.unrealized_pnl = 0;
    maker_pos.bump = ctx.bumps.maker_position;

    // 4. Open taker position (opposite side)
    let taker_pos = &mut ctx.accounts.taker_position;
    taker_pos.owner = ctx.accounts.taker_order.owner;
    taker_pos.market = market_key;
    taker_pos.cross_margin_account = ctx.accounts.taker_portfolio.key();
    taker_pos.size = fill_size;
    taker_pos.collateral = taker_collateral;
    taker_pos.entry_price = fill_price;
    taker_pos.is_long = !maker_is_long;
    taker_pos.entry_funding = market.cumulative_funding;
    taker_pos.unrealized_pnl = 0;
    taker_pos.bump = ctx.bumps.taker_position;

    // 5. Update open interest
    if maker_is_long {
        market.long_open_interest = market.long_open_interest
            .checked_add(fill_size).ok_or(PerpError::MathOverflow)?;
        market.short_open_interest = market.short_open_interest
            .checked_add(fill_size).ok_or(PerpError::MathOverflow)?;
    } else {
        market.short_open_interest = market.short_open_interest
            .checked_add(fill_size).ok_or(PerpError::MathOverflow)?;
        market.long_open_interest = market.long_open_interest
            .checked_add(fill_size).ok_or(PerpError::MathOverflow)?;
    }

    emit!(OrderFilled {
        maker: maker_pos.owner,
        taker: taker_pos.owner,
        market: market_key,
        fill_price,
        fill_size,
        maker_is_long,
    });

    msg!("Order filled: price={} size={} maker_long={}", fill_price, fill_size, maker_is_long);
    Ok(())
}

#[event]
pub struct OrderFilled {
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub market: Pubkey,
    pub fill_price: u64,
    pub fill_size: u64,
    pub maker_is_long: bool,
}

#[derive(Accounts)]
pub struct FillOrder<'info> {
    /// The sequencer keypair — must match market.sequencer_authority
    #[account(mut)]
    pub sequencer: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    // Maker order (being consumed)
    #[account(
        mut,
        close = sequencer,
        seeds = [b"order", maker_order.owner.as_ref(), market.key().as_ref(), &maker_order.order_id.to_le_bytes()],
        bump = maker_order.bump,
    )]
    pub maker_order: Account<'info, OrderAccount>,

    // Taker order (being consumed)
    #[account(
        mut,
        close = sequencer,
        seeds = [b"order", taker_order.owner.as_ref(), market.key().as_ref(), &taker_order.order_id.to_le_bytes()],
        bump = taker_order.bump,
    )]
    pub taker_order: Account<'info, OrderAccount>,

    // New position for maker
    #[account(
        init,
        payer = sequencer,
        space = 8 + Position::LEN,
        seeds = [b"position", maker_order.owner.as_ref(), market.key().as_ref()],
        bump
    )]
    pub maker_position: Account<'info, Position>,

    // New position for taker
    #[account(
        init,
        payer = sequencer,
        space = 8 + Position::LEN,
        seeds = [b"position", taker_order.owner.as_ref(), market.key().as_ref()],
        bump
    )]
    pub taker_position: Account<'info, Position>,

    /// CHECK: maker's cross_margin portfolio
    #[account(mut)]
    pub maker_portfolio: UncheckedAccount<'info>,

    /// CHECK: taker's cross_margin portfolio
    #[account(mut)]
    pub taker_portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

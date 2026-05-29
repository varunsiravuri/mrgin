use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::LockMargin, lock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

pub fn handler(ctx: Context<PlaceLimitOrder>, params: PlaceLimitOrderParams) -> Result<()> {
    require!(params.collateral > 0, PerpError::InsufficientOrderCollateral);

    let market = &mut ctx.accounts.market;
    let order = &mut ctx.accounts.order;

    let order_id = market.next_order_id;
    market.next_order_id = market.next_order_id.checked_add(1).ok_or(PerpError::MathOverflow)?;

    // Lock collateral under the order's PDA key
    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = LockMargin {
        caller: ctx.accounts.owner.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    lock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        order.key(),
        params.collateral,
        ProductType::Perp,
    )?;

    order.owner = ctx.accounts.owner.key();
    order.market = market.key();
    order.order_id = order_id;
    order.size = params.size;
    order.collateral = params.collateral;
    order.limit_price = params.limit_price;
    order.is_long = params.is_long;
    order.filled_size = 0;
    order.bump = ctx.bumps.order;

    emit!(OrderPlaced {
        owner: ctx.accounts.owner.key(),
        market: market.key(),
        order_id,
        size: params.size,
        limit_price: params.limit_price,
        is_long: params.is_long,
        collateral: params.collateral,
    });

    msg!("Order placed: id={} size={} price={} long={}", order_id, params.size, params.limit_price, params.is_long);
    Ok(())
}

#[event]
pub struct OrderPlaced {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub order_id: u64,
    pub size: u64,
    pub limit_price: u64,
    pub is_long: bool,
    pub collateral: u64,
}

#[derive(Accounts)]
#[instruction(params: PlaceLimitOrderParams)]
pub struct PlaceLimitOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,

    #[account(
        init,
        payer = owner,
        space = 8 + OrderAccount::LEN,
        seeds = [b"order", owner.key().as_ref(), market.key().as_ref(), &market.next_order_id.to_le_bytes()],
        bump
    )]
    pub order: Account<'info, OrderAccount>,

    /// CHECK: cross_margin PortfolioAccount
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

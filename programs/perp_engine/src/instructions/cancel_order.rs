use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::UnlockMargin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PerpError;
use crate::state::*;

pub fn handler(ctx: Context<CancelOrder>) -> Result<()> {
    let order_key = ctx.accounts.order.key();
    let order_collateral = ctx.accounts.order.collateral;
    let order_id = ctx.accounts.order.order_id;

    // Return locked collateral with zero PnL
    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = UnlockMargin {
        caller: ctx.accounts.owner.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    unlock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        order_key,
        order_collateral,
        0,
        ProductType::Perp,
    )?;

    emit!(OrderCancelled {
        owner: ctx.accounts.owner.key(),
        market: ctx.accounts.order.market,
        order_id,
    });

    msg!("Order cancelled: id={}", order_id);
    Ok(())
}

#[event]
pub struct OrderCancelled {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub order_id: u64,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [b"order", owner.key().as_ref(), order.market.as_ref(), &order.order_id.to_le_bytes()],
        bump = order.bump,
        constraint = order.owner == owner.key()
    )]
    pub order: Account<'info, OrderAccount>,

    /// CHECK: cross_margin PortfolioAccount
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
}

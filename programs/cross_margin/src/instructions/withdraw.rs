use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::error::CrossMarginError;
use crate::state::*;

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Extract bump and owner before any mutable borrow
    let bump = ctx.accounts.portfolio.bump;
    let owner = ctx.accounts.portfolio.owner;
    let free = ctx.accounts.portfolio.free_collateral();

    require!(amount <= free, CrossMarginError::InsufficientFreeCollateral);

    // PDA-signed transfer out of vault
    let seeds = &[b"portfolio" as &[u8], owner.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.portfolio.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, amount)?;

    let portfolio = &mut ctx.accounts.portfolio;
    portfolio.total_collateral = portfolio
        .total_collateral
        .checked_sub(amount)
        .ok_or(CrossMarginError::MathOverflow)?;

    msg!("Withdrew {} USDC. Remaining: {}", amount, portfolio.total_collateral);
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"portfolio", owner.key().as_ref()],
        bump = portfolio.bump,
        constraint = portfolio.owner == owner.key()
    )]
    pub portfolio: Account<'info, PortfolioAccount>,

    #[account(mut, constraint = vault.key() == portfolio.vault)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_token_account.owner == owner.key())]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;

    let portfolio = &mut ctx.accounts.portfolio;
    portfolio.total_collateral = portfolio
        .total_collateral
        .checked_add(amount)
        .ok_or(crate::error::CrossMarginError::MathOverflow)?;

    msg!("Deposited {} USDC. Total collateral: {}", amount, portfolio.total_collateral);
    Ok(())
}

#[derive(Accounts)]
pub struct Deposit<'info> {
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

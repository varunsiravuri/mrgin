use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;

pub fn handler(ctx: Context<InitializePortfolio>) -> Result<()> {
    let portfolio = &mut ctx.accounts.portfolio;
    portfolio.owner = ctx.accounts.owner.key();
    portfolio.vault = ctx.accounts.vault.key();
    portfolio.total_collateral = 0;
    portfolio.locked_collateral = 0;
    portfolio.perp_positions = [Pubkey::default(); MAX_POSITIONS];
    portfolio.perp_position_count = 0;
    portfolio.bets = [Pubkey::default(); MAX_POSITIONS];
    portfolio.bet_count = 0;
    portfolio.bump = ctx.bumps.portfolio;

    msg!("Portfolio initialized for {}", ctx.accounts.owner.key());
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePortfolio<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + PortfolioAccount::LEN,
        seeds = [b"portfolio", owner.key().as_ref()],
        bump
    )]
    pub portfolio: Account<'info, PortfolioAccount>,

    pub quote_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = owner,
        token::mint = quote_mint,
        token::authority = portfolio,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

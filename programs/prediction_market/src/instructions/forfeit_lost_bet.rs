use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::UnlockMargin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PredictionError;
use crate::state::*;

/// Permissionless: slashes a losing bet's collateral from the portfolio.
pub fn handler(ctx: Context<ForfeitLostBet>) -> Result<()> {
    let bet_key = ctx.accounts.bet.key();
    let bet_amount = ctx.accounts.bet.amount;
    let bet_owner = ctx.accounts.bet.owner;
    let bet_is_yes = ctx.accounts.bet.is_yes;

    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Resolved, PredictionError::MarketNotResolved);
    require!(!ctx.accounts.bet.claimed, PredictionError::AlreadyClaimed);
    require!(bet_is_yes != market.outcome, PredictionError::BetWon);

    ctx.accounts.bet.claimed = true;

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = UnlockMargin {
        caller: ctx.accounts.caller.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    unlock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        bet_key,
        bet_amount,
        -(bet_amount as i64),
        ProductType::Bet,
    )?;

    msg!("Lost bet forfeited: amount={} owner={}", bet_amount, bet_owner);
    Ok(())
}

#[derive(Accounts)]
pub struct ForfeitLostBet<'info> {
    pub caller: Signer<'info>,

    #[account(
        seeds = [b"pred_market", market.authority.as_ref(), &market.resolution_ts.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        mut,
        seeds = [b"bet", bet.owner.as_ref(), market.key().as_ref()],
        bump = bet.bump,
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: cross_margin PortfolioAccount for the bet owner
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
}

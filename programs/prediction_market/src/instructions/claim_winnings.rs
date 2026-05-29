use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::UnlockMargin, unlock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PredictionError;
use crate::state::*;

pub fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    // Extract key before any mutable borrow
    let bet_key = ctx.accounts.bet.key();
    let bet_amount = ctx.accounts.bet.amount;
    let bet_is_yes = ctx.accounts.bet.is_yes;

    let market = &ctx.accounts.market;
    require!(market.status == MarketStatus::Resolved, PredictionError::MarketNotResolved);
    require!(!ctx.accounts.bet.claimed, PredictionError::AlreadyClaimed);
    require!(bet_is_yes == market.outcome, PredictionError::BetLost);

    let winning_pool = if market.outcome { market.total_yes } else { market.total_no };
    let losing_pool  = if market.outcome { market.total_no  } else { market.total_yes };

    let winnings = losing_pool
        .checked_mul(bet_amount)
        .ok_or(PredictionError::MathOverflow)?
        / winning_pool;

    ctx.accounts.bet.claimed = true;

    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = UnlockMargin {
        caller: ctx.accounts.winner.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    unlock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        bet_key,
        bet_amount,
        winnings as i64,
        ProductType::Bet,
    )?;

    emit!(WinningsClaimed {
        winner: ctx.accounts.winner.key(),
        market: market.key(),
        stake: bet_amount,
        winnings,
    });

    msg!("Winnings claimed: stake={} winnings={}", bet_amount, winnings);
    Ok(())
}

#[event]
pub struct WinningsClaimed {
    pub winner: Pubkey,
    pub market: Pubkey,
    pub stake: u64,
    pub winnings: u64,
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        seeds = [b"pred_market", market.authority.as_ref(), &market.resolution_ts.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        mut,
        seeds = [b"bet", winner.key().as_ref(), market.key().as_ref()],
        bump = bet.bump,
        constraint = bet.owner == winner.key()
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: cross_margin PortfolioAccount for this user
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
}

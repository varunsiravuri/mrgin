use anchor_lang::prelude::*;
use crate::error::PredictionError;
use crate::state::*;

/// Markets are resolved by authority (or auto-resolved via Pyth in full implementation).
/// Outcome: true = YES won, false = NO won.
pub fn handler(ctx: Context<ResolveMarket>, outcome: bool) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;

    require!(market.status == MarketStatus::Open, PredictionError::AlreadyResolved);
    require!(
        clock.unix_timestamp >= market.resolution_ts,
        PredictionError::ResolutionTooEarly
    );

    market.status = MarketStatus::Resolved;
    market.outcome = outcome;

    msg!(
        "Market resolved: outcome={} total_yes={} total_no={}",
        outcome,
        market.total_yes,
        market.total_no
    );
    Ok(())
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(constraint = authority.key() == market.authority)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pred_market", market.authority.as_ref(), &market.resolution_ts.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, PredictionMarket>,
}

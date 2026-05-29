use anchor_lang::prelude::*;
use crate::error::PerpError;
use crate::state::*;

const FUNDING_PERIOD_SECS: i64 = 3600;

pub fn handler(ctx: Context<SettleFunding>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let elapsed = now - market.last_funding_ts;
    require!(elapsed >= FUNDING_PERIOD_SECS, PerpError::FundingPeriodNotElapsed);

    let mark_price = market.mark_price;
    require!(mark_price > 0, PerpError::PriceNotSet);

    // Use mark_price as both mark and index for now (index = mark in single-oracle mode).
    // In production: index_price comes from a spot oracle account.
    let index_price = mark_price;
    let price_diff = mark_price as i64 - index_price as i64;
    let funding_rate = price_diff
        .checked_mul(1_000_000_000).ok_or(PerpError::MathOverflow)?
        / index_price as i64
        / FUNDING_PERIOD_SECS;

    let funding_delta = funding_rate
        .checked_mul(elapsed).ok_or(PerpError::MathOverflow)?;
    market.cumulative_funding = market.cumulative_funding
        .checked_add(funding_delta).ok_or(PerpError::MathOverflow)?;
    market.funding_rate = funding_rate;
    market.last_funding_ts = now;

    emit!(FundingSettled {
        market: market.key(),
        funding_rate,
        cumulative_funding: market.cumulative_funding,
        mark_price,
        elapsed_secs: elapsed,
    });

    msg!("Funding settled: rate={} cumulative={}", funding_rate, market.cumulative_funding);
    Ok(())
}

#[event]
pub struct FundingSettled {
    pub market: Pubkey,
    pub funding_rate: i64,
    pub cumulative_funding: i64,
    pub mark_price: u64,
    pub elapsed_secs: i64,
}

#[derive(Accounts)]
pub struct SettleFunding<'info> {
    pub cranker: Signer<'info>,

    #[account(mut, seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
}

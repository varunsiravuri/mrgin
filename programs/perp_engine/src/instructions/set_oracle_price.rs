use anchor_lang::prelude::*;
use crate::error::PerpError;
use crate::state::*;

/// Devnet / testing: authority sets mark price directly.
/// On mainnet this is replaced by Pyth CPI:
///   let feed = load_price_feed_from_account_info(&ctx.accounts.oracle)?;
///   let p = feed.get_price_no_older_than(&Clock::get()?, 60)?;
///   market.mark_price = normalize_pyth_price(p.price, p.expo);
pub fn handler(ctx: Context<SetOraclePrice>, price: u64) -> Result<()> {
    require!(price > 0, PerpError::InvalidPrice);
    ctx.accounts.market.mark_price = price;
    msg!("mark_price set to {}", price);
    Ok(())
}

#[derive(Accounts)]
pub struct SetOraclePrice<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        seeds = [b"market", market.quote_mint.as_ref(), market.oracle.as_ref()],
        bump = market.bump
    )]
    pub market: Account<'info, Market>,
}

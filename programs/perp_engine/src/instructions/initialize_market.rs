use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;

pub fn handler(ctx: Context<InitializeMarket>, params: MarketParams) -> Result<()> {
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.quote_mint = ctx.accounts.quote_mint.key();
    market.oracle = ctx.accounts.oracle.key();
    market.vault = ctx.accounts.vault.key();
    market.long_open_interest = 0;
    market.short_open_interest = 0;
    market.funding_rate = 0;
    market.last_funding_ts = Clock::get()?.unix_timestamp;
    market.cumulative_funding = 0;
    market.mark_price = 0;
    market.sequencer_authority = params.sequencer_authority;
    market.next_order_id = 0;
    market.bump = ctx.bumps.market;

    msg!(
        "Market initialized: max_leverage={} sequencer={}",
        params.max_leverage,
        params.sequencer_authority,
    );
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Market::LEN,
        seeds = [b"market", quote_mint.key().as_ref(), oracle.key().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,

    pub quote_mint: Account<'info, Mint>,

    /// CHECK: Pyth/test price feed
    pub oracle: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        token::mint = quote_mint,
        token::authority = market,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

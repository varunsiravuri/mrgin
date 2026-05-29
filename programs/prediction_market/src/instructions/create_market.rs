use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::*;

pub fn handler(ctx: Context<CreateMarket>, params: CreateMarketParams) -> Result<()> {
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.oracle = ctx.accounts.oracle.key();
    market.quote_mint = ctx.accounts.quote_mint.key();
    market.vault = ctx.accounts.vault.key();
    market.cross_margin_vault = ctx.accounts.cross_margin_vault.key();
    market.description = params.description;
    market.resolution_ts = params.resolution_ts;
    market.total_yes = 0;
    market.total_no = 0;
    market.status = MarketStatus::Open;
    market.outcome = false;
    market.bump = ctx.bumps.market;

    msg!("Prediction market created, resolves at: {}", params.resolution_ts);
    Ok(())
}

#[derive(Accounts)]
#[instruction(params: CreateMarketParams)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PredictionMarket::LEN,
        seeds = [b"pred_market", authority.key().as_ref(), &params.resolution_ts.to_le_bytes()],
        bump
    )]
    pub market: Account<'info, PredictionMarket>,

    pub quote_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = quote_mint,
        token::authority = market,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: cross_margin vault PDA — validated by cross_margin program
    pub cross_margin_vault: UncheckedAccount<'info>,

    /// CHECK: optional Pyth oracle for auto-resolution
    pub oracle: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

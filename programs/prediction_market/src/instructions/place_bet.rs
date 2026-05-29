use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use cross_margin::{
    cpi::{accounts::LockMargin, lock_margin},
    program::CrossMargin,
    state::ProductType,
};
use crate::error::PredictionError;
use crate::state::*;

pub fn handler(ctx: Context<PlaceBet>, params: PlaceBetParams) -> Result<()> {
    let market = &mut ctx.accounts.market;
    require!(market.status == MarketStatus::Open, PredictionError::MarketNotOpen);
    require!(params.amount > 0, PredictionError::InvalidAmount);

    // Lock collateral from user's shared cross_margin portfolio
    let cpi_program = ctx.accounts.cross_margin_program.to_account_info();
    let cpi_accounts = LockMargin {
        caller: ctx.accounts.bettor.to_account_info(),
        portfolio: ctx.accounts.portfolio.to_account_info(),
    };
    lock_margin(
        CpiContext::new(cpi_program, cpi_accounts),
        ctx.accounts.bet.key(),
        params.amount,
        ProductType::Bet,
    )?;

    if params.is_yes {
        market.total_yes = market
            .total_yes
            .checked_add(params.amount)
            .ok_or(PredictionError::MathOverflow)?;
    } else {
        market.total_no = market
            .total_no
            .checked_add(params.amount)
            .ok_or(PredictionError::MathOverflow)?;
    }

    let bet = &mut ctx.accounts.bet;
    bet.owner = ctx.accounts.bettor.key();
    bet.market = market.key();
    bet.cross_margin_account = ctx.accounts.portfolio.key();
    bet.amount = params.amount;
    bet.is_yes = params.is_yes;
    bet.claimed = false;
    bet.bump = ctx.bumps.bet;

    emit!(BetPlaced {
        bettor: ctx.accounts.bettor.key(),
        market: market.key(),
        amount: params.amount,
        is_yes: params.is_yes,
    });

    msg!("Bet placed: amount={} yes={}", params.amount, params.is_yes);
    Ok(())
}

#[event]
pub struct BetPlaced {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub amount: u64,
    pub is_yes: bool,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pred_market", market.authority.as_ref(), &market.resolution_ts.to_le_bytes()],
        bump = market.bump
    )]
    pub market: Account<'info, PredictionMarket>,

    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::LEN,
        seeds = [b"bet", bettor.key().as_ref(), market.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    /// CHECK: cross_margin PortfolioAccount for this user
    #[account(mut)]
    pub portfolio: UncheckedAccount<'info>,

    pub cross_margin_program: Program<'info, CrossMargin>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

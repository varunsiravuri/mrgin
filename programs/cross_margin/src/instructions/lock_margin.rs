use anchor_lang::prelude::*;
use crate::error::CrossMarginError;
use crate::state::*;

/// Called by perp_engine or prediction_market (via CPI) when a new position is opened.
/// Locks `amount` from the portfolio's free collateral and records the position key.
pub fn handler(
    ctx: Context<LockMargin>,
    position_key: Pubkey,
    amount: u64,
    product: ProductType,
) -> Result<()> {
    let portfolio = &mut ctx.accounts.portfolio;

    // Ensure there's enough free collateral to cover the required margin
    let free = portfolio.free_collateral();
    require!(amount <= free, CrossMarginError::InsufficientFreeCollateral);

    // Register the position key in the correct slot
    match product {
        ProductType::Perp => {
            require!(
                (portfolio.perp_position_count as usize) < MAX_POSITIONS,
                CrossMarginError::MaxPositionSlotsReached
            );
            let idx = portfolio.perp_position_count as usize;
            portfolio.perp_positions[idx] = position_key;
            portfolio.perp_position_count += 1;
        }
        ProductType::Bet => {
            require!(
                (portfolio.bet_count as usize) < MAX_POSITIONS,
                CrossMarginError::MaxBetSlotsReached
            );
            let idx = portfolio.bet_count as usize;
            portfolio.bets[idx] = position_key;
            portfolio.bet_count += 1;
        }
    }

    // Lock the collateral
    portfolio.locked_collateral = portfolio
        .locked_collateral
        .checked_add(amount)
        .ok_or(CrossMarginError::MathOverflow)?;

    msg!(
        "Margin locked: amount={} product={:?} total_locked={}",
        amount,
        product,
        portfolio.locked_collateral
    );
    Ok(())
}

#[derive(Accounts)]
pub struct LockMargin<'info> {
    /// The program calling this CPI — must be an authorized product program
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"portfolio", portfolio.owner.as_ref()],
        bump = portfolio.bump,
    )]
    pub portfolio: Account<'info, PortfolioAccount>,
}

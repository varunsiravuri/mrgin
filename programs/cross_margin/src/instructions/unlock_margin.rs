use anchor_lang::prelude::*;
use crate::error::CrossMarginError;
use crate::state::*;

pub fn handler(
    ctx: Context<UnlockMargin>,
    position_key: Pubkey,
    locked_amount: u64,
    realized_pnl: i64,
    product: ProductType,
) -> Result<()> {
    let portfolio = &mut ctx.accounts.portfolio;

    // Remove the position key from the tracking array.
    // We do this in a block to avoid multiple mutable borrows of portfolio fields.
    match product {
        ProductType::Perp => {
            let count = portfolio.perp_position_count as usize;
            let idx = portfolio.perp_positions[..count]
                .iter()
                .position(|k| *k == position_key)
                .ok_or(CrossMarginError::PositionNotRegistered)?;
            let last = count - 1;
            portfolio.perp_positions[idx] = portfolio.perp_positions[last];
            portfolio.perp_positions[last] = Pubkey::default();
            portfolio.perp_position_count -= 1;
        }
        ProductType::Bet => {
            let count = portfolio.bet_count as usize;
            let idx = portfolio.bets[..count]
                .iter()
                .position(|k| *k == position_key)
                .ok_or(CrossMarginError::PositionNotRegistered)?;
            let last = count - 1;
            portfolio.bets[idx] = portfolio.bets[last];
            portfolio.bets[last] = Pubkey::default();
            portfolio.bet_count -= 1;
        }
    }

    // Unlock the collateral
    portfolio.locked_collateral = portfolio
        .locked_collateral
        .saturating_sub(locked_amount);

    // Apply realized PnL to total collateral
    if realized_pnl >= 0 {
        portfolio.total_collateral = portfolio
            .total_collateral
            .checked_add(realized_pnl as u64)
            .ok_or(CrossMarginError::MathOverflow)?;
    } else {
        let loss = (-realized_pnl) as u64;
        portfolio.total_collateral = portfolio
            .total_collateral
            .saturating_sub(loss);
    }

    msg!(
        "Margin unlocked: amount={} pnl={} total_collateral={}",
        locked_amount,
        realized_pnl,
        portfolio.total_collateral
    );
    Ok(())
}

#[derive(Accounts)]
pub struct UnlockMargin<'info> {
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"portfolio", portfolio.owner.as_ref()],
        bump = portfolio.bump,
    )]
    pub portfolio: Account<'info, PortfolioAccount>,
}

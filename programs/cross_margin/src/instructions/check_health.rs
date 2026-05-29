use anchor_lang::prelude::*;
use crate::error::CrossMarginError;
use crate::state::*;

// Byte offset of `unrealized_pnl` in a serialized Position account.
// Layout (with 8-byte Anchor discriminator prefix):
//   [0..8]   discriminator
//   [8..40]  owner: Pubkey
//   [40..72] market: Pubkey
//   [72..104] cross_margin_account: Pubkey
//   [104..112] size: u64
//   [112..120] collateral: u64
//   [120..128] entry_price: u64
//   [128]    is_long: bool
//   [129..137] entry_funding: i64
//   [137..145] unrealized_pnl: i64  ← here
const POSITION_UNREALIZED_PNL_OFFSET: usize = 137;

/// Health check — reads cached `unrealized_pnl` from each open position account.
///
/// remaining_accounts must be passed in order:
///   [0 .. perp_position_count)  — Position accounts (perp_engine)
///   [perp_position_count .. perp_position_count + bet_count) — Bet accounts (prediction_market)
///
/// Keys are verified against the registered lists in PortfolioAccount.
/// Bets are binary (no mark-to-market PnL), so only their keys are verified.
pub fn handler(ctx: Context<CheckHealth>) -> Result<HealthReport> {
    let portfolio = &ctx.accounts.portfolio;

    let perp_count = portfolio.perp_position_count as usize;
    let bet_count = portfolio.bet_count as usize;

    require!(
        ctx.remaining_accounts.len() == perp_count + bet_count,
        CrossMarginError::WrongAccountCount
    );

    let mut unrealized_pnl: i64 = 0;

    // Sum unrealized_pnl from each registered perp position
    for i in 0..perp_count {
        let acct = &ctx.remaining_accounts[i];

        require!(
            acct.key() == portfolio.perp_positions[i],
            CrossMarginError::PositionNotRegistered
        );

        let data = acct.try_borrow_data()?;
        require!(
            data.len() >= POSITION_UNREALIZED_PNL_OFFSET + 8,
            CrossMarginError::InvalidAccountData
        );

        let bytes: [u8; 8] = data[POSITION_UNREALIZED_PNL_OFFSET..POSITION_UNREALIZED_PNL_OFFSET + 8]
            .try_into()
            .map_err(|_| CrossMarginError::InvalidAccountData)?;
        unrealized_pnl = unrealized_pnl.saturating_add(i64::from_le_bytes(bytes));
    }

    // Verify bet account keys (binary markets have no unrealized PnL)
    for i in 0..bet_count {
        let acct = &ctx.remaining_accounts[perp_count + i];
        require!(
            acct.key() == portfolio.bets[i],
            CrossMarginError::PositionNotRegistered
        );
    }

    // equity = deposited collateral + unrealized PnL (can go negative)
    let equity: i64 = portfolio.total_collateral as i64 + unrealized_pnl;

    let health_bps: u64 = if portfolio.locked_collateral == 0 {
        u64::MAX // no open risk → infinite health
    } else if equity <= 0 {
        0 // fully insolvent
    } else {
        (equity as u64)
            .saturating_mul(10_000)
            / portfolio.locked_collateral
    };

    let report = HealthReport {
        total_collateral: portfolio.total_collateral,
        locked_collateral: portfolio.locked_collateral,
        unrealized_pnl,
        health_bps,
        is_liquidatable: portfolio.locked_collateral > 0 && health_bps < MAINTENANCE_MARGIN_BPS,
    };

    msg!(
        "Health: bps={} equity={} locked={} pnl={} liquidatable={}",
        health_bps,
        equity,
        portfolio.locked_collateral,
        unrealized_pnl,
        report.is_liquidatable
    );

    Ok(report)
}

#[derive(Accounts)]
pub struct CheckHealth<'info> {
    /// Caller can be the user, a bot, or another program via CPI
    pub caller: Signer<'info>,

    #[account(
        seeds = [b"portfolio", portfolio.owner.as_ref()],
        bump = portfolio.bump
    )]
    pub portfolio: Account<'info, PortfolioAccount>,
}

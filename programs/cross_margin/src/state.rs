use anchor_lang::prelude::*;

/// One PortfolioAccount per user across the whole mrgin protocol.
/// Tracks shared collateral and all open exposure.
#[account]
pub struct PortfolioAccount {
    pub owner: Pubkey,
    pub vault: Pubkey,              // SPL token account holding the USDC
    pub total_collateral: u64,      // total deposited USDC (atoms)
    pub locked_collateral: u64,     // portion locked as margin for open positions
    /// Encoded list of open perp position keys (max 8 for MVP)
    pub perp_positions: [Pubkey; 8],
    pub perp_position_count: u8,
    /// Encoded list of open bet keys (max 8 for MVP)
    pub bets: [Pubkey; 8],
    pub bet_count: u8,
    pub bump: u8,
}

impl PortfolioAccount {
    pub const LEN: usize = 8       // discriminator
        + 32                       // owner
        + 32                       // vault
        + 8                        // total_collateral
        + 8                        // locked_collateral
        + 32 * 8                   // perp_positions
        + 1                        // perp_position_count
        + 32 * 8                   // bets
        + 1                        // bet_count
        + 1;                       // bump

    pub fn free_collateral(&self) -> u64 {
        self.total_collateral.saturating_sub(self.locked_collateral)
    }

    /// Portfolio health = total_collateral / locked_collateral in bps.
    /// Returns None if locked_collateral is 0 (no risk).
    pub fn health_bps(&self) -> Option<u64> {
        if self.locked_collateral == 0 {
            return None;
        }
        Some(
            self.total_collateral
                .saturating_mul(10_000)
                / self.locked_collateral,
        )
    }
}

/// Returned from check_health — used by other programs via CPI
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct HealthReport {
    pub total_collateral: u64,
    pub locked_collateral: u64,
    pub unrealized_pnl: i64,       // aggregate across all positions
    pub health_bps: u64,           // 10_000 = 100% = fully collateralized
    pub is_liquidatable: bool,     // true when health_bps < MAINTENANCE_MARGIN_BPS
}

pub const MAINTENANCE_MARGIN_BPS: u64 = 500;   // 5%
pub const INITIAL_MARGIN_BPS: u64 = 1_000;    // 10%
pub const MAX_POSITIONS: usize = 8;

/// Which product created a margin lock
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum ProductType {
    Perp,
    Bet,
}

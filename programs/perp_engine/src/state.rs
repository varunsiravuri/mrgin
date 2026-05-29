use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub quote_mint: Pubkey,
    pub oracle: Pubkey,
    pub vault: Pubkey,
    pub long_open_interest: u64,
    pub short_open_interest: u64,
    pub funding_rate: i64,
    pub last_funding_ts: i64,
    pub cumulative_funding: i64,
    pub mark_price: u64,           // cached mark price * 1e6; updated by set_oracle_price
    pub sequencer_authority: Pubkey, // CLOB: only this keypair can call fill_order
    pub next_order_id: u64,          // CLOB: auto-incrementing order counter
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8
        + 32 + 32 + 32 + 32   // authority, quote_mint, oracle, vault
        + 8 + 8                // long_oi, short_oi
        + 8 + 8 + 8            // funding_rate, last_funding_ts, cumulative_funding
        + 8                    // mark_price
        + 32 + 8               // sequencer_authority, next_order_id
        + 1;                   // bump
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub cross_margin_account: Pubkey,
    pub size: u64,
    pub collateral: u64,
    pub entry_price: u64,
    pub is_long: bool,
    pub entry_funding: i64,
    pub unrealized_pnl: i64,
    pub bump: u8,
}

impl Position {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 8 + 8 + 1;
}

/// A pending limit (or market) order in the CLOB.
/// Collateral is locked in cross_margin under this account's key.
#[account]
pub struct OrderAccount {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub order_id: u64,
    pub size: u64,
    pub collateral: u64,
    pub limit_price: u64,  // price * 1e6; 0 = market order
    pub is_long: bool,
    pub filled_size: u64,
    pub bump: u8,
}

impl OrderAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketParams {
    pub max_leverage: u8,
    pub funding_period: i64,
    pub maintenance_margin_bps: u16,
    pub liquidation_fee_bps: u16,
    pub sequencer_authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OpenPositionParams {
    pub size: u64,
    pub collateral: u64,
    pub is_long: bool,
    pub max_slippage_bps: u16,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlaceLimitOrderParams {
    pub size: u64,
    pub collateral: u64,
    pub limit_price: u64,  // 0 = market order
    pub is_long: bool,
}

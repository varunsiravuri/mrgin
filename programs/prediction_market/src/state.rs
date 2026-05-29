use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    Resolved,
    Cancelled,
}

/// Binary prediction market: "Will X happen by timestamp T?"
#[account]
pub struct PredictionMarket {
    pub authority: Pubkey,        // market creator / resolver
    pub oracle: Pubkey,           // Pyth feed used for resolution (optional)
    pub quote_mint: Pubkey,       // USDC
    pub vault: Pubkey,            // escrow for bets
    pub cross_margin_vault: Pubkey, // shared cross-margin vault (for cross-margined bets)
    pub description: [u8; 64],   // market question (fixed-length string)
    pub resolution_ts: i64,       // earliest timestamp resolution can happen
    pub total_yes: u64,           // total USDC bet YES
    pub total_no: u64,            // total USDC bet NO
    pub status: MarketStatus,
    pub outcome: bool,            // true = YES won, false = NO won
    pub bump: u8,
}

impl PredictionMarket {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 32 + 64 + 8 + 8 + 8 + 1 + 1 + 1 + 32;
}

/// One bet per (user, market)
#[account]
pub struct Bet {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub cross_margin_account: Pubkey,
    pub amount: u64,           // USDC bet amount
    pub is_yes: bool,          // direction
    pub claimed: bool,
    pub bump: u8,
}

impl Bet {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateMarketParams {
    pub description: [u8; 64],
    pub resolution_ts: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PlaceBetParams {
    pub amount: u64,
    pub is_yes: bool,
}

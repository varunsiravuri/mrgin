use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;
use state::{CreateMarketParams, PlaceBetParams};

declare_id!("ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7");

#[program]
pub mod prediction_market {
    use super::*;

    pub fn create_market(ctx: Context<CreateMarket>, params: CreateMarketParams) -> Result<()> {
        instructions::create_market::handler(ctx, params)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, params: PlaceBetParams) -> Result<()> {
        instructions::place_bet::handler(ctx, params)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: bool) -> Result<()> {
        instructions::resolve_market::handler(ctx, outcome)
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Permissionless: slashes a losing bet from the loser's portfolio.
    pub fn forfeit_lost_bet(ctx: Context<ForfeitLostBet>) -> Result<()> {
        instructions::forfeit_lost_bet::handler(ctx)
    }
}

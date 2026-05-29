use anchor_lang::prelude::*;

#[error_code]
pub enum PredictionError {
    #[msg("Market is not open for betting")]
    MarketNotOpen,
    #[msg("Market resolution window has not started")]
    ResolutionTooEarly,
    #[msg("Market is already resolved")]
    AlreadyResolved,
    #[msg("Bet already claimed")]
    AlreadyClaimed,
    #[msg("No winnings to claim — bet lost")]
    BetLost,
    #[msg("Cannot forfeit a winning bet")]
    BetWon,
    #[msg("Market has not been resolved yet")]
    MarketNotResolved,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Arithmetic overflow")]
    MathOverflow,
}

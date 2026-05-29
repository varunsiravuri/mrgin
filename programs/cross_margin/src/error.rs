use anchor_lang::prelude::*;

#[error_code]
pub enum CrossMarginError {
    #[msg("Portfolio would be undercollateralized after this action")]
    InsufficientFreeCollateral,
    #[msg("Portfolio is healthy — cannot liquidate")]
    PortfolioHealthy,
    #[msg("Max position slots reached (8)")]
    MaxPositionSlotsReached,
    #[msg("Max bet slots reached (8)")]
    MaxBetSlotsReached,
    #[msg("Position not found in portfolio")]
    PositionNotRegistered,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Wrong number of remaining accounts for health check")]
    WrongAccountCount,
    #[msg("Account data too short or malformed")]
    InvalidAccountData,
}

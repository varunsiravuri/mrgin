use anchor_lang::prelude::*;

#[error_code]
pub enum PerpError {
    #[msg("Position is still healthy — cannot liquidate")]
    PositionHealthy,
    #[msg("Exceeds max leverage for this market")]
    ExceedsMaxLeverage,
    #[msg("Insufficient collateral to open position")]
    InsufficientCollateral,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Market not initialized")]
    MarketNotInitialized,
    #[msg("Funding period has not elapsed yet")]
    FundingPeriodNotElapsed,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Price must be greater than zero")]
    InvalidPrice,
    #[msg("Mark price not set — call set_oracle_price first")]
    PriceNotSet,
    #[msg("Only the sequencer authority can fill orders")]
    UnauthorizedSequencer,
    #[msg("Order size exceeds available collateral leverage")]
    InsufficientOrderCollateral,
}

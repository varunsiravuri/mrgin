import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

// TODO: import generated types after `anchor build`
// import { CrossMargin } from "../target/types/cross_margin";

describe("cross_margin — integration tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("initializes a portfolio account", async () => {
    // 1. Derive portfolio PDA: [b"portfolio", user]
    // 2. Call cross_margin.methods.initializePortfolio()
    // 3. Assert portfolio.totalCollateral === 0, portfolio.lockedCollateral === 0
    console.log("TODO: implement after anchor build");
  });

  it("deposits USDC into shared vault", async () => {
    // 1. Fund user with USDC
    // 2. Call cross_margin.methods.deposit(1_000_000_000) // $1000 USDC
    // 3. Assert portfolio.totalCollateral === 1_000_000_000
    // 4. Assert vault balance increased
    console.log("TODO: implement after anchor build");
  });

  it("blocks withdrawal when collateral is locked", async () => {
    // 1. Deposit collateral
    // 2. Simulate locked_collateral (open a perp position that locks margin)
    // 3. Try to withdraw more than freeCollateral — should fail
    // 4. Assert CrossMarginError.InsufficientFreeCollateral
    console.log("TODO: implement after anchor build");
  });

  it("cross-liquidates an unhealthy portfolio", async () => {
    // 1. Portfolio with both a perp position and prediction bet open
    // 2. Simulate price move that drops health below 5%
    // 3. Liquidator calls cross_margin.methods.crossLiquidate()
    // 4. Assert portfolio positions cleared, liquidator paid fee
    console.log("TODO: implement after anchor build");
  });

  it("health check returns correct report", async () => {
    // 1. Open mixed positions (perp long + prediction bet)
    // 2. Call cross_margin.methods.checkHealth()
    // 3. Assert HealthReport fields match expected values
    console.log("TODO: implement after anchor build");
  });
});

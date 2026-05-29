import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";

// TODO: import generated types after `anchor build`
// import { PerpEngine } from "../target/types/perp_engine";

describe("perp_engine", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  // TODO: const program = anchor.workspace.PerpEngine as Program<PerpEngine>;

  it("initializes a SOL-PERP market", async () => {
    // Setup: create USDC mint + fund test wallets
    // 1. createMint(...) for USDC
    // 2. Derive market PDA: [b"market", quoteMint, oracle]
    // 3. Call program.methods.initializeMarket({ maxLeverage: 20, ... })
    // 4. Assert market.longOpenInterest === 0
    console.log("TODO: implement after anchor build");
  });

  it("opens a long position", async () => {
    // 1. Initialize market (from above)
    // 2. Fund user with USDC
    // 3. Derive position PDA: [b"position", user, market]
    // 4. Call program.methods.openPosition({ size, collateral, isLong: true })
    // 5. Assert position.size, position.entryPrice, market.longOpenInterest
    console.log("TODO: implement after anchor build");
  });

  it("settles funding rate", async () => {
    // 1. Warp time forward by FUNDING_PERIOD_SECS
    // 2. Call program.methods.settleFunding()
    // 3. Assert market.lastFundingTs updated, market.cumulativeFunding changed
    console.log("TODO: implement after anchor build");
  });

  it("liquidates an underwater position", async () => {
    // 1. Open position with minimal collateral (just above maintenance)
    // 2. Move oracle price to push position below maintenance
    // 3. Call program.methods.liquidate() from liquidator wallet
    // 4. Assert position account closed, liquidator received fee
    console.log("TODO: implement after anchor build");
  });
});

import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getCrossMarginProgram,
  getPerpEngineProgram,
  getWallet,
  createUsdcMint,
  createUserTokenAccount,
  initPortfolio,
  depositUsdc,
  marketPda,
  positionPda,
  fundKeypair,
  CROSS_MARGIN_PROGRAM_ID,
  PERP_ENGINE_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
} from "./helpers";

describe("perp_engine", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const crossMargin = getCrossMarginProgram(provider);
  const program = getPerpEngineProgram(provider);
  const owner = getWallet(provider).payer;
  let trader: Keypair;

  let quoteMint: PublicKey;
  let userAta: PublicKey;
  let portfolio: PublicKey;
  let vault: PublicKey;
  let oracle: PublicKey;
  let market: PublicKey;
  const vaultKeypair = Keypair.generate();

  before(async () => {
    trader = await fundKeypair(provider);
    quoteMint = await createUsdcMint(provider, owner);
    userAta = await createUserTokenAccount(
      provider,
      quoteMint,
      trader.publicKey,
      owner,
      5_000_000_000
    );

    const init = await initPortfolio(crossMargin, trader, quoteMint);
    portfolio = init.portfolio;
    vault = init.vault;

    await depositUsdc(
      crossMargin,
      trader,
      portfolio,
      vault,
      userAta,
      new BN(2_000_000_000)
    );

    oracle = Keypair.generate().publicKey;
    [market] = marketPda(quoteMint, oracle);

    await program.methods
      .initializeMarket({
        maxLeverage: 20,
        fundingPeriod: new BN(3600),
        maintenanceMarginBps: 500,
        liquidationFeeBps: 50,
        sequencerAuthority: owner.publicKey,
      })
      .accounts({
        authority: owner.publicKey,
        market,
        quoteMint,
        oracle,
        vault: vaultKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([vaultKeypair])
      .rpc();

    await program.methods
      .setOraclePrice(new BN(100_000_000))
      .accounts({
        authority: owner.publicKey,
        market,
      })
      .signers([owner])
      .rpc();
  });

  it("initializes a SOL-PERP market", async () => {
    const acct = await program.account.market.fetch(market);
    expect(acct.longOpenInterest.toNumber()).to.eq(0);
    expect(acct.shortOpenInterest.toNumber()).to.eq(0);
    expect(acct.markPrice.toNumber()).to.eq(100_000_000);
  });

  it("opens a long position", async () => {
    const [position] = positionPda(trader.publicKey, market);

    await program.methods
      .openPosition({
        size: new BN(1_000_000),
        collateral: new BN(100_000_000),
        isLong: true,
        maxSlippageBps: 50,
      })
      .accounts({
        owner: trader.publicKey,
        market,
        position,
        portfolio,
        crossMarginProgram: CROSS_MARGIN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([trader])
      .rpc();

    const pos = await program.account.position.fetch(position);
    expect(pos.size.toNumber()).to.eq(1_000_000);
    expect(pos.collateral.toNumber()).to.eq(100_000_000);
    expect(pos.isLong).to.eq(true);
    expect(pos.entryPrice.toNumber()).to.eq(100_000_000);

    const port = await crossMargin.account.portfolioAccount.fetch(portfolio);
    expect(port.lockedCollateral.toNumber()).to.eq(100_000_000);
    expect(port.perpPositionCount).to.eq(1);

    const mkt = await program.account.market.fetch(market);
    expect(mkt.longOpenInterest.toNumber()).to.eq(1_000_000);
  });

  it("tracks funding schedule on market init", async () => {
    const acct = await program.account.market.fetch(market);
    expect(acct.lastFundingTs.toNumber()).to.be.greaterThan(0);
    expect(acct.cumulativeFunding.toNumber()).to.eq(0);
  });

  it("refreshes position unrealized pnl after mark move", async () => {
    const [position] = positionPda(trader.publicKey, market);

    await program.methods
      .setOraclePrice(new BN(110_000_000))
      .accounts({
        authority: owner.publicKey,
        market,
      })
      .signers([owner])
      .rpc();

    await program.methods
      .refreshPosition()
      .accounts({
        caller: owner.publicKey,
        market,
        position,
      })
      .signers([owner])
      .rpc();

    const pos = await program.account.position.fetch(position);
    expect(pos.unrealizedPnl.toNumber()).to.be.greaterThan(0);
  });
});

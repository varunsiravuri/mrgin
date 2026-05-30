import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getCrossMarginProgram,
  getPredictionMarketProgram,
  getWallet,
  createUsdcMint,
  createUserTokenAccount,
  initPortfolio,
  depositUsdc,
  predMarketPda,
  betPda,
  fixedDescription,
  fundKeypair,
  CROSS_MARGIN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  SYSVAR_RENT_PUBKEY,
} from "./helpers";
import { sendAndConfirmTransaction } from "@solana/web3.js";

describe("prediction_market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const crossMargin = getCrossMarginProgram(provider);
  const program = getPredictionMarketProgram(provider);
  const owner = getWallet(provider).payer;
  let bettor: Keypair;

  let quoteMint: PublicKey;
  let userAta: PublicKey;
  let portfolio: PublicKey;
  let vault: PublicKey;
  let market: PublicKey;
  const marketVault = Keypair.generate();
  const resolutionTs = new BN(Math.floor(Date.now() / 1000) - 120);

  before(async () => {
    bettor = await fundKeypair(provider);
    quoteMint = await createUsdcMint(provider, owner);
    userAta = await createUserTokenAccount(
      provider,
      quoteMint,
      bettor.publicKey,
      owner,
      3_000_000_000
    );

    const init = await initPortfolio(crossMargin, bettor, quoteMint);
    portfolio = init.portfolio;
    vault = init.vault;

    await depositUsdc(
      crossMargin,
      bettor,
      portfolio,
      vault,
      userAta,
      new BN(1_000_000_000)
    );

    [market] = predMarketPda(bettor.publicKey, resolutionTs);

    const createTx = await program.methods
      .createMarket({
        description: fixedDescription("RCB vs GT IPL Final"),
        resolutionTs,
      })
      .accounts({
        authority: bettor.publicKey,
        market,
        quoteMint,
        vault: marketVault.publicKey,
        crossMarginVault: vault,
        oracle: bettor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([bettor, marketVault])
      .transaction();

    await sendAndConfirmTransaction(
      provider.connection,
      createTx,
      [bettor, marketVault],
      { commitment: "confirmed" }
    );
  });

  it("creates a prediction market", async () => {
    const acct = await program.account.predictionMarket.fetch(market);
    expect(acct.totalYes.toNumber()).to.eq(0);
    expect(acct.totalNo.toNumber()).to.eq(0);
    expect(acct.status).to.deep.eq({ open: {} });
  });

  it("places a YES bet locking cross-margin collateral", async () => {
    const [bet] = betPda(bettor.publicKey, market);
    const betAmount = new BN(50_000_000);

    await program.methods
      .placeBet({ amount: betAmount, isYes: true })
      .accounts({
        bettor: bettor.publicKey,
        market,
        bet,
        portfolio,
        crossMarginProgram: CROSS_MARGIN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettor])
      .transaction()
      .then((tx) =>
        sendAndConfirmTransaction(provider.connection, tx, [bettor], {
          commitment: "confirmed",
        })
      );

    const betAcct = await program.account.bet.fetch(bet);
    expect(betAcct.amount.toNumber()).to.eq(betAmount.toNumber());
    expect(betAcct.isYes).to.eq(true);

    const mkt = await program.account.predictionMarket.fetch(market);
    expect(mkt.totalYes.toNumber()).to.eq(betAmount.toNumber());

    const port = await crossMargin.account.portfolioAccount.fetch(portfolio);
    expect(port.lockedCollateral.toNumber()).to.eq(betAmount.toNumber());
    expect(port.betCount).to.eq(1);
  });

  it("resolves market and allows winner to claim", async () => {
    await program.methods
      .resolveMarket(true)
      .accounts({
        authority: bettor.publicKey,
        market,
      })
      .signers([bettor])
      .transaction()
      .then((tx) =>
        sendAndConfirmTransaction(provider.connection, tx, [bettor], {
          commitment: "confirmed",
        })
      );

    const mkt = await program.account.predictionMarket.fetch(market);
    expect(mkt.status).to.deep.eq({ resolved: {} });
    expect(mkt.outcome).to.eq(true);

    const [bet] = betPda(bettor.publicKey, market);

    await program.methods
      .claimWinnings()
      .accounts({
        winner: bettor.publicKey,
        market,
        bet,
        portfolio,
        crossMarginProgram: CROSS_MARGIN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([bettor])
      .transaction()
      .then((tx) =>
        sendAndConfirmTransaction(provider.connection, tx, [bettor], {
          commitment: "confirmed",
        })
      );

    const betAcct = await program.account.bet.fetch(bet);
    expect(betAcct.claimed).to.eq(true);
  });
});

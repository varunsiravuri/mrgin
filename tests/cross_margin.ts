import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getCrossMarginProgram,
  getWallet,
  createUsdcMint,
  createUserTokenAccount,
  initPortfolio,
  depositUsdc,
  portfolioPda,
  expectAnchorError,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "./helpers";

describe("cross_margin — integration tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = getCrossMarginProgram(provider);
  const owner = getWallet(provider).payer;

  let quoteMint: PublicKey;
  let userAta: PublicKey;
  let portfolio: PublicKey;
  let vault: PublicKey;

  const DEPOSIT_AMOUNT = new BN(1_000_000_000);

  before(async () => {
    quoteMint = await createUsdcMint(provider, owner);
    userAta = await createUserTokenAccount(
      provider,
      quoteMint,
      owner.publicKey,
      owner,
      2_000_000_000
    );
    const init = await initPortfolio(program, owner, quoteMint);
    portfolio = init.portfolio;
    vault = init.vault;
    await depositUsdc(
      program,
      owner,
      portfolio,
      vault,
      userAta,
      DEPOSIT_AMOUNT
    );
  });

  it("initializes a portfolio account", async () => {
    const acct = await program.account.portfolioAccount.fetch(portfolio);
    expect(acct.owner.toBase58()).to.eq(owner.publicKey.toBase58());
    expect(acct.totalCollateral.toNumber()).to.eq(DEPOSIT_AMOUNT.toNumber());
    expect(acct.lockedCollateral.toNumber()).to.eq(0);
  });

  it("deposits USDC into shared vault", async () => {
    const acct = await program.account.portfolioAccount.fetch(portfolio);
    expect(acct.totalCollateral.toNumber()).to.eq(DEPOSIT_AMOUNT.toNumber());

    const vaultAcct = await getAccount(provider.connection, vault);
    expect(Number(vaultAcct.amount)).to.eq(DEPOSIT_AMOUNT.toNumber());
  });

  it("health check returns correct report with no open risk", async () => {
    const report = await program.methods
      .checkHealth()
      .accounts({
        caller: owner.publicKey,
        portfolio,
      })
      .signers([owner])
      .view();

    expect(report.totalCollateral.toNumber()).to.eq(DEPOSIT_AMOUNT.toNumber());
    expect(report.lockedCollateral.toNumber()).to.eq(0);
    expect(report.unrealizedPnl.toNumber()).to.eq(0);
    expect(report.isLiquidatable).to.eq(false);
  });

  it("blocks withdrawal when collateral is locked", async () => {
    const fakePosition = Keypair.generate().publicKey;
    const lockAmount = new BN(800_000_000);

    await program.methods
      .lockMargin(fakePosition, lockAmount, { perp: {} })
      .accounts({
        caller: owner.publicKey,
        portfolio,
      })
      .signers([owner])
      .rpc();

    await expectAnchorError(
      program.methods
        .withdraw(new BN(300_000_000))
        .accounts({
          owner: owner.publicKey,
          portfolio,
          vault,
          userTokenAccount: userAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([owner])
        .rpc(),
      "InsufficientFreeCollateral"
    );

    await program.methods
      .withdraw(new BN(100_000_000))
      .accounts({
        owner: owner.publicKey,
        portfolio,
        vault,
        userTokenAccount: userAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([owner])
      .rpc();

    const acct = await program.account.portfolioAccount.fetch(portfolio);
    expect(acct.totalCollateral.toNumber()).to.eq(900_000_000);
    expect(acct.lockedCollateral.toNumber()).to.eq(800_000_000);
  });

  it("rejects cross-liquidation on a healthy portfolio", async () => {
    await expectAnchorError(
      program.methods
        .crossLiquidate()
        .accounts({
          liquidator: owner.publicKey,
          portfolio,
        })
        .signers([owner])
        .rpc(),
      "PortfolioHealthy"
    );
  });
});

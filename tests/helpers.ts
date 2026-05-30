import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CrossMargin } from "../target/types/cross_margin";
import { PerpEngine } from "../target/types/perp_engine";
import { PredictionMarket } from "../target/types/prediction_market";
import crossMarginIdl from "../target/idl/cross_margin.json";
import perpEngineIdl from "../target/idl/perp_engine.json";
import predictionMarketIdl from "../target/idl/prediction_market.json";

export const CROSS_MARGIN_PROGRAM_ID = new PublicKey(
  "2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm"
);
export const PERP_ENGINE_PROGRAM_ID = new PublicKey(
  "FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB"
);
export const PREDICTION_MARKET_PROGRAM_ID = new PublicKey(
  "ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7"
);

export function getWallet(provider: anchor.AnchorProvider): anchor.Wallet {
  return provider.wallet as anchor.Wallet;
}

export function getCrossMarginProgram(
  provider: anchor.AnchorProvider
): Program<CrossMargin> {
  return new Program(crossMarginIdl as CrossMargin, provider);
}

export function getPerpEngineProgram(
  provider: anchor.AnchorProvider
): Program<PerpEngine> {
  return new Program(perpEngineIdl as PerpEngine, provider);
}

export function getPredictionMarketProgram(
  provider: anchor.AnchorProvider
): Program<PredictionMarket> {
  return new Program(predictionMarketIdl as PredictionMarket, provider);
}

export function portfolioPda(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("portfolio"), owner.toBuffer()],
    CROSS_MARGIN_PROGRAM_ID
  );
}

export function marketPda(
  quoteMint: PublicKey,
  oracle: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("market"), quoteMint.toBuffer(), oracle.toBuffer()],
    PERP_ENGINE_PROGRAM_ID
  );
}

export function positionPda(
  owner: PublicKey,
  market: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), owner.toBuffer(), market.toBuffer()],
    PERP_ENGINE_PROGRAM_ID
  );
}

export function predMarketPda(
  authority: PublicKey,
  resolutionTs: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pred_market"),
      authority.toBuffer(),
      resolutionTs.toArrayLike(Buffer, "le", 8),
    ],
    PREDICTION_MARKET_PROGRAM_ID
  );
}

export function betPda(
  bettor: PublicKey,
  market: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), bettor.toBuffer(), market.toBuffer()],
    PREDICTION_MARKET_PROGRAM_ID
  );
}

export async function createUsdcMint(
  provider: anchor.AnchorProvider,
  payer: Keypair
): Promise<PublicKey> {
  return createMint(
    provider.connection,
    payer,
    payer.publicKey,
    null,
    6
  );
}

export async function createUserTokenAccount(
  provider: anchor.AnchorProvider,
  mint: PublicKey,
  owner: PublicKey,
  payer: Keypair,
  amount: number
): Promise<PublicKey> {
  const ata = await createAccount(
    provider.connection,
    payer,
    mint,
    owner
  );
  if (amount > 0) {
    await mintTo(
      provider.connection,
      payer,
      mint,
      ata,
      payer,
      amount
    );
  }
  return ata;
}

export async function initPortfolio(
  program: Program<CrossMargin>,
  owner: Keypair,
  quoteMint: PublicKey
) {
  const [portfolio] = portfolioPda(owner.publicKey);
  const vaultKeypair = Keypair.generate();

  const payerMatchesProvider = owner.publicKey.equals(
    program.provider.publicKey
  );
  const signers = payerMatchesProvider ? [vaultKeypair] : [owner, vaultKeypair];

  const builder = program.methods
    .initializePortfolio()
    .accounts({
      owner: owner.publicKey,
      portfolio,
      quoteMint,
      vault: vaultKeypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers(signers);

  if (payerMatchesProvider) {
    await builder.rpc();
  } else {
    const tx = await builder.transaction();
    await sendAndConfirmTransaction(
      program.provider.connection,
      tx,
      [owner, vaultKeypair],
      { commitment: "confirmed" }
    );
  }

  const portfolioAccount = await program.account.portfolioAccount.fetch(
    portfolio
  );
  return { portfolio, vault: portfolioAccount.vault, vaultKeypair };
}

export async function depositUsdc(
  program: Program<CrossMargin>,
  owner: Keypair,
  portfolio: PublicKey,
  vault: PublicKey,
  userTokenAccount: PublicKey,
  amount: BN
) {
  const payerMatchesProvider = owner.publicKey.equals(
    program.provider.publicKey
  );
  const builder = program.methods.deposit(amount).accounts({
    owner: owner.publicKey,
    portfolio,
    vault,
    userTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  });
  if (payerMatchesProvider) {
    await builder.rpc();
  } else {
    await builder.signers([owner]).rpc();
  }
}

export function fixedDescription(text: string): number[] {
  const buf = Buffer.alloc(64);
  Buffer.from(text).copy(buf);
  return Array.from(buf);
}

export async function expectAnchorError(
  promise: Promise<unknown>,
  code: string
) {
  try {
    await promise;
    throw new Error(`Expected Anchor error ${code}`);
  } catch (err: unknown) {
    const anchorErr = err as { error?: { errorCode?: { code?: string } } };
    const actual = anchorErr?.error?.errorCode?.code;
    if (actual !== code) {
      throw err;
    }
  }
}

export async function fundKeypair(
  provider: anchor.AnchorProvider,
  lamports = 5_000_000_000
): Promise<Keypair> {
  const kp = Keypair.generate();
  const sig = await provider.connection.requestAirdrop(kp.publicKey, lamports);
  await provider.connection.confirmTransaction(sig, "confirmed");
  return kp;
}

export { BN, TOKEN_PROGRAM_ID, SystemProgram, SYSVAR_RENT_PUBKEY, getAccount };

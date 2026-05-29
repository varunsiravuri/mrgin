/**
 * Creates the first SOL-PERP market on devnet.
 * Run from project root: npx tsx scripts/init-market.ts
 */
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
import * as fs from "fs";
import * as path from "path";

const RPC = "https://api.devnet.solana.com";
const PERP_ENGINE_ID = "FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB";
const USDC_MINT = "6h89qqoyzwvwGQLJ5SvWVQBuQtvFmzaGVqdMXo4K9k19";

const connection = new Connection(RPC, "confirmed");

// Deployer = authority
const authorityKp = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(path.join(process.env.HOME!, ".config/solana/id.json"), "utf-8")))
);

// Sequencer keypair
const sequencerKp = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(path.join(__dirname, "../.keys/sequencer.json"), "utf-8")))
);

const provider = new AnchorProvider(connection, new Wallet(authorityKp), { commitment: "confirmed" });

async function main() {
  console.log("Authority:", authorityKp.publicKey.toBase58());
  console.log("Sequencer:", sequencerKp.publicKey.toBase58());
  console.log("USDC Mint:", USDC_MINT);

  const idl = JSON.parse(fs.readFileSync(path.join(__dirname, "../app/perp_engine.json"), "utf-8"));
  const program = new Program(idl, provider) as any;

  const quoteMint = new PublicKey(USDC_MINT);

  // Use a deterministic oracle pubkey (just needs to exist as a PDA seed; price set via set_oracle_price)
  const oraclePubkey = Keypair.generate().publicKey;

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), quoteMint.toBuffer(), oraclePubkey.toBuffer()],
    new PublicKey(PERP_ENGINE_ID)
  );

  console.log("\nMarket PDA:", marketPDA.toBase58());
  console.log("Initializing market...");

  // Derive vault address that anchor will create
  const vaultKp = Keypair.generate();

  try {
    const tx = await program.methods.initializeMarket({
      maxLeverage: 20,
      fundingPeriod: new BN(3600),
      maintenanceMarginBps: 500,
      liquidationFeeBps: 50,
      sequencerAuthority: sequencerKp.publicKey,
    })
    .accounts({
      authority: authorityKp.publicKey,
      market: marketPDA,
      quoteMint,
      oracle: oraclePubkey,
      vault: vaultKp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([vaultKp])
    .rpc();

    console.log("Market initialized! Tx:", tx);
  } catch (e: any) {
    if (e.message?.includes("already in use")) {
      console.log("Market already exists, skipping init...");
    } else {
      throw e;
    }
  }

  console.log("\nSetting mark price to $100...");
  const priceTx = await program.methods
    .setOraclePrice(new BN(100_000_000))
    .accounts({
      authority: authorityKp.publicKey,
      market: marketPDA,
    })
    .rpc();
  console.log("Price set! Tx:", priceTx);

  console.log("\n=== Market ready ===");
  console.log("Market address:", marketPDA.toBase58());
  console.log("Oracle pubkey:", oraclePubkey.toBase58());
  console.log("\nAdd to app/.env:");
  console.log(`MARKET_ADDRESSES=${marketPDA.toBase58()}`);
  console.log("\nAdd to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_MARKET_ADDRESS=${marketPDA.toBase58()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

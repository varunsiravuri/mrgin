import "dotenv/config";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { runLiquidationBot } from "./liquidation-bot";
import { runFundingCrank } from "./funding-crank";

const connection = new Connection(process.env.HELIUS_RPC ?? "https://api.devnet.solana.com", "confirmed");
const botKeypair = Keypair.fromSecretKey(bs58.decode(process.env.BOT_SECRET_KEY!));
const provider = new AnchorProvider(connection, new Wallet(botKeypair), { commitment: "confirmed" });

async function main() {
  const perpIdl = await import("../../../target/idl/perp_engine.json");
  const crossMarginIdl = await import("../../../target/idl/cross_margin.json");

  const perpProgram = new Program((perpIdl.default ?? perpIdl) as any, provider);
  const crossMarginProgram = new Program((crossMarginIdl.default ?? crossMarginIdl) as any, provider);

  await Promise.all([
    runLiquidationBot(perpProgram, crossMarginProgram),
    runFundingCrank(perpProgram, botKeypair),
  ]);
}

main().catch(console.error);

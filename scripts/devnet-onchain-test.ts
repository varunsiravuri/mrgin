/**
 * Devnet E2E: deposit USDC → open perp position → verify Postgres indexer row.
 * Run from repo root: npx tsx scripts/devnet-onchain-test.ts
 */
import * as fs from "fs";
import * as path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotent,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { execSync } from "child_process";

function loadEnv() {
  const envPath = path.join(__dirname, "../app/.env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const RPC = process.env.HELIUS_RPC ?? "https://api.devnet.solana.com";
const USDC_MINT = new PublicKey(
  process.env.USDC_MINT ?? "6h89qqoyzwvwGQLJ5SvWVQBuQtvFmzaGVqdMXo4K9k19"
);
const MARKET = new PublicKey(
  process.env.MARKET_ADDRESSES?.split(",")[0] ??
    "FG2Ggfmyxt6LfzHXXZbBfMy35Z2HaKuBQFA8o3aCBPZQ"
);
const CROSS_MARGIN_ID = new PublicKey(
  process.env.CROSS_MARGIN_PROGRAM_ID ?? "2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm"
);
const PERP_ENGINE_ID = new PublicKey(
  process.env.PERP_ENGINE_PROGRAM_ID ?? "FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB"
);
const PSQL =
  process.env.PSQL ??
  (() => {
    try {
      return execSync("command -v psql", { encoding: "utf-8" }).trim();
    } catch {
      return "/opt/homebrew/opt/postgresql@16/bin/psql";
    }
  })();

const crossMarginIdl = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../target/idl/cross_margin.json"), "utf-8")
);
const perpEngineIdl = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../target/idl/perp_engine.json"), "utf-8")
);

function loadWallet(): Keypair {
  const p = path.join(process.env.HOME!, ".config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, "utf-8"))));
}

function portfolioPda(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("portfolio"), owner.toBuffer()],
    CROSS_MARGIN_ID
  )[0];
}

function positionPda(owner: PublicKey, market: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), owner.toBuffer(), market.toBuffer()],
    PERP_ENGINE_ID
  )[0];
}

async function ensureUsdc(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  amount: number
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(USDC_MINT, owner);
  await createAssociatedTokenAccountIdempotent(connection, payer, USDC_MINT, owner);
  const acct = await getAccount(connection, ata).catch(() => null);
  const have = acct ? Number(acct.amount) : 0;
  if (have < amount) {
    await mintTo(connection, payer, USDC_MINT, ata, payer, amount - have);
  }
  return ata;
}

async function pushTxToIndexer(connection: Connection, sig: string) {
  const tx = await connection.getTransaction(sig, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx?.meta?.logMessages) return;

  const payload = [
    {
      signature: sig,
      timestamp: tx.blockTime ?? Math.floor(Date.now() / 1000),
      feePayer: tx.transaction.message.getAccountKeys().get(0)?.toBase58(),
      meta: { logMessages: tx.meta.logMessages },
      accountData: [{ account: "x" }, { account: MARKET.toBase58() }],
    },
  ];

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HELIUS_WEBHOOK_AUTH) {
    headers.Authorization = process.env.HELIUS_WEBHOOK_AUTH;
  }

  await fetch(`${INDEXER}/webhook`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

async function waitForTrade(sig: string, timeoutMs = 45_000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const out = execSync(
        `PGPASSWORD=password ${PSQL} -U mrgin -d mrgin -t -c "SELECT id FROM trades WHERE signature = '${sig}'"`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      if (out.trim()) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  const owner = loadWallet();
  const connection = new Connection(RPC, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(owner), { commitment: "confirmed" });
  const crossMargin = new Program(crossMarginIdl, provider) as Program<any>;
  const perpEngine = new Program(perpEngineIdl, provider) as Program<any>;

  console.log("Trader:", owner.publicKey.toBase58());
  console.log("Market:", MARKET.toBase58());
  console.log("RPC:", RPC.replace(/api-key=[^&]+/, "api-key=***"));

  const portfolio = portfolioPda(owner.publicKey);
  const portfolioInfo = await connection.getAccountInfo(portfolio);

  let vault: PublicKey;
  if (!portfolioInfo) {
    console.log("\n1. Initializing portfolio...");
    const vaultKp = Keypair.generate();
    await (crossMargin as any).methods
      .initializePortfolio()
      .accounts({
        owner: owner.publicKey,
        portfolio,
        quoteMint: USDC_MINT,
        vault: vaultKp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([vaultKp])
      .rpc();
    const acct = await crossMargin.account.portfolioAccount.fetch(portfolio);
    vault = acct.vault;
    console.log("   Portfolio:", portfolio.toBase58());
  } else {
    const acct = await crossMargin.account.portfolioAccount.fetch(portfolio);
    vault = acct.vault;
    console.log("\n1. Portfolio exists:", portfolio.toBase58());
  }

  console.log("\n2. Minting / checking USDC...");
  const userAta = await ensureUsdc(connection, owner, owner.publicKey, 3_000_000_000);
  const bal = await getAccount(connection, userAta);
  console.log("   USDC balance:", Number(bal.amount) / 1e6);

  console.log("\n3. Depositing 2,000 USDC to cross-margin vault...");
  const depositSig = await (crossMargin as any).methods
    .deposit(new BN(2_000_000_000))
    .accounts({
      owner: owner.publicKey,
      portfolio,
      vault,
      userTokenAccount: userAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  console.log("   Tx:", depositSig);

  const position = positionPda(owner.publicKey, MARKET);
  const existingPos = await connection.getAccountInfo(position);
  let openSig: string;

  if (existingPos) {
    console.log("\n4. Position already open — skipping openPosition");
    const sigs = await connection.getSignaturesForAddress(position, { limit: 1 });
    openSig = sigs[0]?.signature ?? "";
    const pos = await perpEngine.account.position.fetch(position);
    console.log("   Position size:", pos.size.toString());
  } else {
    console.log("\n4. Opening long perp position...");
    openSig = await (perpEngine as any).methods
      .openPosition({
        size: new BN(1_000_000),
        collateral: new BN(100_000_000),
        isLong: true,
        maxSlippageBps: 50,
      })
      .accounts({
        owner: owner.publicKey,
        market: MARKET,
        position,
        portfolio,
        crossMarginProgram: CROSS_MARGIN_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("   Tx:", openSig);
    const pos = await perpEngine.account.position.fetch(position);
    console.log("   On-chain position size:", pos.size.toString());
    console.log("   Locked collateral:", pos.collateral.toString());
  }

  console.log("\n5. Waiting for indexer (Helius webhook → Postgres)...");
  let indexed = await waitForTrade(openSig, 20_000);
  if (!indexed) {
    console.log("   Webhook not received yet — replaying tx logs to local indexer...");
    await pushTxToIndexer(connection, openSig);
    indexed = await waitForTrade(openSig, 15_000);
  }

  if (!indexed) {
    throw new Error("Trade not found in Postgres after open position tx");
  }

  const row = execSync(
    `PGPASSWORD=password ${PSQL} -U mrgin -d mrgin -t -A -F',' -c "SELECT signature, event_type, market, size, entry_price FROM trades WHERE signature = '${openSig}'"`,
    { encoding: "utf-8" }
  ).trim();

  console.log("\n=== SUCCESS ===");
  console.log("Postgres trade row:", row);
  console.log("Explorer:", `https://explorer.solana.com/tx/${openSig}?cluster=devnet`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

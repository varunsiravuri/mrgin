import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";
import Redis from "ioredis";
import bs58 from "bs58";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const connection = new Connection(process.env.HELIUS_RPC ?? "https://api.devnet.solana.com", "confirmed");
const botKeypair = Keypair.fromSecretKey(bs58.decode(process.env.BOT_SECRET_KEY!));
const wallet = new Wallet(botKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

const MARKETS = (process.env.MARKET_ADDRESSES ?? "").split(",").filter(Boolean);
const POLL_MS = 30_000;
const MAINTENANCE_MARGIN_BPS = 500;

async function refreshAndCheckHealth(
  perpProgram: Program<any>,
  crossMarginProgram: Program<any>,
  marketPubkey: PublicKey
) {
  // Fetch all positions for this market
  const positions = await (perpProgram.account as any).position.all([
    { memcmp: { offset: 40, bytes: marketPubkey.toBase58() } }, // market field at offset 40
  ]);

  for (const { publicKey: positionPubkey, account: position } of positions) {
    try {
      // 1. Refresh unrealized PnL on-chain
      await (perpProgram as any).methods
        .refreshPosition()
        .accounts({ caller: botKeypair.publicKey, market: marketPubkey, position: positionPubkey })
        .rpc();

      // 2. Read portfolio health
      const [portfolioPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("portfolio"), new PublicKey(position.owner).toBuffer()],
        crossMarginProgram.programId
      );
      const portfolio = await (crossMarginProgram.account as any).portfolioAccount.fetch(portfolioPDA);

      const equity = Number(portfolio.totalCollateral) + Number(position.unrealizedPnl);
      const notional = (Number(position.size) * Number((await (perpProgram.account as any).market.fetch(marketPubkey)).markPrice)) / 1e6;
      if (notional === 0) continue;

      const healthBps = Math.floor((equity * 10_000) / notional);

      // Cache health in Redis for API
      await redis.set(`health:${position.owner}`, JSON.stringify({
        wallet: position.owner, healthBps, equity, notional,
        isLiquidatable: healthBps < MAINTENANCE_MARGIN_BPS, ts: Date.now()
      }), "EX", 60);

      if (healthBps < MAINTENANCE_MARGIN_BPS) {
        console.log(`[liquidator] Liquidating ${position.owner}: health=${healthBps}bps`);

        // Fetch all perp positions for remaining_accounts (check_health)
        const perpPositions = portfolio.perpPositions
          .slice(0, portfolio.perpPositionCount)
          .filter((k: PublicKey) => !k.equals(PublicKey.default));

        await (crossMarginProgram as any).methods
          .checkHealth()
          .accounts({ caller: botKeypair.publicKey, portfolio: portfolioPDA })
          .remainingAccounts(perpPositions.map((k: PublicKey) => ({ pubkey: k, isWritable: false, isSigner: false })))
          .rpc();

        // Execute liquidation via perp_engine
        await (perpProgram as any).methods
          .liquidate()
          .accounts({
            liquidator: botKeypair.publicKey,
            market: marketPubkey,
            position: positionPubkey,
            portfolio: portfolioPDA,
          })
          .rpc();

        await redis.publish("liquidations", JSON.stringify({
          owner: position.owner, market: marketPubkey.toBase58(), healthBps, ts: Date.now()
        }));
      }
    } catch (err) {
      console.error(`[liquidator] error on ${positionPubkey.toBase58()}:`, err);
    }
  }
}

export async function runLiquidationBot(perpProgram: Program<any>, crossMarginProgram: Program<any>) {
  console.log("[liquidator] starting — poll interval:", POLL_MS, "ms");
  const run = async () => {
    for (const market of MARKETS) {
      await refreshAndCheckHealth(perpProgram, crossMarginProgram, new PublicKey(market));
    }
  };
  await run();
  setInterval(run, POLL_MS);
}

import "dotenv/config";
import Redis from "ioredis";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
const pub = redis.duplicate(); // publisher for fill events

const connection = new Connection(process.env.HELIUS_RPC ?? "https://api.devnet.solana.com", "confirmed");
const sequencerKeypair = Keypair.fromSecretKey(bs58.decode(process.env.SEQUENCER_SECRET_KEY!));
const wallet = new Wallet(sequencerKeypair);
const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

const MARKETS = (process.env.MARKET_ADDRESSES ?? "").split(",").filter(Boolean);
const MATCH_INTERVAL_MS = 100;

interface OrderData {
  id: string;
  owner: string;
  market: string;
  size: number;
  collateral: number;
  limitPrice: number;
  isLong: boolean;
  filledSize: number;
  orderIdOnChain: number;
  portfolioPubkey: string;
  bump: number;
}

async function getBestBid(market: string): Promise<{ orderId: string; price: number } | null> {
  const res = await redis.zrevrange(`ob:${market}:bids`, 0, 0, "WITHSCORES");
  if (res.length < 2) return null;
  return { orderId: res[0], price: Number(res[1]) };
}

async function getBestAsk(market: string): Promise<{ orderId: string; price: number } | null> {
  const res = await redis.zrange(`ob:${market}:asks`, 0, 0, "WITHSCORES");
  if (res.length < 2) return null;
  return { orderId: res[0], price: Number(res[1]) };
}

async function matchMarket(market: string, program: Program<any>) {
  const bid = await getBestBid(market);
  const ask = await getBestAsk(market);
  if (!bid || !ask) return;
  if (bid.price < ask.price) return; // no cross

  const [makerRaw, takerRaw] = await Promise.all([
    redis.hgetall(`order:${ask.orderId}`),   // ask = maker (resting order)
    redis.hgetall(`order:${bid.orderId}`),   // bid = taker (aggressive)
  ]);

  if (!makerRaw.id || !takerRaw.id) return;
  const maker: OrderData = JSON.parse(JSON.stringify(makerRaw)) as OrderData;
  const taker: OrderData = JSON.parse(JSON.stringify(takerRaw)) as OrderData;

  const fillPrice = Math.floor((bid.price + ask.price) / 2);
  const fillSize = Math.min(Number(maker.size), Number(taker.size));

  try {
    const makerOrderPDA = new PublicKey(maker.id);
    const takerOrderPDA = new PublicKey(taker.id);
    const marketPubkey = new PublicKey(market);

    const [makerPositionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), new PublicKey(maker.owner).toBuffer(), marketPubkey.toBuffer()],
      program.programId
    );
    const [takerPositionPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), new PublicKey(taker.owner).toBuffer(), marketPubkey.toBuffer()],
      program.programId
    );

    await program.methods
      .fillOrder(new BN(fillPrice), new BN(fillSize))
      .accounts({
        sequencer: sequencerKeypair.publicKey,
        market: marketPubkey,
        makerOrder: makerOrderPDA,
        takerOrder: takerOrderPDA,
        makerPosition: makerPositionPDA,
        takerPosition: takerPositionPDA,
        makerPortfolio: new PublicKey(maker.portfolioPubkey),
        takerPortfolio: new PublicKey(taker.portfolioPubkey),
      })
      .rpc();

    // Remove filled orders from Redis
    await Promise.all([
      redis.zrem(`ob:${market}:asks`, ask.orderId),
      redis.zrem(`ob:${market}:bids`, bid.orderId),
      redis.del(`order:${ask.orderId}`, `order:${bid.orderId}`),
    ]);

    const fillEvent = { market, fillPrice, fillSize, maker: maker.owner, taker: taker.owner, ts: Date.now() };
    await pub.publish("fills", JSON.stringify(fillEvent));
    await pub.publish("book-update", JSON.stringify({ market }));

    console.log(`[matcher] filled: market=${market} price=${fillPrice} size=${fillSize}`);
  } catch (err) {
    console.error("[matcher] fill_order failed:", err);
  }
}

async function run() {
  console.log("[matcher] starting — markets:", MARKETS);
  const idl = await import("../../perp_engine.json", { assert: { type: "json" } });
  const program = new Program(idl.default as any, provider);

  setInterval(async () => {
    for (const market of MARKETS) {
      await matchMarket(market, program);
    }
  }, MATCH_INTERVAL_MS);
}

run().catch(console.error);

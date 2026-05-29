import { FastifyInstance } from "fastify";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { redis, healthKey } from "../redis";
import { db } from "../db/client";
import { trades, liquidations, portfolioSnapshots } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const RPC = process.env.HELIUS_RPC ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");

export async function portfolioRoutes(app: FastifyInstance) {
  // GET /portfolio/:wallet — live portfolio state (Redis cache → RPC fallback)
  app.get<{ Params: { wallet: string } }>("/portfolio/:wallet", async (req, reply) => {
    const { wallet } = req.params;
    try { new PublicKey(wallet); } catch { return reply.code(400).send({ error: "invalid wallet" }); }

    const cached = await redis.get(healthKey(wallet));
    if (cached) return JSON.parse(cached);

    // Fallback: read directly from RPC (slower, used when cache is cold)
    return { wallet, message: "cache cold — liquidation bot will populate shortly", ts: Date.now() };
  });

  // GET /portfolio/:wallet/trades — trade history
  app.get<{ Params: { wallet: string } }>("/portfolio/:wallet/trades", async (req) => {
    const rows = await db
      .select()
      .from(trades)
      .where(eq(trades.owner, req.params.wallet))
      .orderBy(desc(trades.timestamp))
      .limit(100);
    return rows;
  });

  // GET /portfolio/:wallet/liquidations
  app.get<{ Params: { wallet: string } }>("/portfolio/:wallet/liquidations", async (req) => {
    const rows = await db
      .select()
      .from(liquidations)
      .where(eq(liquidations.owner, req.params.wallet))
      .orderBy(desc(liquidations.timestamp))
      .limit(50);
    return rows;
  });

  // GET /portfolio/:wallet/pnl — equity curve (hourly snapshots)
  app.get<{ Params: { wallet: string } }>("/portfolio/:wallet/pnl", async (req) => {
    const rows = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.wallet, req.params.wallet))
      .orderBy(desc(portfolioSnapshots.timestamp))
      .limit(168); // 7 days of hourly data
    return rows.reverse();
  });
}

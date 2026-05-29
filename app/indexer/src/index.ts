import "dotenv/config";
import Fastify from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../api/src/db/schema";
import { BorshCoder, EventParser } from "@coral-xyz/anchor";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
const app = Fastify({ logger: true });

// Helius sends a POST with an array of enriched transactions
app.post<{ Body: any[] }>("/webhook", async (req, reply) => {
  const txs: any[] = Array.isArray(req.body) ? req.body : [req.body];

  for (const tx of txs) {
    const sig: string = tx.signature;
    const logs: string[] = tx.meta?.logMessages ?? [];

    try {
      await processLogs(sig, logs, tx);
    } catch (err) {
      app.log.error({ sig, err }, "indexer: processing failed");
    }
  }
  return reply.code(200).send({ ok: true });
});

async function processLogs(sig: string, logs: string[], tx: any) {
  for (const log of logs) {
    // Position opened
    if (log.includes("Position opened")) {
      const m = log.match(/size=(\d+) price=(\d+) long=(true|false)/);
      if (!m) continue;
      await db.insert(schema.trades).values({
        signature: sig,
        market: tx.accountData?.[1]?.account ?? "",
        owner: tx.feePayer,
        size: Number(m[1]),
        entryPrice: Number(m[2]),
        isLong: m[3] === "true",
        eventType: "opened",
        timestamp: new Date(tx.timestamp * 1000),
      }).onConflictDoNothing();
    }

    // Position closed
    if (log.includes("Position closed")) {
      const m = log.match(/exit=(\d+) pnl=(-?\d+)/);
      if (!m) continue;
      await db.insert(schema.trades).values({
        signature: sig,
        market: tx.accountData?.[1]?.account ?? "",
        owner: tx.feePayer,
        size: 0,
        exitPrice: Number(m[1]),
        realizedPnl: Number(m[2]),
        eventType: "closed",
        timestamp: new Date(tx.timestamp * 1000),
      }).onConflictDoNothing();
    }

    // Order filled
    if (log.includes("Order filled")) {
      const m = log.match(/price=(\d+) size=(\d+)/);
      if (!m) continue;
      await db.insert(schema.trades).values({
        signature: sig,
        market: tx.accountData?.[1]?.account ?? "",
        size: Number(m[2]),
        fillPrice: Number(m[1]),
        eventType: "filled",
        timestamp: new Date(tx.timestamp * 1000),
      }).onConflictDoNothing();
    }

    // Liquidation
    if (log.includes("Liquidated")) {
      const m = log.match(/health_bps=(-?\d+) pnl=(-?\d+)/);
      if (!m) continue;
      await db.insert(schema.liquidations).values({
        signature: sig,
        owner: tx.feePayer,
        liquidator: tx.feePayer,
        market: tx.accountData?.[1]?.account ?? "",
        markPrice: 0,
        healthBps: Number(m[1]),
        realizedPnl: Number(m[2]),
        size: 0,
        timestamp: new Date(tx.timestamp * 1000),
      }).onConflictDoNothing();
    }

    // Funding settled
    if (log.includes("Funding settled")) {
      const m = log.match(/rate=(-?\d+) cumulative=(-?\d+)/);
      if (!m) continue;
      await db.insert(schema.fundingEvents).values({
        signature: sig,
        market: tx.accountData?.[1]?.account ?? "",
        fundingRate: Number(m[1]),
        cumulativeFunding: Number(m[2]),
        markPrice: 0,
        timestamp: new Date(tx.timestamp * 1000),
      }).onConflictDoNothing();
    }
  }
}

app.get("/health", async () => ({ ok: true }));

app.listen({ port: Number(process.env.INDEXER_PORT ?? 3002), host: "0.0.0.0" }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
  app.log.info("indexer listening on :3002 for Helius webhooks");
});

import { FastifyInstance } from "fastify";
import { redis, bidKey, askKey, orderKey } from "../redis";
import { db } from "../db/client";
import { trades } from "../db/schema";
import { desc, eq } from "drizzle-orm";

export async function orderbookRoutes(app: FastifyInstance) {
  // GET /orderbook/:market — L2 snapshot
  app.get<{ Params: { market: string } }>("/orderbook/:market", async (req) => {
    const { market } = req.params;

    const [rawBids, rawAsks] = await Promise.all([
      redis.zrevrangebyscore(bidKey(market), "+inf", "-inf", "WITHSCORES", "LIMIT", 0, 20),
      redis.zrangebyscore(askKey(market), "-inf", "+inf", "WITHSCORES", "LIMIT", 0, 20),
    ]);

    const parseSide = async (raw: string[]) => {
      const levels: { price: number; size: number; orders: number }[] = [];
      for (let i = 0; i < raw.length; i += 2) {
        const data = await redis.hgetall(orderKey(raw[i]));
        const price = Number(raw[i + 1]);
        const existing = levels.find((l) => l.price === price);
        if (existing) {
          existing.size += Number(data.size ?? 0);
          existing.orders++;
        } else {
          levels.push({ price, size: Number(data.size ?? 0), orders: 1 });
        }
      }
      return levels;
    };

    const [bids, asks] = await Promise.all([parseSide(rawBids), parseSide(rawAsks)]);
    return { market, bids, asks, ts: Date.now() };
  });

  // GET /trades/:market — recent fills
  app.get<{ Params: { market: string }; Querystring: { limit?: number } }>(
    "/trades/:market",
    async (req) => {
      const { market } = req.params;
      const limit = Math.min(req.query.limit ?? 50, 200);
      const rows = await db
        .select()
        .from(trades)
        .where(eq(trades.market, market))
        .orderBy(desc(trades.timestamp))
        .limit(limit);
      return rows;
    }
  );
}

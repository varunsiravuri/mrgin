import { FastifyInstance } from "fastify";
import { redis, priceKey, statsKey } from "../redis";

export async function marketRoutes(app: FastifyInstance) {
  app.get("/markets", async () => {
    const markets = (process.env.MARKET_ADDRESSES ?? "").split(",").filter(Boolean);
    const results = await Promise.all(
      markets.map(async (market) => {
        const [price, stats] = await Promise.all([
          redis.get(priceKey(market)),
          redis.get(statsKey(market)),
        ]);
        return {
          address: market,
          markPrice: price ? Number(price) / 1e6 : null,
          ...(stats ? JSON.parse(stats) : {}),
        };
      })
    );
    return results;
  });

  app.get<{ Params: { market: string } }>("/markets/:market", async (req) => {
    const { market } = req.params;
    const [price, stats] = await Promise.all([
      redis.get(priceKey(market)),
      redis.get(statsKey(market)),
    ]);
    return {
      address: market,
      markPrice: price ? Number(price) / 1e6 : null,
      ...(stats ? JSON.parse(stats) : {}),
    };
  });
}

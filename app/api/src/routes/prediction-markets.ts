import type { FastifyInstance } from "fastify";

const MARKETS = [
  {
    id: "ipl-final-2026",
    sport: "IPL",
    question: "Will Royal Challengers Bengaluru (RCB) beat Gujarat Titans (GT) in the IPL 2026 Final?",
    resolvesAt: new Date("2026-05-31T23:59:59").toISOString(),
    yesPool: 312_400,
    noPool: 278_600,
    status: "Open",
    featured: true,
  },
  {
    id: "ipl-kohli-runs",
    sport: "IPL",
    question: "Will Virat Kohli score 50+ runs in the IPL 2026 Final (RCB vs GT)?",
    resolvesAt: new Date("2026-05-31T23:59:59").toISOString(),
    yesPool: 198_200,
    noPool: 142_800,
    status: "Open",
    featured: false,
  },
];

export async function predictionMarketRoutes(app: FastifyInstance) {
  app.get("/prediction-markets", async () => MARKETS);

  app.post<{ Params: { market: string }; Body: { amount?: number; isYes?: boolean } }>(
    "/prediction-markets/:market/bet",
    async (req) => {
      const market = MARKETS.find((m) => m.id === req.params.market);
      if (!market) return { ok: false, error: "market not found" };
      return {
        ok: true,
        demo: true,
        market: market.id,
        side: req.body?.isYes ? "yes" : "no",
        amount: req.body?.amount ?? 0,
        message: "Demo bet recorded — real bets execute on-chain via prediction_market program",
      };
    }
  );
}

import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { redis } from "./redis";
import { orderbookRoutes } from "./routes/orderbook";
import { portfolioRoutes } from "./routes/portfolio";
import { marketRoutes } from "./routes/markets";
import { predictionMarketRoutes } from "./routes/prediction-markets";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(websocket);

app.register(orderbookRoutes);
app.register(portfolioRoutes);
app.register(marketRoutes);
app.register(predictionMarketRoutes);

// WebSocket: real-time order book + fill streaming
app.register(async (fastify) => {
  fastify.get("/stream", { websocket: true }, (socket) => {
    const handler = (channel: string, message: string) => {
      if (socket.readyState === 1) socket.send(JSON.stringify({ channel, data: JSON.parse(message) }));
    };

    const sub = redis.duplicate();
    sub.subscribe("fills", "book-update", "liquidations");
    sub.on("message", handler);
    socket.on("close", () => { sub.unsubscribe(); sub.quit(); });
  });
});

app.get("/health", async () => ({ ok: true, ts: Date.now() }));

app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

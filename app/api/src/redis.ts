import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

// Order book keys
export const bidKey = (market: string) => `ob:${market}:bids`;
export const askKey = (market: string) => `ob:${market}:asks`;
export const orderKey = (orderId: string) => `order:${orderId}`;

// Cache keys
export const priceKey = (market: string) => `price:${market}`;
export const healthKey = (wallet: string) => `health:${wallet}`;
export const statsKey = (market: string) => `stats:${market}`;

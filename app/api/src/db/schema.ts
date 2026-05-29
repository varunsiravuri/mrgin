import { pgTable, serial, text, bigint, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  signature: text("signature").notNull().unique(),
  market: text("market").notNull(),
  maker: text("maker"),
  taker: text("taker"),
  owner: text("owner"),
  fillPrice: bigint("fill_price", { mode: "number" }),
  entryPrice: bigint("entry_price", { mode: "number" }),
  exitPrice: bigint("exit_price", { mode: "number" }),
  size: bigint("size", { mode: "number" }).notNull(),
  isLong: boolean("is_long"),
  realizedPnl: bigint("realized_pnl", { mode: "number" }),
  eventType: text("event_type").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (t) => ({
  marketIdx: index("trades_market_idx").on(t.market),
  ownerIdx: index("trades_owner_idx").on(t.owner),
}));

export const fundingEvents = pgTable("funding_events", {
  id: serial("id").primaryKey(),
  signature: text("signature").notNull().unique(),
  market: text("market").notNull(),
  fundingRate: bigint("funding_rate", { mode: "number" }).notNull(),
  cumulativeFunding: bigint("cumulative_funding", { mode: "number" }).notNull(),
  markPrice: bigint("mark_price", { mode: "number" }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const liquidations = pgTable("liquidations", {
  id: serial("id").primaryKey(),
  signature: text("signature").notNull().unique(),
  owner: text("owner").notNull(),
  liquidator: text("liquidator").notNull(),
  market: text("market").notNull(),
  markPrice: bigint("mark_price", { mode: "number" }).notNull(),
  healthBps: bigint("health_bps", { mode: "number" }).notNull(),
  realizedPnl: bigint("realized_pnl", { mode: "number" }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: serial("id").primaryKey(),
  wallet: text("wallet").notNull(),
  totalCollateral: bigint("total_collateral", { mode: "number" }).notNull(),
  lockedCollateral: bigint("locked_collateral", { mode: "number" }).notNull(),
  unrealizedPnl: bigint("unrealized_pnl", { mode: "number" }).notNull(),
  healthBps: bigint("health_bps", { mode: "number" }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (t) => ({
  walletIdx: index("snapshots_wallet_idx").on(t.wallet),
}));

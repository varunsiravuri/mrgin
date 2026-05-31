// ── Perp markets registry ────────────────────────────────────────────────────
// All perps settle in USDC, so adding a market is just a row here: the engine,
// paper-trading store, and cross-margin vault are all asset-agnostic.

export interface PerpMarket {
  /** Stable key used everywhere (paper-trading positions, markPrices map) */
  id: string;
  /** Base asset ticker, e.g. "SOL" */
  base: string;
  /** Display symbol, e.g. "SOL-PERP" */
  symbol: string;
  /** Binance spot symbol used for live price/chart/book/trades */
  binanceSymbol: string;
  /** Decimal places for price display */
  priceDecimals: number;
  /** Decimal places for size display */
  sizeDecimals: number;
  /** Short glyph for the selector (legacy — prefer TokenIcon with `base`) */
  icon: string;
  /** Logo asset key */
  logo: "SOL" | "BTC" | "ETH";
  /** Accent color for the market */
  color: string;
}

export const PERP_MARKETS: PerpMarket[] = [
  { id: "SOL-PERP", base: "SOL", symbol: "SOL-PERP", binanceSymbol: "SOLUSDT", priceDecimals: 2, sizeDecimals: 2, icon: "SOL", logo: "SOL", color: "#14f195" },
  { id: "BTC-PERP", base: "BTC", symbol: "BTC-PERP", binanceSymbol: "BTCUSDT", priceDecimals: 1, sizeDecimals: 4, icon: "BTC", logo: "BTC", color: "#f7931a" },
  { id: "ETH-PERP", base: "ETH", symbol: "ETH-PERP", binanceSymbol: "ETHUSDT", priceDecimals: 2, sizeDecimals: 3, icon: "ETH", logo: "ETH", color: "#8a92f5" },
];

export const DEFAULT_MARKET = PERP_MARKETS[0];

export function getMarket(id: string | null | undefined): PerpMarket {
  return PERP_MARKETS.find(m => m.id === id) ?? DEFAULT_MARKET;
}

export function getMarketByBinance(binanceSymbol: string): PerpMarket | undefined {
  return PERP_MARKETS.find(m => m.binanceSymbol === binanceSymbol);
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const BINANCE = "https://api.binance.com/api/v3";

// ── Internal API ──────────────────────────────────────────────────────────────

export async function fetchOrderBook(market: string) {
  const r = await fetch(`${API}/orderbook/${market}`);
  return r.json();
}

export async function fetchTrades(market: string) {
  const r = await fetch(`${API}/trades/${market}`);
  return r.json();
}

export async function fetchPortfolio(wallet: string) {
  const r = await fetch(`${API}/portfolio/${wallet}`);
  return r.json();
}

export async function fetchPnlHistory(wallet: string) {
  const r = await fetch(`${API}/portfolio/${wallet}/pnl`);
  return r.json();
}

export async function fetchMarkets() {
  const r = await fetch(`${API}/markets`);
  return r.json();
}

export async function fetchPredictionMarkets() {
  try {
    const r = await fetch(`${API}/prediction-markets`);
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

export async function placeBet(market: string, amount: number, isYes: boolean) {
  const r = await fetch(`${API}/prediction-markets/${market}/bet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, isYes }),
  });
  return r.json();
}

// ── Binance market data (always available) ────────────────────────────────────

export async function fetchBinanceTicker(symbol = "SOLUSDT") {
  const r = await fetch(`${BINANCE}/ticker/24hr?symbol=${symbol}`);
  if (!r.ok) throw new Error("binance ticker failed");
  return r.json();
}

export async function fetchBinanceKlines(symbol = "SOLUSDT", interval = "1m", limit = 200) {
  const r = await fetch(
    `${BINANCE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  if (!r.ok) throw new Error("binance klines failed");
  const raw: any[][] = await r.json();
  return raw.map(k => ({
    time: k[0] / 1000,       // seconds
    open:  Number(k[1]),
    high:  Number(k[2]),
    low:   Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}

export async function fetchBinanceDepth(symbol = "SOLUSDT", limit = 14) {
  const r = await fetch(`${BINANCE}/depth?symbol=${symbol}&limit=${limit}`);
  if (!r.ok) throw new Error("binance depth failed");
  const data = await r.json();
  return {
    bids: data.bids.map(([p, s]: string[]) => ({ price: Number(p), size: Number(s) })),
    asks: data.asks.map(([p, s]: string[]) => ({ price: Number(p), size: Number(s) })),
  };
}

export async function fetchBinanceRecentTrades(symbol = "SOLUSDT", limit = 40) {
  const r = await fetch(`${BINANCE}/trades?symbol=${symbol}&limit=${limit}`);
  if (!r.ok) throw new Error("binance trades failed");
  const data: any[] = await r.json();
  return data.reverse().map(t => ({
    id: t.id,
    price: Number(t.price),
    size: Number(t.qty),
    isBuy: !t.isBuyerMaker,
    time: t.time,
  }));
}

// ── WebSocket subscription ────────────────────────────────────────────────────

export function subscribeToStream(
  onFill: (data: any) => void,
  onBookUpdate: (data: any) => void,
  onLiquidation: (data: any) => void
): () => void {
  try {
    const wsUrl = API.replace("http", "ws") + "/stream";
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (evt) => {
      const { channel, data } = JSON.parse(evt.data);
      if (channel === "fills") onFill(data);
      if (channel === "book-update") onBookUpdate(data);
      if (channel === "liquidations") onLiquidation(data);
    };
    ws.onerror = () => {};
    return () => ws.close();
  } catch {
    return () => {};
  }
}

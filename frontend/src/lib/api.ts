const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

// WebSocket subscription for real-time updates
export function subscribeToStream(
  onFill: (data: any) => void,
  onBookUpdate: (data: any) => void,
  onLiquidation: (data: any) => void
): () => void {
  const wsUrl = API.replace("http", "ws") + "/stream";
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (evt) => {
    const { channel, data } = JSON.parse(evt.data);
    if (channel === "fills") onFill(data);
    if (channel === "book-update") onBookUpdate(data);
    if (channel === "liquidations") onLiquidation(data);
  };

  ws.onerror = () => console.warn("WS error");
  return () => ws.close();
}

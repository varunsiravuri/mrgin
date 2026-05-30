"use client";
import { useEffect, useRef, useState } from "react";

interface Level { price: number; size: number }
interface Book  { bids: Level[]; asks: Level[] }

const SYMBOL = "solusdt";
const LEVELS = 12;

function Side({ levels, side }: { levels: Level[]; side: "bid" | "ask" }) {
  const displayed = side === "ask" ? [...levels].reverse() : levels;
  const maxSize   = Math.max(...displayed.map(l => l.size), 0.001);
  const color     = side === "bid" ? "#22c55e" : "#ef4444";
  const bgColor   = side === "bid" ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)";

  return (
    <>
      {displayed.map((lvl, i) => (
        <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 10px", cursor: "default" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: `${(lvl.size / maxSize) * 100}%`, background: bgColor, pointerEvents: "none" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, position: "relative", zIndex: 1 }}>
            {lvl.price.toFixed(2)}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", position: "relative", zIndex: 1 }}>
            {lvl.size >= 1000 ? (lvl.size / 1000).toFixed(1) + "k" : lvl.size.toFixed(1)}
          </span>
        </div>
      ))}
    </>
  );
}

export function OrderBook({ market, markPrice }: { market: string; markPrice: number }) {
  const [book, setBook]   = useState<Book>({ bids: [], asks: [] });
  const [mid,  setMid]    = useState<number>(markPrice);
  const wsRef = useRef<WebSocket | null>(null);

  // Live order book via Binance WebSocket diff stream
  useEffect(() => {
    const bidsMap = new Map<number, number>();
    const asksMap = new Map<number, number>();

    function applyUpdates(updates: [string, string][], map: Map<number, number>) {
      for (const [p, s] of updates) {
        const price = Number(p), size = Number(s);
        if (size === 0) map.delete(price);
        else map.set(price, size);
      }
    }

    function getTop(map: Map<number, number>, side: "bid" | "ask"): Level[] {
      const sorted = [...map.entries()].sort((a, b) =>
        side === "bid" ? b[0] - a[0] : a[0] - b[0]
      );
      return sorted.slice(0, LEVELS).map(([price, size]) => ({ price, size }));
    }

    function flush(data: any) {
      applyUpdates(data.b ?? [], bidsMap);
      applyUpdates(data.a ?? [], asksMap);
      const bids = getTop(bidsMap, "bid");
      const asks = getTop(asksMap, "ask");
      setBook({ bids, asks });
      if (bids[0] && asks[0]) setMid((bids[0].price + asks[0].price) / 2);
    }

    // Snapshot first, then stream
    fetch(`https://api.binance.com/api/v3/depth?symbol=${SYMBOL.toUpperCase()}&limit=${LEVELS}`)
      .then(r => r.json())
      .then(snap => {
        for (const [p, s] of snap.bids) bidsMap.set(Number(p), Number(s));
        for (const [p, s] of snap.asks) asksMap.set(Number(p), Number(s));
        setBook({
          bids: getTop(bidsMap, "bid"),
          asks: getTop(asksMap, "ask"),
        });
      })
      .catch(() => {});

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL}@depth@100ms`);
    ws.onmessage = (evt) => {
      try { flush(JSON.parse(evt.data)); } catch { /* */ }
    };
    ws.onerror = () => {};
    wsRef.current = ws;

    return () => ws.close();
  }, []);

  const spread = book.asks[0] && book.bids[0]
    ? (book.asks[0].price - book.bids[0].price).toFixed(2)
    : null;

  const displayMid = mid || markPrice;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>Order Book</span>
        {spread && (
          <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            spread ${spread}
          </span>
        )}
      </div>

      {/* Column labels */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Price</span>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Size</span>
      </div>

      {/* Asks (red, flipped) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        <Side levels={book.asks} side="ask" />
      </div>

      {/* Mid price */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", borderTop: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)", background: "var(--bg-3)", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
          ${displayMid > 0 ? displayMid.toFixed(2) : "—"}
        </span>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mark</span>
      </div>

      {/* Bids (green) */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Side levels={book.bids} side="bid" />
      </div>
    </div>
  );
}

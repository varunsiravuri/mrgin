"use client";
import useSWR from "swr";
import { fetchOrderBook } from "@/lib/api";

interface Level { price: number; size: number; orders: number }

function Side({ levels, side, maxRows = 12 }: { levels: Level[]; side: "bid" | "ask"; maxRows?: number }) {
  const rows = side === "bid" ? levels.slice(0, maxRows) : [...levels].reverse().slice(0, maxRows);
  const maxSize = Math.max(...rows.map((l) => l.size), 1);
  const color = side === "bid" ? "#22c55e" : "#ef4444";
  const bg = side === "bid" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";

  return (
    <>
      {rows.map((lvl, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2px 10px",
            cursor: "default",
          }}
        >
          {/* depth bar */}
          <div style={{
            position: "absolute",
            top: 0, bottom: 0, right: 0,
            width: `${(lvl.size / maxSize) * 100}%`,
            background: bg,
            pointerEvents: "none",
          }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, position: "relative", zIndex: 1 }}>
            {lvl.price.toFixed(2)}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#555", position: "relative", zIndex: 1 }}>
            {lvl.size.toLocaleString()}
          </span>
        </div>
      ))}
    </>
  );
}

export function OrderBook({ market, markPrice }: { market: string; markPrice: number }) {
  const { data } = useSWR(
    market ? `ob:${market}` : null,
    () => fetchOrderBook(market),
    { refreshInterval: 600 }
  );

  const bids: Level[] = data?.bids ?? [];
  const asks: Level[] = data?.asks ?? [];
  const spread = asks[0] && bids[0] ? (asks[0].price - bids[0].price).toFixed(2) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#f0f0f0" }}>Order Book</span>
        {spread && (
          <span style={{ fontSize: 10, color: "#333", fontFamily: "var(--font-mono)" }}>
            ${spread}
          </span>
        )}
      </div>

      {/* Column labels */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Price</span>
        <span style={{ fontSize: 9, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Size</span>
      </div>

      {/* Asks (top, flipped — highest ask at top visually) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        {asks.length === 0
          ? <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4, flex: 1 }}><span style={{ fontSize: 10, color: "#1e1e1e" }}>no asks</span></div>
          : <Side levels={asks} side="ask" />}
      </div>

      {/* Spread / mid price */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 10px",
        borderTop: "1px solid #111",
        borderBottom: "1px solid #111",
        background: "#0d0d0d",
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>
          ${markPrice > 0 ? markPrice.toFixed(2) : "—"}
        </span>
        <span style={{ fontSize: 9, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mark</span>
      </div>

      {/* Bids (bottom) */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {bids.length === 0
          ? <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4 }}><span style={{ fontSize: 10, color: "#1e1e1e" }}>no bids</span></div>
          : <Side levels={bids} side="bid" />}
      </div>
    </div>
  );
}

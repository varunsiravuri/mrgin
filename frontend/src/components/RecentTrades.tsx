"use client";
import { useEffect, useRef, useState } from "react";

interface Trade {
  id: number;
  price: number;
  size: number;
  isBuy: boolean;
  time: number;
}

const SYMBOL = "solusdt";

export function RecentTrades({ market }: { market: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Seed with REST snapshot
    fetch(`https://api.binance.com/api/v3/trades?symbol=${SYMBOL.toUpperCase()}&limit=40`)
      .then(r => r.json())
      .then((data: any[]) => {
        const initial = data.reverse().map(t => ({
          id: t.id, price: Number(t.price), size: Number(t.qty),
          isBuy: !t.isBuyerMaker, time: t.time,
        }));
        setTrades(initial);
      })
      .catch(() => {});

    // Stream new trades live
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${SYMBOL}@trade`);
    ws.onmessage = (evt) => {
      try {
        const t = JSON.parse(evt.data);
        const trade: Trade = {
          id: t.t, price: Number(t.p), size: Number(t.q),
          isBuy: !t.m, time: t.T,
        };
        setTrades(prev => [trade, ...prev].slice(0, 50));
      } catch { /* */ }
    };
    ws.onerror = () => {};
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>Recent Trades</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>LIVE</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 10px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Price</span>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Qty</span>
        <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Time</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {trades.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>Connecting…</span>
          </div>
        ) : (
          trades.map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 10px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: t.isBuy ? "#22c55e" : "#ef4444", width: 70 }}>
                {t.price.toFixed(2)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textAlign: "right", width: 60 }}>
                {t.size.toFixed(2)}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-4)", textAlign: "right", width: 60 }}>
                {new Date(t.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PERP_MARKETS, getMarket, type PerpMarket } from "@/lib/markets";
import { TokenIcon } from "@/components/TokenIcon";
import type { BinanceTicker } from "@/lib/api";

function priceOf(m: PerpMarket, tickers: Record<string, BinanceTicker>) {
  const t = tickers[m.binanceSymbol];
  return t ? Number(t.lastPrice) : 0;
}
function changeOf(m: PerpMarket, tickers: Record<string, BinanceTicker>) {
  const t = tickers[m.binanceSymbol];
  return t ? Number(t.priceChangePercent) : 0;
}

export function PerpMarketSelector({
  selectedId,
  onSelect,
  tickers,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  tickers: Record<string, BinanceTicker>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getMarket(selectedId);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 10px", borderRadius: 8, cursor: "pointer",
          background: open ? "var(--bg-3)" : "var(--bg-2)",
          border: "1px solid var(--border-2)",
          transition: "background 120ms ease-out, border-color 120ms ease-out",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-3)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
      >
        <TokenIcon symbol={current.logo} size={18} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
          {current.symbol}
        </span>
        <ChevronDown size={13} color="var(--text-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease-out" }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 60,
            minWidth: 248, padding: 4, borderRadius: 12,
            background: "var(--bg-2)", border: "1px solid var(--border-2)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ padding: "6px 10px 8px", fontSize: 9, color: "var(--text-mono-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.16em" }}>
            USDC-settled perps
          </div>
          {PERP_MARKETS.map(m => {
            const price = priceOf(m, tickers);
            const change = changeOf(m, tickers);
            const up = change >= 0;
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onSelect(m.id); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? "var(--bg-3)" : "transparent",
                  transition: "background 120ms ease-out", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
                onMouseLeave={e => (e.currentTarget.style.background = active ? "var(--bg-3)" : "transparent")}
              >
                <TokenIcon symbol={m.logo} size={22} />
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{m.symbol}</span>
                  <span style={{ fontSize: 10, color: "var(--text-4)" }}>{m.base} · Perpetual</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)" }}>
                    {price > 0 ? `$${price.toLocaleString("en-US", { minimumFractionDigits: m.priceDecimals, maximumFractionDigits: m.priceDecimals })}` : "—"}
                  </span>
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: up ? "var(--green)" : "var(--red)" }}>
                    {price > 0 ? `${up ? "+" : ""}${change.toFixed(2)}%` : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { usePaperTrading, PaperPosition } from "@/lib/paper-trading";
import { getMarket } from "@/lib/markets";
import { TokenIcon } from "@/components/TokenIcon";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export function Positions({ markPrices }: { markPrices: Record<string, number> }) {
  const { state, closePosition } = usePaperTrading();
  const [closing, setClosing] = useState<string | null>(null);

  const positions = state.positions;
  const activeBets = state.bets.filter(b => b.status === "active");

  const markOf = (p: PaperPosition) => markPrices[p.market] || p.entryPrice;

  const getPnL = (p: PaperPosition) => {
    const mark = markOf(p);
    return p.side === "long"
      ? (mark - p.entryPrice) / p.entryPrice * p.notional
      : (p.entryPrice - mark) / p.entryPrice * p.notional;
  };

  const totalUnrealizedPnL = positions.reduce((s, p) => s + getPnL(p), 0);

  const handleClose = async (p: PaperPosition) => {
    setClosing(p.id);
    await new Promise(r => setTimeout(r, 300));
    const exitPrice = markOf(p) * (p.side === "long" ? 0.9995 : 1.0005);
    closePosition(p.id, exitPrice);
    const pnl = getPnL(p);
    toast.success(
      `${p.side === "long" ? "↑ Long" : "↓ Short"} closed · ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
      { icon: pnl >= 0 ? "💚" : "🔴" }
    );
    setClosing(null);
  };

  const fmt = (n: number, decimals = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>Positions</span>
        <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
          {positions.length > 0 ? `${positions.length} open` : "no open positions"}
        </span>
        {positions.length > 0 && (
          <>
            <div style={{ width: 1, height: 12, background: "var(--border-2)" }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: totalUnrealizedPnL >= 0 ? "#22c55e" : "#ef4444" }}>
              Unrealized: {totalUnrealizedPnL >= 0 ? "+" : "-"}${fmt(Math.abs(totalUnrealizedPnL))}
            </span>
          </>
        )}
        {activeBets.length > 0 && (
          <>
            <div style={{ width: 1, height: 12, background: "var(--border-2)" }} />
            <span style={{ fontSize: 10, color: "var(--text-4)" }}>{activeBets.length} active bet{activeBets.length !== 1 ? "s" : ""}</span>
          </>
        )}
      </div>

      {positions.length === 0 && activeBets.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
            No open positions · use the trade form to get started
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Side", "Symbol", "Size", "Entry", "Mark", "PnL", "ROE", "Liq. ~", "Notional", "Margin", ""].map(col => (
                  <th key={col} style={{
                    textAlign: "left", padding: "5px 12px",
                    fontSize: 9, color: "var(--text-4)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    fontWeight: 500, whiteSpace: "nowrap",
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const pnl = getPnL(p);
                const roe = (pnl / p.collateral) * 100;
                const mark = markOf(p);
                const pd = getMarket(p.market).priceDecimals;
                const liqDelta = p.collateral / p.notional;
                const liqPrice = p.side === "long"
                  ? p.entryPrice * (1 - liqDelta * 0.9)
                  : p.entryPrice * (1 + liqDelta * 0.9);
                const isLosing = (p.side === "long" && mark < p.entryPrice) || (p.side === "short" && mark > p.entryPrice);

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                        background: p.side === "long" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: p.side === "long" ? "#22c55e" : "#ef4444",
                        border: `1px solid ${p.side === "long" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        {p.side === "long" ? "↑ Long" : "↓ Short"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <TokenIcon symbol={getMarket(p.market).logo} size={16} />
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)", fontWeight: 600 }}>{p.symbol}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-4)" }}>{p.leverage}× lev</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
                      {fmt(p.size, 4)}
                    </td>
                    <td className="tnum" style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>
                      ${fmt(p.entryPrice, pd)}
                    </td>
                    <td className="tnum" style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: isLosing ? "#ef4444" : "var(--text-2)" }}>
                      ${fmt(mark, pd)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: pnl >= 0 ? "#22c55e" : "#ef4444" }}>
                        {pnl >= 0 ? "+" : "-"}${fmt(Math.abs(pnl))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: roe >= 0 ? "#22c55e" : "#ef4444" }}>
                        {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
                      </div>
                    </td>
                    <td className="tnum" style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "#ef4444" }}>
                      ${fmt(liqPrice, pd)}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                      ${fmt(p.notional)}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                      ${fmt(p.collateral)}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button
                        onClick={() => handleClose(p)}
                        disabled={closing === p.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border-2)",
                          background: "none", color: "var(--text-3)",
                          fontSize: 11, fontWeight: 600, cursor: "pointer",
                          fontFamily: "var(--font-sans)", transition: "all 0.12s",
                          opacity: closing === p.id ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-3)"; }}
                      >
                        <X size={11} />
                        {closing === p.id ? "Closing…" : "Close"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Active bets as rows */}
              {activeBets.map(b => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border)", opacity: 0.75 }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                      background: b.side === "yes" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      color: b.side === "yes" ? "#22c55e" : "#ef4444",
                      border: `1px solid ${b.side === "yes" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}>
                      {b.side.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 600 }}>{b.emoji} {b.sport}</div>
                    <div style={{ fontSize: 9, color: "var(--text-4)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.question}</div>
                  </td>
                  <td colSpan={5} style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>
                    Bet ${b.amount.toFixed(2)} @ {b.odds.toFixed(2)}× → ${b.potentialWin.toFixed(2)} if {b.side}
                  </td>
                  <td colSpan={4} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

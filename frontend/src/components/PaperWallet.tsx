"use client";
import { useState } from "react";
import { usePaperTrading } from "@/lib/paper-trading";
import { TrendingUp, TrendingDown, RefreshCw, X, Clock } from "lucide-react";

interface Props {
  markPrices?: Record<string, number>;
}

export function PaperWallet({ markPrices = {} }: Props) {
  const { state, equity, unrealizedPnL, reset } = usePaperTrading();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const eq = equity(markPrices);
  const upnl = unrealizedPnL(markPrices);
  const totalPnL = eq - 5000;
  const isUp = totalPnL >= 0;

  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ position: "relative" }}>
      {/* ── Compact chip ────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 12px", borderRadius: 8,
          background: "var(--bg-2)", border: "1px solid var(--border-2)",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-3)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>
            {fmt(eq)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
            {isUp ? <TrendingUp size={9} color="#22c55e" /> : <TrendingDown size={9} color="#ef4444" />}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: isUp ? "#22c55e" : "#ef4444" }}>
              {isUp ? "+" : "-"}{fmt(totalPnL)} all time
            </span>
          </div>
        </div>
      </button>

      {/* ── Dropdown panel ──────────────────────── */}
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 320, background: "var(--bg-2)",
            border: "1px solid var(--border-2)", borderRadius: 14,
            zIndex: 99, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>Account</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Demo funds · Reset anytime</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
                <X size={14} />
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)" }}>
              {[
                { label: "Total Equity", val: fmt(eq), color: "var(--text-1)" },
                { label: "Free Balance", val: fmt(state.freeBalance), color: "var(--text-1)" },
                { label: "Locked", val: fmt(state.lockedCollateral), color: "var(--text-2)" },
                { label: "Unrealized P&L", val: `${upnl >= 0 ? "+" : "-"}${fmt(upnl)}`, color: upnl >= 0 ? "#22c55e" : "#ef4444" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: "var(--bg-2)", padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Open positions */}
            {state.positions.length > 0 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Positions ({state.positions.length})
                </div>
                {state.positions.map(p => {
                  const mark = markPrices[p.market] ?? p.entryPrice;
                  const pnl = p.side === "long"
                    ? (mark - p.entryPrice) / p.entryPrice * p.notional
                    : (p.entryPrice - mark) / p.entryPrice * p.notional;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: p.side === "long" ? "#22c55e" : "#ef4444" }}>
                          {p.side.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-2)", marginLeft: 6 }}>{p.symbol}</span>
                        <span style={{ fontSize: 10, color: "var(--text-4)", marginLeft: 4, fontFamily: "var(--font-mono)" }}>{p.leverage}×</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: pnl >= 0 ? "#22c55e" : "#ef4444" }}>
                          {pnl >= 0 ? "+" : "-"}{fmt(pnl)}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-4)" }}>
                          col {fmt(p.collateral)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active bets */}
            {state.bets.filter(b => b.status === "active").length > 0 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                  Active Bets ({state.bets.filter(b => b.status === "active").length})
                </div>
                {state.bets.filter(b => b.status === "active").map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{b.emoji}</span>
                      <span style={{ fontSize: 10, color: b.side === "yes" ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{b.side.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: "var(--text-3)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.question}</span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>-{fmt(b.amount)}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#22c55e" }}>→ {fmt(b.potentialWin)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent history */}
            {state.history.length > 1 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  <Clock size={9} color="var(--text-4)" />
                  <span style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent</span>
                </div>
                {state.history.slice(0, 5).map(h => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{h.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: h.pnl !== undefined ? (h.pnl >= 0 ? "#22c55e" : "#ef4444") : "var(--text-4)", flexShrink: 0 }}>
                      {h.pnl !== undefined ? `${h.pnl >= 0 ? "+" : "-"}${fmt(h.pnl)}` : fmt(h.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Reset */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
              {confirming ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { reset(); setConfirming(false); setOpen(false); }} style={{
                    flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid #ef4444",
                    background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}>
                    Yes, reset to $5,000
                  </button>
                  <button onClick={() => setConfirming(false)} style={{
                    flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid var(--border-2)",
                    background: "none", color: "var(--text-3)",
                    fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)",
                  }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirming(true)} style={{
                  width: "100%", padding: "8px 0", borderRadius: 7,
                  border: "1px solid var(--border)", background: "none",
                  color: "var(--text-4)", fontSize: 12, cursor: "pointer",
                  fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "color 0.12s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                >
                  <RefreshCw size={11} />
                  Reset account to $5,000
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

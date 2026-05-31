"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, History as HistoryIcon, Lock } from "lucide-react";
import { usePaperTrading } from "@/lib/paper-trading";
import { useAuth } from "@/lib/auth";
import { getMarket } from "@/lib/markets";
import { TokenIcon } from "@/components/TokenIcon";

const fmtUsd = (n: number) =>
  `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TradeHistory() {
  const { state } = usePaperTrading();
  const { user, openAuth } = useAuth();

  const resolvedBets = useMemo(
    () => state.bets.filter(b => b.status !== "active").sort((a, b) => b.placedAt - a.placedAt),
    [state.bets],
  );

  const stats = useMemo(() => {
    const trades = state.closedTrades;
    const wins = trades.filter(t => t.pnl > 0).length;
    const realized = trades.reduce((a, t) => a + t.pnl, 0)
      + resolvedBets.reduce((a, b) => a + (b.status === "won" ? b.potentialWin - b.amount : -b.amount), 0);
    const total = trades.length + resolvedBets.length;
    const betWins = resolvedBets.filter(b => b.status === "won").length;
    const winRate = total > 0 ? ((wins + betWins) / total) * 100 : 0;
    return { count: total, winRate, realized };
  }, [state.closedTrades, resolvedBets]);

  const empty = state.closedTrades.length === 0 && resolvedBets.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
        <Stat label="Closed trades" value={String(stats.count)} />
        <Stat label="Win rate" value={`${stats.winRate.toFixed(0)}%`} />
        <Stat
          label="Realized PnL"
          value={fmtUsd(stats.realized)}
          color={stats.realized >= 0 ? "var(--green)" : "var(--red)"}
        />
      </div>

      {/* Sign-in nudge */}
      {!user && !empty && (
        <button onClick={openAuth} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10,
          background: "var(--bg-2)", border: "1px dashed var(--border-3)", cursor: "pointer", textAlign: "left", width: "100%",
        }}>
          <Lock size={15} color="var(--amber)" />
          <span style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
            This history is saved only in this browser. <span style={{ color: "var(--green)", fontWeight: 600 }}>Sign in</span> to keep it across devices.
          </span>
        </button>
      )}

      {empty ? (
        <div style={{ padding: "48px 20px", textAlign: "center", border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg-2)" }}>
          <HistoryIcon size={26} color="var(--text-4)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 600, marginBottom: 4 }}>No closed trades yet</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
            Open a position and close it — your exits, PnL, and ROE will show up here.
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--bg-2)" }}>
          {/* header row */}
          <div style={headRow}>
            <div>Market</div>
            <div style={{ textAlign: "right" }}>Entry → Exit</div>
            <div style={{ textAlign: "right" }}>Size</div>
            <div style={{ textAlign: "right" }}>PnL / ROE</div>
            <div style={{ textAlign: "right" }}>Closed</div>
          </div>

          {state.closedTrades.map(t => {
            const mkt = getMarket(t.market);
            const dec = mkt.priceDecimals;
            const up = t.pnl >= 0;
            return (
              <div key={t.id + t.closedAt} style={dataRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <TokenIcon symbol={mkt.logo} size={16} />
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 5,
                    fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                    background: t.side === "long" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                    color: t.side === "long" ? "var(--green)" : "var(--red)",
                  }}>
                    {t.side === "long" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {t.side === "long" ? "LONG" : "SHORT"}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-1)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{t.symbol}</span>
                  <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>{t.leverage}×</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>
                  ${t.entryPrice.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}
                  <span style={{ color: "var(--text-4)" }}> → </span>
                  ${t.exitPrice.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec })}
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>
                  {t.size} <span style={{ color: "var(--text-4)" }}>{t.symbol.replace("-PERP", "")}</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: up ? "var(--green)" : "var(--red)" }}>
                    {up ? "+" : "-"}{fmtUsd(Math.abs(t.pnl)).replace("-", "")}
                  </div>
                  <div style={{ fontSize: 10.5, color: up ? "var(--green)" : "var(--red)", opacity: 0.75 }}>
                    {up ? "+" : ""}{t.roe.toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>{timeAgo(t.closedAt)}</div>
              </div>
            );
          })}

          {resolvedBets.map(b => {
            const won = b.status === "won";
            const pnl = won ? b.potentialWin - b.amount : -b.amount;
            return (
              <div key={b.id} style={dataRow}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14 }}>{b.emoji}</span>
                  <span style={{ fontSize: 12, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.question}</span>
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textTransform: "uppercase" }}>
                  Bet {b.side}
                </div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)" }}>{fmtUsd(b.amount)}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: won ? "var(--green)" : "var(--red)" }}>
                    {won ? "+" : "-"}{fmtUsd(Math.abs(pnl)).replace("-", "")}
                  </div>
                  <div style={{ fontSize: 10.5, color: won ? "var(--green)" : "var(--red)", opacity: 0.75 }}>{won ? "WON" : "LOST"}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>{timeAgo(b.placedAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--bg-2)", padding: "14px 16px" }}>
      <div style={{ fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", color: color ?? "var(--text-1)" }}>{value}</div>
    </div>
  );
}

const headRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1.6fr 1.3fr 0.9fr 1fr 0.7fr", gap: 12,
  padding: "10px 16px", borderBottom: "1px solid var(--border)",
  fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)",
};

const dataRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1.6fr 1.3fr 0.9fr 1fr 0.7fr", gap: 12,
  padding: "12px 16px", borderBottom: "1px solid var(--border)", alignItems: "center",
};

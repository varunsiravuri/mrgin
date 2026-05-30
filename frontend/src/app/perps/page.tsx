"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Activity, ChevronLeft } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { fetchMarkets } from "@/lib/api";
import { OrderBook } from "@/components/OrderBook";
import { Chart } from "@/components/Chart";
import { TradeForm } from "@/components/TradeForm";
import { RecentTrades } from "@/components/RecentTrades";
import { Positions } from "@/components/Positions";
import { Portfolio } from "@/components/Portfolio";
import { MarketSelector } from "@/components/MarketSelector";
import { IntervalSelector, type Interval } from "@/components/IntervalSelector";

type Tab = "Trade" | "Portfolio";

export default function PerpsPage() {
  const [tab, setTab] = useState<Tab>("Trade");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [interval, setInterval] = useState<Interval>("1h");

  const { data: markets = [] } = useSWR("markets", fetchMarkets, { refreshInterval: 3000 });
  const market = selectedMarket ?? markets?.[0]?.address ?? null;
  const currentMarket = markets.find((m: any) => m.address === market);
  const markPrice: number = currentMarket?.markPrice ?? 0;
  const change24h: number = currentMarket?.change24h ?? 0;
  const fundingRate: number = currentMarket?.fundingRate ?? 0;
  const openInterest: number = currentMarket?.openInterest ?? 0;

  const isPositive = change24h >= 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>

      {/* ── Top nav bar ── */}
      <header style={{
        height: 48, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid var(--border)",
        background: "rgba(10,10,10,0.98)", gap: 0,
      }}>
        {/* Back + logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-4)", textDecoration: "none", padding: "4px 6px", borderRadius: 5, transition: "color 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
          >
            <ChevronLeft size={14} />
          </Link>
          <div style={{ width: 1, height: 16, background: "var(--border-2)" }} />
          <Activity size={13} color="var(--text-3)" />
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "var(--text-1)", lineHeight: 1 }}>mrgin</span>
          <span style={{ color: "var(--border-2)", fontSize: 13, margin: "0 4px" }}>/</span>
          <span style={{ color: "var(--text-3)", fontSize: 12 }}>Perps</span>
        </div>

        {/* Market stats */}
        {markPrice > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
            {[
              { label: "Mark", value: `$${markPrice.toFixed(2)}`, color: isPositive ? "#22c55e" : "#ef4444" },
              { label: "24h", value: `${isPositive ? "+" : ""}${change24h.toFixed(2)}%`, color: isPositive ? "#22c55e" : "#ef4444" },
              { label: "OI", value: `$${openInterest > 1e6 ? (openInterest / 1e6).toFixed(2) + "M" : openInterest.toLocaleString()}`, color: "var(--text-2)" },
              { label: "Funding", value: `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`, color: fundingRate >= 0 ? "#22c55e" : "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 8, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 1 }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Right: tabs + devnet + docs + wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <div style={{ display: "flex", background: "var(--bg-3)", border: "1px solid var(--border)", borderRadius: 8, padding: 2, gap: 2 }}>
            {(["Trade", "Portfolio"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                background: tab === t ? "var(--border-2)" : "none",
                color: tab === t ? "var(--text-1)" : "var(--text-3)",
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 3s infinite" }} />
            <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>devnet</span>
          </div>

          <Link href="/docs" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--text-4)", padding: "4px 8px", cursor: "pointer", transition: "color 0.12s" }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = "var(--text-2)")}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = "var(--text-4)")}
            >Docs</span>
          </Link>

          <WalletMultiButton />
        </div>
      </header>

      {/* ── Portfolio tab ── */}
      {tab === "Portfolio" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Portfolio />
        </div>
      )}

      {/* ── Trade tab ── */}
      {tab === "Trade" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          {!market ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border-2)", borderTopColor: "var(--text-3)", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: "var(--text-4)", fontSize: 12, fontFamily: "var(--font-mono)" }}>Loading markets…</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Main 3-column trading area ── */}
              <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

                {/* LEFT: Order Book */}
                <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <OrderBook market={market} markPrice={markPrice} />
                </div>

                {/* CENTER: Chart + Toolbar + Recent Trades */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MarketSelector markets={markets} selected={market} onSelect={setSelectedMarket} />
                      <span style={{ color: "var(--border-2)", fontSize: 10, fontFamily: "var(--font-mono)" }}>USDC-settled</span>
                    </div>
                    <IntervalSelector value={interval} onChange={setInterval} />
                  </div>

                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Chart market={market} interval={interval} markPrice={markPrice} />
                  </div>

                  <div style={{ height: 160, flexShrink: 0, borderTop: "1px solid var(--border)", overflow: "hidden" }}>
                    <RecentTrades market={market} />
                  </div>
                </div>

                {/* RIGHT: Trade Form */}
                <div style={{ width: 290, flexShrink: 0, borderLeft: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <TradeForm market={market} markPrice={markPrice} />
                </div>
              </div>

              {/* BOTTOM: Positions */}
              <div style={{ height: 190, flexShrink: 0, borderTop: "1px solid var(--border)", overflow: "hidden" }}>
                <Positions market={market} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

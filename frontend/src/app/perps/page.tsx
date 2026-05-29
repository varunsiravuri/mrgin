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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a", overflow: "hidden" }}>

      {/* ── Top nav bar ── */}
      <header style={{
        height: 48, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid #111",
        gap: 0,
      }}>
        {/* Back + logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "#444", textDecoration: "none", fontSize: 12 }}>
            <ChevronLeft size={14} />
          </Link>
          <Activity size={13} color="#666" />
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "#f0f0f0", lineHeight: 1 }}>mrgin</span>
          <span style={{ color: "#222", fontSize: 13, margin: "0 4px" }}>/</span>
          <span style={{ color: "#666", fontSize: 12 }}>Perps</span>
        </div>

        {/* Market stats */}
        {markPrice > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 8, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mark Price</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: isPositive ? "#22c55e" : "#ef4444" }}>
                ${markPrice.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 8, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>24h Change</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: isPositive ? "#22c55e" : "#ef4444" }}>
                {isPositive ? "+" : ""}{change24h.toFixed(2)}%
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 8, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Open Interest</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#666" }}>
                ${openInterest > 1e6 ? (openInterest / 1e6).toFixed(2) + "M" : openInterest.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 8, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>Funding (1h)</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: fundingRate >= 0 ? "#22c55e" : "#ef4444" }}>
                {fundingRate >= 0 ? "+" : ""}{(fundingRate * 100).toFixed(4)}%
              </span>
            </div>
          </div>
        )}

        {/* Right: devnet + tabs + wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#111", border: "1px solid #1a1a1a", borderRadius: 8, padding: 2, gap: 2 }}>
            {(["Trade", "Portfolio"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                background: tab === t ? "#1e1e1e" : "none",
                color: tab === t ? "#f0f0f0" : "#444",
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Devnet badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#444", fontFamily: "var(--font-mono)" }}>devnet</span>
          </div>

          <Link href="/docs" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "#444", padding: "4px 10px", cursor: "pointer" }}>Docs</span>
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
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #1e1e1e", borderTopColor: "#444", margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
                <p style={{ color: "#333", fontSize: 13 }}>Loading markets…</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Main 3-column trading area ── */}
              <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

                {/* LEFT: Order Book — 220px */}
                <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid #0f0f0f", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <OrderBook market={market} markPrice={markPrice} />
                </div>

                {/* CENTER: Chart + Toolbar + Recent Trades */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Chart toolbar */}
                  <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid #0f0f0f" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MarketSelector markets={markets} selected={market} onSelect={setSelectedMarket} />
                      <span style={{ color: "#1e1e1e", fontSize: 11, fontFamily: "var(--font-mono)" }}>USDC-settled</span>
                    </div>
                    <IntervalSelector value={interval} onChange={setInterval} />
                  </div>

                  {/* Chart */}
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Chart market={market} interval={interval} markPrice={markPrice} />
                  </div>

                  {/* Recent Trades */}
                  <div style={{ height: 160, flexShrink: 0, borderTop: "1px solid #0f0f0f", overflow: "hidden" }}>
                    <RecentTrades market={market} />
                  </div>
                </div>

                {/* RIGHT: Trade Form — 290px */}
                <div style={{ width: 290, flexShrink: 0, borderLeft: "1px solid #0f0f0f", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <TradeForm market={market} markPrice={markPrice} />
                </div>
              </div>

              {/* BOTTOM: Positions — 190px */}
              <div style={{ height: 190, flexShrink: 0, borderTop: "1px solid #0f0f0f", overflow: "hidden" }}>
                <Positions market={market} />
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { fetchBinanceTickers } from "@/lib/api";
import { WalletButton } from "@/components/WalletButton";
import { LogoMark } from "@/components/Logo";
import { OrderBook } from "@/components/OrderBook";
import { Chart } from "@/components/Chart";
import { TradeForm } from "@/components/TradeForm";
import { RecentTrades } from "@/components/RecentTrades";
import { Positions } from "@/components/Positions";
import { Portfolio } from "@/components/Portfolio";
import { IntervalSelector, type Interval } from "@/components/IntervalSelector";
import { PaperWallet } from "@/components/PaperWallet";
import { PerpMarketSelector } from "@/components/PerpMarketSelector";
import { TradeHistory } from "@/components/TradeHistory";
import { AccountButton } from "@/components/AccountButton";
import { PERP_MARKETS, getMarket } from "@/lib/markets";
import { TokenIcon } from "@/components/TokenIcon";

type Tab = "Trade" | "Portfolio" | "History";

const ALL_SYMBOLS = PERP_MARKETS.map(m => m.binanceSymbol);

export default function PerpsPage() {
  const [tab, setTab] = useState<Tab>("Trade");
  const [selectedMarket, setSelectedMarket] = useState<string>("SOL-PERP");
  const [interval, setInterval] = useState<Interval>("1h");

  const { data: tickers = {} } = useSWR("binance-perp-tickers", () => fetchBinanceTickers(ALL_SYMBOLS), { refreshInterval: 5000 });

  const mkt = getMarket(selectedMarket);
  const market = mkt.id;
  const ticker = tickers[mkt.binanceSymbol];
  const markPrice: number = ticker ? Number(ticker.lastPrice) : 0;
  const change24h: number = ticker ? Number(ticker.priceChangePercent) : 0;
  const fundingRate = 0.0001;
  const openInterest = ticker ? Number(ticker.quoteVolume) : 0;

  // Mark prices for every market (so PnL on non-selected markets stays live)
  const markPrices: Record<string, number> = Object.fromEntries(
    PERP_MARKETS.map(m => [m.id, tickers[m.binanceSymbol] ? Number(tickers[m.binanceSymbol].lastPrice) : 0])
  );

  const fmtPrice = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: mkt.priceDecimals, maximumFractionDigits: mkt.priceDecimals });
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
          <LogoMark size={16} />
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--text-1)", lineHeight: 1, letterSpacing: "-0.04em", marginLeft: 2 }}>mrgin</span>
          <span style={{ color: "var(--border-2)", fontSize: 13, margin: "0 4px" }}>/</span>
          <span style={{ color: "var(--text-3)", fontSize: 12 }}>Perps</span>
        </div>

        {/* Market selector */}
        <div style={{ marginRight: 20 }}>
          <PerpMarketSelector selectedId={market} onSelect={setSelectedMarket} tickers={tickers} />
        </div>

        {/* Market stats */}
        {markPrice > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
            {[
              { label: "Mark", value: `$${fmtPrice(markPrice)}`, color: isPositive ? "#22c55e" : "#ef4444" },
              { label: "24h", value: `${isPositive ? "+" : ""}${change24h.toFixed(2)}%`, color: isPositive ? "#22c55e" : "#ef4444" },
              { label: "OI", value: `$${openInterest > 1e6 ? (openInterest / 1e6).toFixed(2) + "M" : openInterest.toLocaleString()}`, color: "var(--text-2)" },
              { label: "Funding", value: `${fundingRate >= 0 ? "+" : ""}${(fundingRate * 100).toFixed(4)}%`, color: fundingRate >= 0 ? "#22c55e" : "#ef4444" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 8, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 1 }}>{label}</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Right: tabs + devnet + docs + wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <div style={{ display: "flex", background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: 8, padding: 2, gap: 2 }}>
            {(["Trade", "Portfolio", "History"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                background: tab === t ? "var(--border-3)" : "none",
                color: tab === t ? "var(--text-1)" : "var(--text-2)",
                fontSize: 12, fontWeight: tab === t ? 600 : 400,
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--border-2)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 3s infinite" }} />
            <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>devnet</span>
          </div>

          <PaperWallet markPrices={markPrices} />

          <Link href="/docs" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 12, color: "var(--text-2)", padding: "4px 8px", cursor: "pointer", transition: "color 0.12s" }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = "var(--text-1)")}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = "var(--text-2)")}
            >Docs</span>
          </Link>

          <AccountButton compact />

          <WalletButton />
        </div>
      </header>

      {/* ── Portfolio tab ── */}
      {tab === "Portfolio" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Portfolio />
        </div>
      )}

      {/* ── History tab ── */}
      {tab === "History" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 48px" }}>
            <div style={{ marginBottom: 18 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-1)", margin: "0 0 4px" }}>Trade history</h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>Every closed position and resolved bet, with realized PnL and ROE.</p>
            </div>
            <TradeHistory />
          </div>
        </div>
      )}

      {/* ── Trade tab ── */}
      {tab === "Trade" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <>
              {/* ── Main 3-column trading area ── */}
              <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

                {/* LEFT: Order Book */}
                <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <OrderBook binanceSymbol={mkt.binanceSymbol} markPrice={markPrice} priceDecimals={mkt.priceDecimals} />
                </div>

                {/* CENTER: Chart + Toolbar + Recent Trades */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <TokenIcon symbol={mkt.logo} size={18} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{mkt.symbol}</span>
                      <span style={{ color: "var(--border-2)", fontSize: 10, fontFamily: "var(--font-mono)" }}>USDC-settled</span>
                    </div>
                    <IntervalSelector value={interval} onChange={setInterval} />
                  </div>

                  <div style={{ flex: 1, minHeight: 0 }}>
                    <Chart binanceSymbol={mkt.binanceSymbol} interval={interval} markPrice={markPrice} />
                  </div>

                  <div style={{ height: 160, flexShrink: 0, borderTop: "1px solid var(--border)", overflow: "hidden" }}>
                    <RecentTrades binanceSymbol={mkt.binanceSymbol} priceDecimals={mkt.priceDecimals} />
                  </div>
                </div>

                {/* RIGHT: Trade Form */}
                <div style={{ width: 290, flexShrink: 0, borderLeft: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <TradeForm market={mkt} markPrice={markPrice} />
                </div>
              </div>

              {/* BOTTOM: Positions */}
              <div style={{ height: 190, flexShrink: 0, borderTop: "1px solid var(--border)", overflow: "hidden" }}>
                <Positions markPrices={markPrices} />
              </div>
            </>
        </div>
      )}
    </div>
  );
}

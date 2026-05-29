"use client";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Activity, TrendingUp, Zap, Shield, ArrowRight, BarChart2, Binary } from "lucide-react";

const TECH_BADGES = [
  "Hybrid CLOB + AMM",
  "Cross-Margin Shared Vault",
  "Solana CPI Chain",
  "Permissionless Liquidations",
  "Funding Rate Engine",
  "Redis Order Book",
  "On-chain Events → Postgres",
];

const FEATURES = [
  { icon: Zap, title: "Sub-second execution", desc: "100ms matching engine on Redis, on-chain settlement in one CPI call." },
  { icon: Shield, title: "Cross-margin collateral", desc: "Single USDC vault backing perp positions and prediction bets simultaneously." },
  { icon: TrendingUp, title: "Perpetual funding rates", desc: "Hourly funding settlements keeping perp prices anchored to oracle." },
  { icon: Activity, title: "Permissionless liquidations", desc: "Any wallet can liquidate under-collateralised positions and earn the fee." },
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a", color: "#f0f0f0", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 56, borderBottom: "1px solid #111", position: "sticky", top: 0, background: "#0a0a0a", zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={16} color="#f0f0f0" />
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, color: "#f0f0f0", lineHeight: 1 }}>
            mrgin
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/perps" style={{ textDecoration: "none" }}>
            <button style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #1e1e1e", background: "none", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              Perps
            </button>
          </Link>
          <Link href="/predictions" style={{ textDecoration: "none" }}>
            <button style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #1e1e1e", background: "none", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              Predict
            </button>
          </Link>
          <Link href="/docs" style={{ textDecoration: "none" }}>
            <button style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #1e1e1e", background: "none", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              Docs
            </button>
          </Link>
          <WalletMultiButton />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 40px 80px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 99, border: "1px solid #1e1e1e", marginBottom: 28, color: "#555", fontSize: 11, fontFamily: "var(--font-mono)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          live on devnet
        </div>

        <h1 style={{ fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 700, lineHeight: 1.05, margin: "0 0 8px", color: "#f0f0f0", fontFamily: "var(--font-sans)" }}>
          Trade on the edge.
        </h1>
        <h1 style={{ fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 400, lineHeight: 1.05, margin: "0 0 32px", fontFamily: "var(--font-serif)", fontStyle: "italic", color: "#555" }}>
          All margin, one pool.
        </h1>

        <p style={{ fontSize: 16, color: "#555", lineHeight: 1.7, maxWidth: 560, marginBottom: 48 }}>
          Perpetual futures and prediction markets on Solana sharing a single USDC collateral pool.
          Cross-margin means your prediction winnings cover your perp losses — and vice versa.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/perps" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "#f0f0f0", color: "#000",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "background 0.15s",
            }}>
              <BarChart2 size={15} />
              Trade Perps
              <ArrowRight size={14} />
            </button>
          </Link>
          <Link href="/predictions" style={{ textDecoration: "none" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 10,
              border: "1px solid #1e1e1e", background: "none",
              color: "#f0f0f0", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}>
              <Binary size={15} />
              Predict Markets
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── Product cards ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: "0 40px 80px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>

        {/* Perps card */}
        <Link href="/perps" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16,
            padding: 32, cursor: "pointer", transition: "border-color 0.2s",
            height: "100%",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#333")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#111", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={18} color="#f0f0f0" />
              </div>
              <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "var(--font-mono)", background: "rgba(34,197,94,0.08)", padding: "3px 8px", borderRadius: 6 }}>Live</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#f0f0f0", fontFamily: "var(--font-sans)" }}>Perpetual Futures</h2>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
              Long or short with up to 20x leverage. CLOB order book with off-chain matching engine and on-chain settlement.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Hybrid CLOB + AMM", "Up to 20× leverage", "Hourly funding rates", "Permissionless liquidations"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#666" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 6, color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>
              Open trading terminal <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* Predictions card */}
        <Link href="/predictions" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16,
            padding: 32, cursor: "pointer", transition: "border-color 0.2s",
            height: "100%",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#333")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#111", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Binary size={18} color="#f0f0f0" />
              </div>
              <span style={{ fontSize: 11, color: "#3b82f6", fontFamily: "var(--font-mono)", background: "rgba(59,130,246,0.08)", padding: "3px 8px", borderRadius: 6 }}>Beta</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#f0f0f0", fontFamily: "var(--font-sans)" }}>Prediction Markets</h2>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, margin: "0 0 24px" }}>
              Bet YES or NO on real-world events. Winnings and losses flow through the same cross-margin pool as your perp positions.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Binary YES / NO markets", "Cross-margin collateral", "On-chain resolution", "Claim winnings instantly"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#666" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 6, color: "#f0f0f0", fontSize: 13, fontWeight: 600 }}>
              Browse markets <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </section>

      {/* ── Feature grid ── */}
      <section style={{ padding: "0 40px 80px", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
        <div style={{ borderTop: "1px solid #111", paddingTop: 60, marginBottom: 40, textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>Built different</h2>
          <p style={{ fontSize: 14, color: "#555" }}>Custom Anchor programs, no protocol CPIs</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 24 }}>
              <Icon size={18} color="#555" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "#f0f0f0" }}>{title}</h3>
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech badges ── */}
      <section style={{ borderTop: "1px solid #111", padding: "24px 40px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {TECH_BADGES.map(b => (
          <span key={b} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #1a1a1a", fontSize: 11, color: "#444", fontFamily: "var(--font-mono)" }}>
            {b}
          </span>
        ))}
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Activity, TrendingUp, Zap, Shield, ArrowRight,
  BarChart2, Binary, BookOpen, ExternalLink,
} from "lucide-react";
import { DotmSquare3 } from "@/components/ui/dotm-square-3";

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-second execution",
    desc: "100ms matching engine on Redis sorted sets. Fills land on-chain in one CPI call.",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Cross-margin collateral",
    desc: "Single USDC vault. Prediction winnings absorb perp losses automatically.",
    color: "#3b82f6",
  },
  {
    icon: TrendingUp,
    title: "Perpetual funding rates",
    desc: "Hourly funding settlements keep perp prices anchored to oracle. Permissionless crank.",
    color: "#22c55e",
  },
  {
    icon: Activity,
    title: "Permissionless liquidations",
    desc: "Any wallet can liquidate underwater accounts and earn the 50 bps fee.",
    color: "#a855f7",
  },
];

const STATS = [
  { label: "Total Volume", value: "$2.1M" },
  { label: "Open Interest", value: "$480K" },
  { label: "Active Markets", value: "12" },
  { label: "Liquidations", value: "34" },
];

const TECH = [
  "Hybrid CLOB + AMM",
  "Cross-Margin Shared Vault",
  "Solana CPI Chain",
  "Permissionless Liquidations",
  "Hourly Funding Rate",
  "Redis Order Book",
  "On-chain → Postgres",
  "WebSocket Streams",
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)", overflowX: "hidden" }}>

      {/* ── Nav ───────────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 56,
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(12px)",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={15} color="var(--text-1)" />
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, color: "var(--text-1)", lineHeight: 1 }}>
            mrgin
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { href: "/perps", label: "Perps" },
            { href: "/predictions", label: "Sports" },
            { href: "/docs", label: "Docs" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <button style={{
                padding: "6px 14px", borderRadius: 7,
                border: "1px solid transparent",
                background: "none", color: "var(--text-3)",
                fontSize: 13, cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "color 0.15s, border-color 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text-1)"; e.currentTarget.style.borderColor = "var(--border-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "transparent"; }}
              >
                {label}
              </button>
            </Link>
          ))}
          <WalletMultiButton />
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="dot-grid" style={{
        position: "relative",
        padding: "120px 40px 100px",
        textAlign: "center",
        overflow: "hidden",
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          {/* Live badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 99,
            border: "1px solid var(--border-2)",
            marginBottom: 36,
            background: "var(--bg-2)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "var(--font-mono)" }}>live on solana devnet</span>
          </div>

          <h1 style={{
            fontSize: "clamp(52px, 8vw, 88px)",
            fontWeight: 700, lineHeight: 1.02,
            margin: "0 0 4px",
            color: "var(--text-1)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.02em",
          }}>
            Trade on the edge.
          </h1>
          <h1 style={{
            fontSize: "clamp(52px, 8vw, 88px)",
            fontWeight: 400, lineHeight: 1.02,
            margin: "0 0 36px",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "var(--text-3)",
            letterSpacing: "-0.01em",
          }}>
            All margin, one pool.
          </h1>

          <p style={{ fontSize: 16, color: "var(--text-3)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 52px" }}>
            Perpetual futures and sports prediction markets on Solana sharing a single USDC collateral pool. Your winnings cover your losses — automatically.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 10, border: "none",
                background: "var(--text-1)", color: "#000",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "background 0.15s, transform 0.1s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#d4d4d4"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--text-1)"; e.currentTarget.style.transform = "none"; }}
              >
                <BarChart2 size={15} />
                Trade Perps
                <ArrowRight size={14} />
              </button>
            </Link>
            <Link href="/predictions" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 10,
                border: "1px solid var(--border-2)", background: "var(--bg-2)",
                color: "var(--text-1)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.15s, transform 0.1s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-3)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.transform = "none"; }}
              >
                <Binary size={15} />
                Sports Markets
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {STATS.map(({ label, value }, i) => (
            <div key={label} style={{
              padding: "24px 0",
              textAlign: "center",
              borderRight: i < 3 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Product cards ─────────────────────────────── */}
      <section style={{ padding: "80px 40px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Perps card */}
          <Link href="/perps" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 18, padding: 36,
              cursor: "pointer", height: "100%",
              transition: "border-color 0.2s, transform 0.15s",
              display: "flex", flexDirection: "column",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-3)", border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart2 size={20} color="var(--text-1)" />
                </div>
                <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", background: "var(--green-dim)", padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.15)" }}>Live</span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "var(--text-1)", fontFamily: "var(--font-sans)" }}>Perpetual Futures</h2>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, margin: "0 0 28px", flex: 1 }}>
                Long or short with up to 20× leverage. Hybrid CLOB order book — off-chain matching speed, on-chain settlement finality.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28 }}>
                {["Hybrid CLOB + AMM execution", "Up to 20× leverage", "Hourly funding rate settlement", "Permissionless liquidations"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-1)", fontSize: 13, fontWeight: 600 }}>
                Open trading terminal <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Sports card */}
          <Link href="/predictions" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 18, padding: 36,
              cursor: "pointer", height: "100%",
              transition: "border-color 0.2s, transform 0.15s",
              display: "flex", flexDirection: "column",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-3)", border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Binary size={20} color="var(--text-1)" />
                </div>
                <span style={{ fontSize: 11, color: "var(--blue)", fontFamily: "var(--font-mono)", background: "rgba(59,130,246,0.08)", padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(59,130,246,0.15)" }}>Beta</span>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "var(--text-1)", fontFamily: "var(--font-sans)" }}>Sports Predictions</h2>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, margin: "0 0 28px", flex: 1 }}>
                Bet YES or NO on NBA, Champions League, F1, UFC, and more. Winnings flow through the same cross-margin pool as your perp positions.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28 }}>
                {["NBA · Soccer · F1 · UFC · Cricket", "Binary YES / NO markets", "Cross-margin with perp collateral", "On-chain resolution + instant claim"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--blue)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-1)", fontSize: 13, fontWeight: 600 }}>
                Browse markets <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "80px 40px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <DotmSquare3 size={28} dotSize={3} color="grad-aurora" animated />
            <h2 style={{ fontSize: 30, fontWeight: 700, margin: 0, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>Built different</h2>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: 0 }}>Three custom Anchor programs, zero protocol CPIs from external teams.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 14, padding: 28,
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}30`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon size={16} color={color} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "var(--text-1)" }}>{title}</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture teaser ────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "80px 40px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
              Architecture
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>
              Three programs,<br />one shared vault.
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.8, marginBottom: 24 }}>
              <code style={{ fontFamily: "var(--font-mono)", color: "#a855f7", fontSize: 12 }}>perp_engine</code> and{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--green)", fontSize: 12 }}>prediction_market</code> both CPI into{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--blue)", fontSize: 12 }}>cross_margin</code> to lock collateral from the same USDC vault. Portfolio health is computed across all products simultaneously.
            </p>
            <Link href="/docs" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 8,
                border: "1px solid var(--border-2)", background: "none",
                color: "var(--text-2)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "var(--font-sans)",
                transition: "color 0.15s, border-color 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "var(--text-1)"; e.currentTarget.style.borderColor = "var(--border-3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--border-2)"; }}
              >
                <BookOpen size={14} />
                Read the docs
                <ExternalLink size={12} />
              </button>
            </Link>
          </div>

          {/* Code block */}
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", overflowX: "auto" }}>
            <div style={{ fontSize: 9, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "var(--font-mono)", marginBottom: 12 }}>
              CPI flow
            </div>
            <pre style={{ fontFamily: "var(--font-mono)", fontSize: 11, lineHeight: 1.9, margin: 0, color: "var(--text-3)" }}>{`User Wallet
  │
  ├── perp_engine
  │     └── open_position()
  │           └─ CPI → cross_margin
  │                    lock_margin()
  │
  └── prediction_market
        └── place_bet()
              └─ CPI → cross_margin
                       lock_margin()
  │
  cross_margin
    check_health()  ← bps ratio
    cross_liquidate() ← waterfall`}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer / tech badges ──────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 40px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Activity size={13} color="var(--text-4)" />
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16, color: "var(--text-3)" }}>mrgin</span>
            <span style={{ fontSize: 11, color: "var(--text-4)", marginLeft: 8 }}>Solana devnet · 2026</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TECH.map(b => (
              <span key={b} style={{ padding: "3px 9px", borderRadius: 5, border: "1px solid var(--border)", fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { HeroBackground } from "@/components/HeroBackground";

// ── Live data ──────────────────────────────────────────────────────────────────

function useLiveSOL() {
  const [state, setState] = useState({ price: 0, change: 0, high: 0, low: 0, volume: 0 });
  useEffect(() => {
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT")
      .then(r => r.json())
      .then(d => setState({
        price: +d.lastPrice, change: +d.priceChangePercent,
        high: +d.highPrice, low: +d.lowPrice, volume: +d.quoteVolume,
      })).catch(() => {});

    const ws = new WebSocket("wss://stream.binance.com:9443/ws/solusdt@miniTicker");
    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      setState(s => ({ ...s, price: +d.c, change: +d.P }));
    };
    ws.onerror = () => {};
    return () => ws.close();
  }, []);
  return state;
}

function useMiniBook() {
  const [book, setBook] = useState<{ bids: [number, number][]; asks: [number, number][] }>({ bids: [], asks: [] });
  useEffect(() => {
    const bm = new Map<number, number>(), am = new Map<number, number>();
    const flush = () => setBook({
      bids: [...bm.entries()].sort((a, b) => b[0] - a[0]).slice(0, 6) as [number, number][],
      asks: [...am.entries()].sort((a, b) => a[0] - b[0]).slice(0, 6) as [number, number][],
    });
    fetch("https://api.binance.com/api/v3/depth?symbol=SOLUSDT&limit=8")
      .then(r => r.json())
      .then(d => {
        d.bids.forEach(([p, s]: string[]) => bm.set(+p, +s));
        d.asks.forEach(([p, s]: string[]) => am.set(+p, +s));
        flush();
      }).catch(() => {});
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/solusdt@depth@100ms");
    ws.onmessage = e => {
      const d = JSON.parse(e.data);
      (d.b || []).forEach(([p, s]: string[]) => +s === 0 ? bm.delete(+p) : bm.set(+p, +s));
      (d.a || []).forEach(([p, s]: string[]) => +s === 0 ? am.delete(+p) : am.set(+p, +s));
      flush();
    };
    ws.onerror = () => {};
    return () => ws.close();
  }, []);
  return book;
}

// ── Animated counter ───────────────────────────────────────────────────────────

function Counter({ to, prefix = "", suffix = "", decimals = 0 }: {
  to: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || fired.current) return;
      fired.current = true;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min((t - t0) / 1600, 1);
        const ease = 1 - (1 - p) ** 4;
        setN(to * ease);
        if (p < 1) requestAnimationFrame(step); else setN(to);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return (
    <div ref={ref}>
      {prefix}{decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString()}{suffix}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Landing() {
  const sol = useLiveSOL();
  const book = useMiniBook();
  const isUp = sol.change >= 0;
  const maxAsk = Math.max(...book.asks.map(a => a[1]), 0.001);
  const maxBid = Math.max(...book.bids.map(b => b[1]), 0.001);

  const TICKER = [
    sol.price > 0 ? `SOL  $${sol.price.toFixed(2)}  ${isUp ? "+" : ""}${sol.change.toFixed(2)}%` : "SOL-PERP  Live",
    "IPL Final  ·  RCB vs GT  53% YES  1.89×  ·  TODAY",
    "IPL Final  ·  Kohli 50+ runs  58%  1.72×",
    "Champions League  ·  Real Madrid  32%  3.12×",
    "20× leverage  ·  USDC-settled  ·  Solana",
    "F1 2026  ·  Verstappen  37% YES  2.70×",
    "Funding rate  +0.0100% /hr  ·  Permissionless",
    "Super Bowl LXI  ·  Chiefs  53%  1.88×",
    "3 Anchor programs  ·  Zero protocol deps",
    "LoL Worlds  ·  T1  57% YES  1.75×",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#f2f2f2", overflowX: "hidden" }}>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1) }
          50% { opacity: 0.4; transform: scale(0.75) }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes fade-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        ::placeholder { color: #333; }
        input[type=number]::-webkit-inner-spin-button { display: none; }

        .cta-primary { transition: background 0.15s, transform 0.12s !important; }
        .cta-primary:hover { background: #d8d8d8 !important; transform: translateY(-2px) !important; }
        .cta-secondary { transition: border-color 0.15s, color 0.15s, transform 0.12s, background 0.15s !important; color: var(--text-2) !important; border-color: #444 !important; background: rgba(12,12,12,0.65) !important; }
        .cta-secondary:hover { border-color: #666 !important; color: var(--text-1) !important; background: rgba(22,22,22,0.85) !important; transform: translateY(-2px) !important; }
        .nav-link { transition: color 0.15s !important; color: var(--text-2) !important; }
        .nav-link:hover { color: var(--text-1) !important; }
        .product-card { transition: border-color 0.25s, transform 0.2s !important; }
        .product-card:hover { border-color: #2a2a2a !important; transform: translateY(-6px) !important; }
        .arch-row:hover { background: #101010 !important; }
        .feature-item:hover { background: #0e0e0e !important; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", inset: "0 0 auto", zIndex: 100,
        height: 52, display: "flex", alignItems: "center", padding: "0 40px", gap: 0,
        background: "rgba(8,8,8,0.88)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid #161616",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginRight: "auto" }}>
          <Activity size={13} color="#86efac" />
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 21, color: "#f2f2f2", letterSpacing: "-0.01em", lineHeight: 1 }}>mrgin</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 0, marginRight: 20 }}>
          {[["Perps", "/perps"], ["Sports", "/predictions"], ["Docs", "/docs"]].map(([label, href]) => (
            <Link key={href} href={href} className="nav-link" style={{
              textDecoration: "none", padding: "6px 14px", borderRadius: 7,
              fontSize: 13, fontFamily: "var(--font-sans)",
            }}>{label}</Link>
          ))}
        </div>

        <WalletButton />
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", minHeight: "100vh", paddingTop: 52,
        display: "grid", gridTemplateColumns: "1fr 360px",
        alignItems: "center", gap: 48,
        maxWidth: 1280, margin: "0 auto", padding: "52px 48px 80px",
        overflow: "hidden",
      }}>
        <HeroBackground />
        <div style={{
          position: "absolute", inset: "52px 48px 0", pointerEvents: "none", zIndex: 0,
          borderLeft: "1px solid #121212", borderRight: "1px solid #121212",
        }} />
        <div style={{
          position: "absolute", top: "18%", left: "48%", width: 1, height: "62%",
          background: "linear-gradient(to bottom, transparent, #1a1a1a 20%, #1a1a1a 80%, transparent)",
          pointerEvents: "none", display: "none",
        }} />

        {/* Left */}
        <div style={{
          animation: "fade-up 0.7s ease both", position: "relative", zIndex: 2,
          padding: "8px 36px 8px 0",
          borderRadius: 20,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 40, paddingBottom: 20, borderBottom: "1px solid #2a2a2a",
            maxWidth: 520,
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                display: "inline-block", animation: "pulse-dot 2s infinite",
              }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#86efac", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                live on solana devnet
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-label)", letterSpacing: "0.08em" }}>
              Est. 2026
            </span>
          </div>

          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 16,
            color: "var(--text-2)", marginBottom: 20, letterSpacing: "0.01em",
          }}>
            Perpetuals &amp; prediction markets, unified.
          </div>

          <h1 style={{
            fontSize: "clamp(54px, 6.5vw, 92px)", fontWeight: 800,
            lineHeight: 0.96, margin: "0 0 6px",
            letterSpacing: "-0.035em", fontFamily: "var(--font-sans)", color: "var(--text-1)",
          }}>
            Two markets.
          </h1>
          <h1 style={{
            fontSize: "clamp(54px, 6.5vw, 92px)", fontWeight: 400,
            lineHeight: 0.96, margin: "0 0 28px",
            letterSpacing: "-0.025em", fontFamily: "var(--font-serif)",
            fontStyle: "italic", color: "var(--text-serif-accent)",
          }}>
            One vault.
          </h1>

          <div style={{
            display: "inline-block", padding: "14px 0 14px 18px",
            borderLeft: "2px solid #22c55e55", marginBottom: 36, maxWidth: 480,
          }}>
            <p style={{
              fontSize: 17, color: "var(--text-2)", lineHeight: 1.75,
              margin: 0, fontFamily: "var(--font-sans)",
            }}>
              Long SOL at 20×. Bet the IPL Final tonight. Your winnings automatically
              cushion your losses — across perps <em style={{ color: "var(--text-1)", fontStyle: "italic" }}>and</em> sports,
              from a single USDC pool.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {["20× leverage", "USDC-settled", "Cross-margin", "Permissionless"].map(tag => (
              <span key={tag} style={{
                fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)",
                padding: "6px 12px", borderRadius: 999,
                border: "1px solid #333", background: "rgba(12,12,12,0.75)",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{tag}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 44 }}>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <button className="cta-primary" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 26px", borderRadius: 10, border: "none",
                background: "#f2f2f2", color: "#080808",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                Trade Perps <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/predictions" style={{ textDecoration: "none" }}>
              <button className="cta-secondary" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 26px", borderRadius: 10,
                border: "1px solid #444",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                Sports Markets
              </button>
            </Link>
          </div>

          {/* Inline hero stats — classic grid strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden",
            maxWidth: 520, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)",
          }}>
            {[
              { val: sol.price > 0 ? `$${sol.price.toFixed(0)}` : "—", label: "SOL mark" },
              { val: "20×", label: "Max lev." },
              { val: "3", label: "Programs" },
              { val: "$5k", label: "Demo fund" },
            ].map(({ val, label }, i) => (
              <div key={label} style={{
                padding: "16px 14px", textAlign: "center",
                borderRight: i < 3 ? "1px solid #2a2a2a" : "none",
              }}>
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700,
                  color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 4,
                }}>{val}</div>
                <div style={{
                  fontSize: 9, color: "var(--text-label)", textTransform: "uppercase",
                  letterSpacing: "0.12em", fontFamily: "var(--font-sans)",
                }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Protocol strip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20, marginTop: 28,
            paddingTop: 24, borderTop: "1px solid #2a2a2a", maxWidth: 520,
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Built on
            </span>
            {["Solana", "Anchor", "USDC"].map(name => (
              <span key={name} style={{
                fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-3)",
                letterSpacing: "0.02em",
              }}>{name}</span>
            ))}
          </div>
        </div>

        {/* Right: Live mini terminal */}
        <div style={{
          background: "rgba(11,11,11,0.92)", border: "1px solid #333", borderRadius: 18,
          overflow: "hidden", animation: "fade-up 0.7s 0.12s ease both",
          boxShadow: "0 40px 80px rgba(0,0,0,0.75)",
          position: "relative", zIndex: 2, backdropFilter: "blur(12px)",
        }}>
          {/* Corner label */}
          <div style={{
            position: "absolute", top: -1, right: 20, zIndex: 2,
            padding: "5px 12px", background: "#0a0a0a",
            border: "1px solid #333", borderTop: "none",
            borderRadius: "0 0 8px 8px",
            fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-label)",
            textTransform: "uppercase", letterSpacing: "0.12em",
          }}>
            Terminal · v0.1
          </div>
          {/* Terminal bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #161616",
            background: "#0d0d0d",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ef4444", "#f59e0b", "#22c55e"].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.6 }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)", marginLeft: 4 }}>SOL-PERP · ORDER BOOK</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sol.price > 0 && (
                <>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#f2f2f2" }}>
                    ${sol.price.toFixed(2)}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 5px", borderRadius: 4,
                    background: isUp ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    color: isUp ? "#22c55e" : "#ef4444",
                  }}>
                    {isUp ? "+" : ""}{sol.change.toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Column labels */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 14px 4px", borderBottom: "1px solid #111" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Price</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Size</span>
          </div>

          {/* Asks */}
          <div>
            {[...book.asks].reverse().slice(0, 6).map(([price, size], i) => (
              <div key={`a${i}`} style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "3px 14px" }}>
                <div style={{ position: "absolute", inset: 0, right: 0, left: "auto", width: `${(size / maxAsk) * 55}%`, background: "rgba(239,68,68,0.07)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#ef4444", position: "relative" }}>{price.toFixed(2)}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)", position: "relative" }}>{size >= 1000 ? (size / 1000).toFixed(1) + "k" : size.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Mid */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 14px",
            borderTop: "1px solid #1c1c1c", borderBottom: "1px solid #1c1c1c",
            background: "#0f0f0f",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.01em" }}>
              {sol.price > 0 ? `$${sol.price.toFixed(2)}` : "—"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.12em" }}>MARK</span>
          </div>

          {/* Bids */}
          <div>
            {book.bids.slice(0, 6).map(([price, size], i) => (
              <div key={`b${i}`} style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "3px 14px" }}>
                <div style={{ position: "absolute", inset: 0, right: 0, left: "auto", width: `${(size / maxBid) * 55}%`, background: "rgba(34,197,94,0.07)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#22c55e", position: "relative" }}>{price.toFixed(2)}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)", position: "relative" }}>{size >= 1000 ? (size / 1000).toFixed(1) + "k" : size.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Active bet preview */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #161616", background: "#0d0d0d" }}>
            <div style={{ fontSize: 9, color: "var(--text-mono-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Cross-margin active
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 12 }}>📈</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-sans)" }}>SOL-PERP Long 5×</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#22c55e" }}>+$142.50</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 12 }}>🏀</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-sans)" }}>OKC YES · 1.69×</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>-$250</span>
              </div>
            </div>
          </div>

          {/* Terminal CTA */}
          <div style={{ padding: "10px 14px 14px" }}>
            <Link href="/perps" style={{ textDecoration: "none", display: "block" }}>
              <div style={{
                padding: "9px 0", borderRadius: 8, textAlign: "center",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)",
                fontSize: 11, fontWeight: 600, color: "#22c55e",
                fontFamily: "var(--font-sans)", cursor: "pointer", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(34,197,94,0.14)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(34,197,94,0.08)")}
              >
                Open Terminal →
              </div>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: "fade-in 1.2s 0.8s ease both", opacity: 0,
          animationFillMode: "forwards", zIndex: 1,
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Scroll
          </span>
          <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, #666, transparent)" }} />
        </div>
      </section>

      {/* ── HERO QUOTE STRIP ──────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid #161616", borderBottom: "1px solid #161616",
        background: "#0a0a0a", padding: "28px 48px", textAlign: "center",
      }}>
        <p style={{
          margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: "clamp(18px, 2.2vw, 26px)", color: "var(--text-2)",
          letterSpacing: "-0.01em", lineHeight: 1.4, maxWidth: 720, marginInline: "auto",
        }}>
          &ldquo;One pool. Two products. Your sports win pays for your perp loss.&rdquo;
        </p>
        <div style={{
          marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--text-mono-dim)", letterSpacing: "0.2em", textTransform: "uppercase",
        }}>
          Cross-margin · Solana native · Zero protocol deps
        </div>
      </div>

      {/* ── TICKER ────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid #161616", borderBottom: "1px solid #161616",
        background: "#060606", overflow: "hidden", padding: "11px 0",
      }}>
        <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", padding: "0 28px", whiteSpace: "nowrap" }}>
                {item}
              </span>
              <span style={{ color: "#1e1e1e", fontSize: 14, lineHeight: 1 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          borderLeft: "1px solid #161616", borderTop: "1px solid #161616",
          marginTop: 80,
        }}>
          {[
            { label: "Demo volume", to: 2.1, prefix: "$", suffix: "M", decimals: 1 },
            { label: "Open interest", to: 480, prefix: "$", suffix: "k", decimals: 0 },
            { label: "Active markets", to: 12, prefix: "", suffix: "", decimals: 0 },
            { label: "Sports events", to: 8, prefix: "", suffix: " open", decimals: 0 },
          ].map(({ label, to, prefix, suffix, decimals }) => (
            <div key={label} style={{
              padding: "52px 40px", borderRight: "1px solid #161616", borderBottom: "1px solid #161616",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 700,
                color: "#f2f2f2", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 12,
              }}>
                <Counter to={to} prefix={prefix} suffix={suffix} decimals={decimals} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: "0.14em", fontFamily: "var(--font-sans)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE INSIGHT ───────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 48px" }}>
        <div style={{
          fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase",
          letterSpacing: "0.22em", fontFamily: "var(--font-mono)", marginBottom: 28,
        }}>
          The key insight
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <h2 style={{
              fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 800,
              letterSpacing: "-0.035em", lineHeight: 1.05, margin: "0 0 32px",
              fontFamily: "var(--font-sans)",
            }}>
              Sports wins cover
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--text-serif-accent)" }}>your perp losses.</span>
            </h2>

            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.85, marginBottom: 32 }}>
              Every dollar you put in sits in one shared USDC vault.{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "#22c55e", fontSize: 13 }}>cross_margin</code> tracks
              your total equity across perp positions and sports bets simultaneously.
              When your OKC bet pays out, that gain is immediately available to absorb
              your SOL drawdown — no manual transfers.
            </p>

            <div style={{
              padding: "20px 24px", background: "#0b0b0b",
              border: "1px solid #1c1c1c", borderLeft: "3px solid #22c55e",
              borderRadius: 12, marginBottom: 32,
              fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.8, color: "#555",
            }}>
              <span style={{ color: "#22c55e" }}>health</span>
              {" = "}
              <span style={{ color: "#f2f2f2" }}>equity</span>
              {" / "}
              <span style={{ color: "#3b82f6" }}>locked_notional</span>
              <br />
              <span style={{ color: "#2a2a2a", fontSize: 11 }}># liquidate when health &lt; 500 bps</span>
            </div>

            <Link href="/docs" style={{ textDecoration: "none" }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 8,
                border: "1px solid #1e1e1e", background: "none",
                color: "#555", fontSize: 13, cursor: "pointer",
                fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f2f2f2"; e.currentTarget.style.borderColor = "#333"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
              >
                Read the architecture <ArrowUpRight size={13} />
              </button>
            </Link>
          </div>

          {/* Flow diagram */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Vault */}
            <div style={{
              padding: "24px", background: "#0b0b0b",
              border: "1px solid #1c1c1c", borderRadius: 14,
              textAlign: "center", marginBottom: 4,
            }}>
              <div style={{ fontSize: 10, color: "#333", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Shared USDC vault</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.02em" }}>$5,000.00</div>
              <div style={{ fontSize: 10, color: "#333", fontFamily: "var(--font-mono)", marginTop: 4 }}>cross_margin · single pool</div>
            </div>

            {/* Arrow down */}
            <div style={{ display: "flex", gap: 16, padding: "4px 0" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, #22c55e30, #22c55e)" }} />
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, #3b82f630, #3b82f6)" }} />
              </div>
            </div>

            {/* Two products */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{
                padding: "20px", background: "#0b0b0b",
                border: "1px solid #22c55e22", borderTop: "2px solid #22c55e",
                borderRadius: 12,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>perp_engine</div>
                <div style={{ fontSize: 11, color: "#444", lineHeight: 1.6 }}>
                  SOL-PERP 5×<br />
                  <span style={{ color: "#22c55e", fontFamily: "var(--font-mono)" }}>P&L +$142.50</span>
                </div>
              </div>
              <div style={{
                padding: "20px", background: "#0b0b0b",
                border: "1px solid #3b82f622", borderTop: "2px solid #3b82f6",
                borderRadius: 12,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>prediction_mkt</div>
                <div style={{ fontSize: 11, color: "#444", lineHeight: 1.6 }}>
                  OKC YES $250<br />
                  <span style={{ color: "#f59e0b", fontFamily: "var(--font-mono)" }}>→ $422.50 if win</span>
                </div>
              </div>
            </div>

            {/* Arrow up */}
            <div style={{ display: "flex", gap: 16, padding: "4px 0" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to top, #22c55e30, #22c55e)" }} />
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to top, #f59e0b30, #f59e0b)" }} />
              </div>
            </div>

            {/* Health bar */}
            <div style={{
              padding: "16px 20px", background: "#0b0b0b",
              border: "1px solid #1c1c1c", borderRadius: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em" }}>Portfolio health</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#22c55e" }}>8,240 bps · SAFE</span>
              </div>
              <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "82%", background: "linear-gradient(90deg, #22c55e, #16a34a)", borderRadius: 3 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#222" }}>0</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#ef4444" }}>500 bps liq</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#22c55e" }}>10,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ──────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #161616", padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase",
          letterSpacing: "0.22em", fontFamily: "var(--font-mono)", marginBottom: 52,
        }}>
          What you can trade
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* PERPS */}
          <Link href="/perps" style={{ textDecoration: "none" }}>
            <div className="product-card" style={{
              background: "#0b0b0b", border: "1px solid #1a1a1a", borderRadius: 22,
              padding: "40px 40px 36px", cursor: "pointer", minHeight: 420,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  01 · Perpetual Futures
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse-dot 2.5s infinite" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#22c55e" }}>LIVE</span>
                </span>
              </div>

              <h2 style={{
                fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 800,
                lineHeight: 1.05, margin: "0 0 20px",
                letterSpacing: "-0.025em", fontFamily: "var(--font-sans)",
              }}>
                Long or short.<br />Up to 20× leverage.
              </h2>

              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: "0 0 auto" }}>
                Hybrid CLOB order book. Off-chain matching speed, on-chain settlement finality.
                Hourly funding rate anchors price to oracle. Any wallet can liquidate and earn 50 bps.
              </p>

              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1, background: "#161616", borderRadius: 12,
                overflow: "hidden", margin: "32px 0 28px",
              }}>
                {[["20×", "Max lev."], [sol.price > 0 ? `$${sol.price.toFixed(0)}` : "—", "SOL price"], ["0.05%", "Maker fee"]].map(([val, label]) => (
                  <div key={label} style={{ background: "#0b0b0b", padding: "16px 14px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 700, color: "#f2f2f2", marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#22c55e" }}>
                Open terminal <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* SPORTS */}
          <Link href="/predictions" style={{ textDecoration: "none" }}>
            <div className="product-card" style={{
              background: "#0b0b0b", border: "1px solid #1a1a1a", borderRadius: 22,
              padding: "40px 40px 36px", cursor: "pointer", minHeight: 420,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  02 · Sports Predictions
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, color: "#3b82f6",
                  background: "rgba(59,130,246,0.08)", padding: "3px 8px", borderRadius: 5,
                  border: "1px solid rgba(59,130,246,0.15)",
                }}>Beta</span>
              </div>

              <h2 style={{
                fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 800,
                lineHeight: 1.05, margin: "0 0 20px",
                letterSpacing: "-0.025em", fontFamily: "var(--font-sans)",
              }}>
                Bet on sports.<br />Hedge your risk.
              </h2>

              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: "0 0 auto" }}>
                YES or NO on IPL, NBA, Champions League, F1, UFC, cricket, esports, and NFL.
                Every bet shares the same vault as your perp positions — your sports winnings
                actively offset perp drawdown.
              </p>

              {/* Live markets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "32px 0 28px" }}>
                {[
                  { e: "🏏", q: "RCB beat GT · IPL Final", yes: 53, odds: "1.89×", color: "#22c55e" },
                  { e: "🏏", q: "Kohli 50+ · IPL Final", yes: 58, odds: "1.72×", color: "#22c55e" },
                  { e: "🏀", q: "OKC win 2026 NBA", yes: 59, odds: "1.69×", color: "#3b82f6" },
                ].map(({ e, q, yes, odds, color }) => (
                  <div key={q} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", background: "#0f0f0f",
                    borderRadius: 9, border: "1px solid #161616",
                  }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{e}</span>
                    <span style={{ fontSize: 11, color: "#555", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q}</span>
                    <div style={{ width: 52, height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ height: "100%", width: `${yes}%`, background: color }} />
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, flexShrink: 0, minWidth: 38, textAlign: "right" }}>{odds}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>
                Browse markets <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #161616", padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 10, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.22em", fontFamily: "var(--font-mono)", marginBottom: 28 }}>
              Under the hood
            </div>
            <h2 style={{
              fontSize: "clamp(30px, 3.5vw, 52px)", fontWeight: 800,
              letterSpacing: "-0.03em", margin: "0 0 24px",
              lineHeight: 1.05, fontFamily: "var(--font-sans)",
            }}>
              Three custom Anchor programs.
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "#444" }}>Zero protocol deps.</span>
            </h2>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.85, marginBottom: 32 }}>
              Every line of Rust is ours.{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "#a855f7", fontSize: 12 }}>perp_engine</code> and{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "#22c55e", fontSize: 12 }}>prediction_market</code> both
              CPI into{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "#3b82f6", fontSize: 12 }}>cross_margin</code> for every
              single margin operation. Portfolio health computed in bps across all products simultaneously.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/docs" style={{ textDecoration: "none" }}>
                <button style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 8,
                  border: "1px solid #1e1e1e", background: "none",
                  color: "#555", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#f2f2f2"; e.currentTarget.style.borderColor = "#333"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
                >
                  Architecture docs <ArrowUpRight size={13} />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: programs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              {
                name: "perp_engine", id: "FiTnBYBB…ktB", color: "#a855f7",
                label: "01", items: ["AMM-based perpetual futures", "Funding rate accumulator", "Permissionless liquidation", "CPI → cross_margin on every open"],
              },
              {
                name: "prediction_market", id: "ARFaBkMf…kU7", color: "#22c55e",
                label: "02", items: ["Binary YES/NO event markets", "Oracle-resolved outcomes", "Claim payouts after resolution", "CPI → cross_margin for collateral"],
              },
              {
                name: "cross_margin", id: "2Khz6Ehr…Dm", color: "#3b82f6",
                label: "03", items: ["Shared USDC vault per user", "Portfolio health in bps", "Cross-liquidation waterfall", "THE authority all others CPI into"],
              },
            ].map(({ name, id, color, label, items }) => (
              <div key={name} className="arch-row" style={{
                padding: "22px 24px", background: "#0b0b0b",
                border: "1px solid #161616", borderRadius: 14,
                borderLeft: `3px solid ${color}`, transition: "background 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#2a2a2a" }}>{label}</span>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color, fontWeight: 700 }}>{name}</code>
                  </div>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#2a2a2a" }}>{id}</code>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {items.map(item => (
                    <span key={item} style={{
                      fontSize: 10, color: "#444", padding: "3px 8px",
                      background: "#111", borderRadius: 4, border: "1px solid #1a1a1a",
                      fontFamily: "var(--font-sans)",
                    }}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section style={{ padding: "0 48px 120px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          background: "#0b0b0b", border: "1px solid #1c1c1c", borderRadius: 24,
          padding: "80px 72px",
          display: "grid", gridTemplateColumns: "1fr auto",
          alignItems: "center", gap: 48,
        }}>
          <div>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 60px)", fontWeight: 800,
              letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.0,
              fontFamily: "var(--font-sans)",
            }}>
              Start with $5,000.
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "#444" }}>No wallet required.</span>
            </h2>
            <p style={{ fontSize: 15, color: "#555", lineHeight: 1.75, margin: 0, maxWidth: 520 }}>
              Demo funds are on deposit the moment you arrive. Trade perps, bet on sports,
              and experience cross-margin risk management live — no real money, no setup, no friction.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <button className="cta-primary" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 32px", borderRadius: 10, border: "none",
                background: "#f2f2f2", color: "#080808",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                fontFamily: "var(--font-sans)", width: "100%",
              }}>
                Trade now <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/predictions" style={{ textDecoration: "none" }}>
              <button className="cta-secondary" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 32px", borderRadius: 10,
                border: "1px solid #222", background: "none",
                color: "#666", fontSize: 14, fontWeight: 500, cursor: "pointer",
                fontFamily: "var(--font-sans)", width: "100%",
              }}>
                Browse sports
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #161616", padding: "28px 48px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={12} color="#2a2a2a" />
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 15, color: "#333" }}>mrgin</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#222", marginLeft: 8 }}>
              solana devnet · 2026
            </span>
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[["Perps", "/perps"], ["Sports", "/predictions"], ["Docs", "/docs"]].map(([label, href]) => (
              <Link key={href} href={href} style={{
                textDecoration: "none", fontSize: 12, color: "#2a2a2a",
                fontFamily: "var(--font-sans)", transition: "color 0.15s",
              }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = "#666")}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = "#2a2a2a")}
              >{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

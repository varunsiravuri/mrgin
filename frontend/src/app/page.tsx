"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { AccountButton } from "@/components/AccountButton";
import { HeroBackground } from "@/components/HeroBackground";
import { Logo, LogoMark } from "@/components/Logo";
import { TokenIcon } from "@/components/TokenIcon";

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
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(to); return; }
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
    <div ref={ref} className="tnum">
      {prefix}{decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString()}{suffix}
    </div>
  );
}

// ── Reusable eyebrow label ───────────────────────────────────────────────────────

function Eyebrow({ children, color = "var(--text-mono-dim)" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
      <span style={{ width: 18, height: 1, background: "var(--border-3)" }} />
      <span style={{
        fontSize: 10, color, textTransform: "uppercase",
        letterSpacing: "0.24em", fontFamily: "var(--font-mono)", fontWeight: 500,
      }}>
        {children}
      </span>
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
    sol.price > 0 ? `SOL  $${sol.price.toFixed(2)}  ${isUp ? "+" : ""}${sol.change.toFixed(2)}%` : "SOL-MARKET  Live",
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)", overflowX: "hidden" }}>
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
          from { opacity: 0; transform: translateY(20px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes fade-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        ::placeholder { color: #3a3a40; }
        input[type=number]::-webkit-inner-spin-button { display: none; }

        .gradient-text {
          background: var(--accent-grad);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: transparent;
        }

        .cta-primary { transition: background 120ms ease-out, transform 120ms ease-out, box-shadow 120ms ease-out !important; }
        .cta-primary:hover { background: #ffffff !important; transform: translateY(-2px) !important; box-shadow: 0 12px 30px rgba(52,211,153,0.18) !important; }
        .cta-primary:active { transform: translateY(0) !important; }

        .cta-secondary { transition: border-color 120ms ease-out, color 120ms ease-out, transform 120ms ease-out, background 120ms ease-out !important; color: var(--text-2) !important; border-color: var(--border-2) !important; background: rgba(13,13,16,0.65) !important; }
        .cta-secondary:hover { border-color: var(--border-3) !important; color: var(--text-1) !important; background: rgba(24,24,28,0.85) !important; transform: translateY(-2px) !important; }
        .cta-secondary:active { transform: translateY(0) !important; }

        .nav-link { transition: color 120ms ease-out !important; color: var(--text-3) !important; }
        .nav-link:hover { color: var(--text-1) !important; }

        .ghost-btn { transition: color 140ms ease-out, border-color 140ms ease-out !important; }
        .ghost-btn:hover { color: var(--text-1) !important; border-color: var(--border-3) !important; }

        .product-card { transition: border-color 220ms ease-out, transform 200ms ease-out, box-shadow 220ms ease-out !important; }
        .product-card:hover { border-color: var(--border-2) !important; transform: translateY(-6px) !important; box-shadow: 0 30px 60px rgba(0,0,0,0.45) !important; }
        .arch-row { transition: background 200ms ease-out !important; }
        .arch-row:hover { background: var(--bg-3) !important; }
        .term-cta { transition: background 140ms ease-out !important; }
        .term-cta:hover { background: rgba(52,211,153,0.14) !important; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", inset: "0 0 auto", zIndex: 100,
        height: 56, display: "flex", alignItems: "center", padding: "0 40px", gap: 0,
        background: "rgba(8,8,10,0.82)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <Link href="/" aria-label="mrgin home" style={{ display: "flex", alignItems: "center", textDecoration: "none", marginRight: "auto" }}>
          <Logo size={22} wordSize={22} />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 2, marginRight: 20 }}>
          {[["Markets", "/perps"], ["Sports", "/predictions"], ["Docs", "/docs"]].map(([label, href]) => (
            <Link key={href} href={href} className="nav-link" style={{
              textDecoration: "none", padding: "8px 14px", borderRadius: 8,
              fontSize: 13, fontFamily: "var(--font-sans)", fontWeight: 500, letterSpacing: "-0.01em",
            }}>{label}</Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AccountButton />
          <WalletButton />
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", minHeight: "100vh", paddingTop: 56,
        display: "grid", gridTemplateColumns: "1fr 360px",
        alignItems: "center", gap: 48,
        maxWidth: 1280, margin: "0 auto", padding: "56px 48px 80px",
        overflow: "hidden",
      }}>
        <HeroBackground />
        <div style={{
          position: "absolute", inset: "56px 48px 0", pointerEvents: "none", zIndex: 0,
          borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)",
        }} />

        {/* Left */}
        <div style={{
          animation: "fade-up 0.7s ease both", position: "relative", zIndex: 2,
          padding: "8px 36px 8px 0",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 40, paddingBottom: 20, borderBottom: "1px solid var(--border-2)",
            maxWidth: 520,
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%", background: "var(--green)",
                display: "inline-block", animation: "pulse-dot 2s infinite",
                boxShadow: "0 0 8px var(--green)",
              }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-serif-accent)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                live on solana devnet
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-label)", letterSpacing: "0.08em" }}>
              Est. 2026
            </span>
          </div>

          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 19,
            color: "var(--text-2)", marginBottom: 18, letterSpacing: "0.005em",
          }}>
            Markets &amp; prediction markets, unified.
          </div>

          <h1 style={{
            fontSize: "clamp(54px, 6.6vw, 96px)", fontWeight: 700,
            lineHeight: 0.94, margin: "0 0 2px",
            letterSpacing: "-0.04em", fontFamily: "var(--font-sans)", color: "var(--text-1)",
          }}>
            Two markets.
          </h1>
          <h1 className="gradient-text" style={{
            fontSize: "clamp(54px, 6.6vw, 96px)", fontWeight: 400,
            lineHeight: 0.98, margin: "0 0 28px",
            letterSpacing: "-0.02em", fontFamily: "var(--font-serif)",
            fontStyle: "italic",
          }}>
            One vault.
          </h1>

          <div style={{
            display: "inline-block", padding: "12px 0 12px 18px",
            borderLeft: "2px solid var(--green)", marginBottom: 36, maxWidth: 480,
          }}>
            <p style={{
              fontSize: 17, color: "var(--text-2)", lineHeight: 1.7,
              margin: 0, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
            }}>
              Long SOL at 20×. Bet the IPL Final tonight. Your winnings automatically
              cushion your losses — across markets <em style={{ color: "var(--text-1)", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>and</em> sports,
              from a single USDC pool.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            {["20× leverage", "USDC-settled", "Cross-margin", "Permissionless"].map(tag => (
              <span key={tag} style={{
                fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)",
                padding: "6px 12px", borderRadius: 999,
                border: "1px solid var(--border-2)", background: "rgba(13,13,16,0.75)",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{tag}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 44 }}>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <button className="cta-primary" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 26px", borderRadius: 11, border: "none",
                background: "var(--text-1)", color: "#08080a",
                fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
                fontFamily: "var(--font-sans)",
              }}>
                Trade Market <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/predictions" style={{ textDecoration: "none" }}>
              <button className="cta-secondary" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "13px 26px", borderRadius: 11,
                border: "1px solid var(--border-2)",
                fontSize: 14, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em",
                fontFamily: "var(--font-sans)",
              }}>
                Sports Markets
              </button>
            </Link>
          </div>

          {/* Inline hero stats — classic grid strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            border: "1px solid var(--border-2)", borderRadius: 14, overflow: "hidden",
            maxWidth: 520, background: "rgba(10,10,12,0.85)", backdropFilter: "blur(8px)",
          }}>
            {[
              { val: sol.price > 0 ? `$${sol.price.toFixed(0)}` : "—", label: "SOL mark" },
              { val: "20×", label: "Max lev." },
              { val: "3", label: "Programs" },
              { val: "$5k", label: "Demo fund" },
            ].map(({ val, label }, i) => (
              <div key={label} style={{
                padding: "16px 14px", textAlign: "center",
                borderRight: i < 3 ? "1px solid var(--border-2)" : "none",
              }}>
                <div className="tnum" style={{
                  fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600,
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
            paddingTop: 24, borderTop: "1px solid var(--border-2)", maxWidth: 520,
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Built on
            </span>
            {["Solana", "Anchor", "USDC"].map(name => (
              <span key={name} style={{
                fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-3)",
                letterSpacing: "0.02em", fontWeight: 500,
              }}>{name}</span>
            ))}
          </div>
        </div>

        {/* Right: Live mini market widget */}
        <div style={{
          background: "rgba(11,11,14,0.92)", border: "1px solid var(--border-2)", borderRadius: 18,
          overflow: "hidden", animation: "fade-up 0.7s 0.12s ease both",
          boxShadow: "0 40px 80px rgba(0,0,0,0.75)",
          position: "relative", zIndex: 2, backdropFilter: "blur(12px)",
        }}>
          {/* Market bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid var(--border)",
            background: "var(--bg-2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {["#fb7185", "#fbbf24", "#34d399"].map(c => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.55 }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)", marginLeft: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>SOL-MARKET · ORDER BOOK</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-label)",
                textTransform: "uppercase", letterSpacing: "0.12em",
                padding: "3px 8px", borderRadius: 5,
                background: "var(--bg-3)", border: "1px solid var(--border-2)",
              }}>
                Market · v0.1
              </span>
              {sol.price > 0 && (
                <>
                  <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    ${sol.price.toFixed(2)}
                  </span>
                  <span className="tnum" style={{
                    fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 5px", borderRadius: 4,
                    background: isUp ? "var(--green-dim)" : "var(--red-dim)",
                    color: isUp ? "var(--green)" : "var(--red)",
                  }}>
                    {isUp ? "+" : ""}{sol.change.toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Column labels */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 14px 4px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Price</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Size</span>
          </div>

          {/* Asks */}
          <div>
            {[...book.asks].reverse().slice(0, 6).map(([price, size], i) => (
              <div key={`a${i}`} style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "3px 14px" }}>
                <div style={{ position: "absolute", inset: 0, right: 0, left: "auto", width: `${(size / maxAsk) * 55}%`, background: "var(--red-dim)" }} />
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", position: "relative" }}>{price.toFixed(2)}</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)", position: "relative" }}>{size >= 1000 ? (size / 1000).toFixed(1) + "k" : size.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Mid */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 14px",
            borderTop: "1px solid var(--border-2)", borderBottom: "1px solid var(--border-2)",
            background: "var(--bg-3)",
          }}>
            <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
              {sol.price > 0 ? `$${sol.price.toFixed(2)}` : "—"}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.12em" }}>MARK</span>
          </div>

          {/* Bids */}
          <div>
            {book.bids.slice(0, 6).map(([price, size], i) => (
              <div key={`b${i}`} style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "3px 14px" }}>
                <div style={{ position: "absolute", inset: 0, right: 0, left: "auto", width: `${(size / maxBid) * 55}%`, background: "var(--green-dim)" }} />
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--green)", position: "relative" }}>{price.toFixed(2)}</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-4)", position: "relative" }}>{size >= 1000 ? (size / 1000).toFixed(1) + "k" : size.toFixed(1)}</span>
              </div>
            ))}
          </div>

          {/* Active bet preview */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
            <div style={{ fontSize: 9, color: "var(--text-mono-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Cross-margin active
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <TokenIcon symbol="SOL" size={14} />
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-sans)" }}>SOL-MARKET Long 5×</span>
                </div>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>+$142.50</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 12 }}>🏀</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-sans)" }}>OKC YES · 1.69×</span>
                </div>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>-$250</span>
              </div>
            </div>
          </div>

          {/* Market CTA */}
          <div style={{ padding: "10px 14px 14px" }}>
            <Link href="/perps" style={{ textDecoration: "none", display: "block" }}>
              <div className="term-cta" style={{
                padding: "9px 0", borderRadius: 9, textAlign: "center",
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
                fontSize: 11, fontWeight: 600, color: "var(--green)",
                fontFamily: "var(--font-sans)", cursor: "pointer", letterSpacing: "0.01em",
              }}>
                Open Market →
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
          <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, var(--text-4), transparent)" }} />
        </div>
      </section>

      {/* ── HERO QUOTE STRIP ──────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)", padding: "32px 48px", textAlign: "center",
      }}>
        <p style={{
          margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: "clamp(20px, 2.4vw, 30px)", color: "var(--text-2)",
          letterSpacing: "-0.005em", lineHeight: 1.4, maxWidth: 760, marginInline: "auto",
        }}>
          &ldquo;One pool. Two products. Your sports win pays for your market loss.&rdquo;
        </p>
        <div style={{
          marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--text-mono-dim)", letterSpacing: "0.2em", textTransform: "uppercase",
        }}>
          Cross-margin · Solana native · Zero protocol deps
        </div>
      </div>

      {/* ── TICKER ────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        background: "#060608", overflow: "hidden", padding: "11px 0",
      }}>
        <div style={{ display: "flex", animation: "ticker 40s linear infinite", width: "max-content" }}>
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", padding: "0 28px", whiteSpace: "nowrap" }}>
                {item}
              </span>
              <span style={{ color: "var(--border-2)", fontSize: 14, lineHeight: 1 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          borderLeft: "1px solid var(--border)", borderTop: "1px solid var(--border)",
          marginTop: 80,
        }}>
          {[
            { label: "Demo volume", to: 2.1, prefix: "$", suffix: "M", decimals: 1 },
            { label: "Open interest", to: 480, prefix: "$", suffix: "k", decimals: 0 },
            { label: "Active markets", to: 12, prefix: "", suffix: "", decimals: 0 },
            { label: "Sports events", to: 8, prefix: "", suffix: " open", decimals: 0 },
          ].map(({ label, to, prefix, suffix, decimals }) => (
            <div key={label} style={{
              padding: "52px 40px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 52, fontWeight: 600,
                color: "var(--text-1)", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 12,
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
        <Eyebrow>The key insight</Eyebrow>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <h2 style={{
              fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 700,
              letterSpacing: "-0.04em", lineHeight: 1.04, margin: "0 0 32px",
              fontFamily: "var(--font-sans)",
            }}>
              Sports wins cover
              <br />
              <span className="gradient-text" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.02em" }}>your market losses.</span>
            </h2>

            <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.8, marginBottom: 32 }}>
              Every dollar you put in sits in one shared USDC vault.{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--green)", fontSize: 13 }}>cross_margin</code> tracks
              your total equity across market positions and sports bets simultaneously.
              When your OKC bet pays out, that gain is immediately available to absorb
              your SOL drawdown — no manual transfers.
            </p>

            <div style={{
              padding: "20px 24px", background: "var(--bg-2)",
              border: "1px solid var(--border)", borderLeft: "3px solid var(--green)",
              borderRadius: 12, marginBottom: 32,
              fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.8, color: "var(--text-4)",
            }}>
              <span style={{ color: "var(--green)" }}>health</span>
              {" = "}
              <span style={{ color: "var(--text-1)" }}>equity</span>
              {" / "}
              <span style={{ color: "var(--blue)" }}>locked_notional</span>
              <br />
              <span style={{ color: "var(--text-mono-dim)", fontSize: 11 }}># liquidate when health &lt; 500 bps</span>
            </div>

            <Link href="/docs" style={{ textDecoration: "none" }}>
              <button className="ghost-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 9,
                border: "1px solid var(--border-2)", background: "none",
                color: "var(--text-3)", fontSize: 13, cursor: "pointer",
                fontFamily: "var(--font-sans)", fontWeight: 500,
              }}>
                Read the architecture <ArrowUpRight size={13} />
              </button>
            </Link>
          </div>

          {/* Flow diagram */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Vault */}
            <div style={{
              padding: "24px", background: "var(--bg-2)",
              border: "1px solid var(--border)", borderRadius: 14,
              textAlign: "center", marginBottom: 4,
            }}>
              <div style={{ fontSize: 10, color: "var(--text-mono-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Shared USDC vault</div>
              <div className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.02em" }}>$5,000.00</div>
              <div style={{ fontSize: 10, color: "var(--text-mono-dim)", fontFamily: "var(--font-mono)", marginTop: 4 }}>cross_margin · single pool</div>
            </div>

            {/* Arrow down */}
            <div style={{ display: "flex", gap: 16, padding: "4px 0" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, rgba(52,211,153,0.2), var(--green))" }} />
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom, rgba(96,165,250,0.2), var(--blue))" }} />
              </div>
            </div>

            {/* Two products */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{
                padding: "20px", background: "var(--bg-2)",
                border: "1px solid rgba(52,211,153,0.18)", borderTop: "2px solid var(--green)",
                borderRadius: 12,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>perp_engine</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>
                  SOL-MARKET 5×<br />
                  <span className="tnum" style={{ color: "var(--green)", fontFamily: "var(--font-mono)" }}>P&L +$142.50</span>
                </div>
              </div>
              <div style={{
                padding: "20px", background: "var(--bg-2)",
                border: "1px solid rgba(96,165,250,0.18)", borderTop: "2px solid var(--blue)",
                borderRadius: 12,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>prediction_mkt</div>
                <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>
                  OKC YES $250<br />
                  <span className="tnum" style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>→ $422.50 if win</span>
                </div>
              </div>
            </div>

            {/* Arrow up */}
            <div style={{ display: "flex", gap: 16, padding: "4px 0" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to top, rgba(52,211,153,0.2), var(--green))" }} />
              </div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: 28, background: "linear-gradient(to top, rgba(251,191,36,0.2), var(--amber))" }} />
              </div>
            </div>

            {/* Health bar */}
            <div style={{
              padding: "16px 20px", background: "var(--bg-2)",
              border: "1px solid var(--border)", borderRadius: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Portfolio health</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>8,240 bps · SAFE</span>
              </div>
              <div style={{ height: 5, background: "var(--border-2)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "82%", background: "var(--accent-grad)", borderRadius: 3 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)" }}>0</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--red)" }}>500 bps liq</span>
                <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)" }}>10,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ──────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <Eyebrow>What you can trade</Eyebrow>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 28 }}>

          {/* MARKETS */}
          <Link href="/perps" style={{ textDecoration: "none" }}>
            <div className="product-card" style={{
              background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 22,
              padding: "40px 40px 36px", cursor: "pointer", minHeight: 420,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  01 · Leveraged Markets
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse-dot 2.5s infinite" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--green)" }}>LIVE</span>
                </span>
              </div>

              <h2 style={{
                fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 700,
                lineHeight: 1.05, margin: "0 0 20px",
                letterSpacing: "-0.03em", fontFamily: "var(--font-sans)",
              }}>
                Long or short.<br />Up to 20× leverage.
              </h2>

              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.8, margin: "0 0 auto" }}>
                Hybrid CLOB order book. Off-chain matching speed, on-chain settlement finality.
                Hourly funding rate anchors price to oracle. Any wallet can liquidate and earn 50 bps.
              </p>

              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1, background: "var(--border)", borderRadius: 12,
                overflow: "hidden", margin: "32px 0 28px",
              }}>
                {[["20×", "Max lev."], [sol.price > 0 ? `$${sol.price.toFixed(0)}` : "—", "SOL price"], ["0.05%", "Maker fee"]].map(([val, label]) => (
                  <div key={label} style={{ background: "var(--bg-2)", padding: "16px 14px" }}>
                    <div className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
                Open market <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* SPORTS */}
          <Link href="/predictions" style={{ textDecoration: "none" }}>
            <div className="product-card" style={{
              background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 22,
              padding: "40px 40px 36px", cursor: "pointer", minHeight: 420,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  02 · Sports Predictions
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--blue)",
                  background: "rgba(96,165,250,0.08)", padding: "3px 8px", borderRadius: 5,
                  border: "1px solid rgba(96,165,250,0.18)",
                }}>Beta</span>
              </div>

              <h2 style={{
                fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 700,
                lineHeight: 1.05, margin: "0 0 20px",
                letterSpacing: "-0.03em", fontFamily: "var(--font-sans)",
              }}>
                Bet on sports.<br />Hedge your risk.
              </h2>

              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.8, margin: "0 0 auto" }}>
                YES or NO on IPL, NBA, Champions League, F1, UFC, cricket, esports, and NFL.
                Every bet shares the same vault as your market positions — your sports winnings
                actively offset market drawdown.
              </p>

              {/* Live markets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "32px 0 28px" }}>
                {[
                  { e: "🏏", q: "RCB beat GT · IPL Final", yes: 53, odds: "1.89×", color: "var(--green)" },
                  { e: "🏏", q: "Kohli 50+ · IPL Final", yes: 58, odds: "1.72×", color: "var(--green)" },
                  { e: "🏀", q: "OKC win 2026 NBA", yes: 59, odds: "1.69×", color: "var(--blue)" },
                ].map(({ e, q, yes, odds, color }) => (
                  <div key={q} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", background: "var(--bg-3)",
                    borderRadius: 9, border: "1px solid var(--border)",
                  }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{e}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q}</span>
                    <div style={{ width: 52, height: 3, background: "var(--border-2)", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ height: "100%", width: `${yes}%`, background: color }} />
                    </div>
                    <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color, flexShrink: 0, minWidth: 38, textAlign: "right" }}>{odds}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--blue)" }}>
                Browse markets <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── ARCHITECTURE ─────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "100px 48px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          {/* Left */}
          <div>
            <Eyebrow>Under the hood</Eyebrow>
            <h2 style={{
              fontSize: "clamp(30px, 3.5vw, 52px)", fontWeight: 700,
              letterSpacing: "-0.035em", margin: "0 0 24px",
              lineHeight: 1.04, fontFamily: "var(--font-sans)",
            }}>
              Three custom Anchor programs.
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--text-3)", letterSpacing: "-0.02em" }}>Zero protocol deps.</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.85, marginBottom: 32 }}>
              Every line of Rust is ours.{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "#c084fc", fontSize: 12 }}>perp_engine</code> and{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--green)", fontSize: 12 }}>prediction_market</code> both
              CPI into{" "}
              <code style={{ fontFamily: "var(--font-mono)", color: "var(--blue)", fontSize: 12 }}>cross_margin</code> for every
              single margin operation. Portfolio health computed in bps across all products simultaneously.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/docs" style={{ textDecoration: "none" }}>
                <button className="ghost-btn" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 18px", borderRadius: 9,
                  border: "1px solid var(--border-2)", background: "none",
                  color: "var(--text-3)", fontSize: 13, cursor: "pointer",
                  fontFamily: "var(--font-sans)", fontWeight: 500,
                }}>
                  Architecture docs <ArrowUpRight size={13} />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: programs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              {
                name: "perp_engine", id: "FiTnBYBB…ktB", color: "#c084fc",
                label: "01", items: ["AMM-based perpetual futures", "Funding rate accumulator", "Permissionless liquidation", "CPI → cross_margin on every open"],
              },
              {
                name: "prediction_market", id: "ARFaBkMf…kU7", color: "var(--green)",
                label: "02", items: ["Binary YES/NO event markets", "Oracle-resolved outcomes", "Claim payouts after resolution", "CPI → cross_margin for collateral"],
              },
              {
                name: "cross_margin", id: "2Khz6Ehr…Dm", color: "var(--blue)",
                label: "03", items: ["Shared USDC vault per user", "Portfolio health in bps", "Cross-liquidation waterfall", "THE authority all others CPI into"],
              },
            ].map(({ name, id, color, label, items }) => (
              <div key={name} className="arch-row" style={{
                padding: "22px 24px", background: "var(--bg-2)",
                border: "1px solid var(--border)", borderRadius: 14,
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-mono-dim)" }}>{label}</span>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color, fontWeight: 600 }}>{name}</code>
                  </div>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)" }}>{id}</code>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {items.map(item => (
                    <span key={item} style={{
                      fontSize: 10, color: "var(--text-3)", padding: "3px 8px",
                      background: "var(--bg-3)", borderRadius: 4, border: "1px solid var(--border)",
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
          position: "relative", overflow: "hidden",
          background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 24,
          padding: "80px 72px",
          display: "grid", gridTemplateColumns: "1fr auto",
          alignItems: "center", gap: 48,
        }}>
          {/* signature glow */}
          <div aria-hidden style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 90% at 85% 50%, rgba(52,211,153,0.08), transparent 60%)",
          }} />
          <div style={{ position: "relative" }}>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 60px)", fontWeight: 700,
              letterSpacing: "-0.035em", margin: "0 0 16px", lineHeight: 1.0,
              fontFamily: "var(--font-sans)",
            }}>
              Start with $5,000.
              <br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--text-3)", letterSpacing: "-0.02em" }}>No wallet required.</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-3)", lineHeight: 1.75, margin: 0, maxWidth: 520 }}>
              Demo funds are on deposit the moment you arrive. Trade markets, bet on sports,
              and experience cross-margin risk management live — no real money, no setup, no friction.
            </p>
          </div>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <button className="cta-primary" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 32px", borderRadius: 11, border: "none",
                background: "var(--text-1)", color: "#08080a",
                fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "-0.01em",
                fontFamily: "var(--font-sans)", width: "100%",
              }}>
                Trade now <ArrowRight size={15} />
              </button>
            </Link>
            <Link href="/predictions" style={{ textDecoration: "none" }}>
              <button className="cta-secondary" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 32px", borderRadius: 11,
                border: "1px solid var(--border-2)", background: "none",
                color: "var(--text-3)", fontSize: 14, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em",
                fontFamily: "var(--font-sans)", width: "100%",
              }}>
                Browse sports
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 48px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LogoMark size={16} />
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--text-4)", letterSpacing: "-0.04em" }}>mrgin</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-mono-dim)", marginLeft: 8 }}>
              solana devnet · 2026
            </span>
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[["Markets", "/perps"], ["Sports", "/predictions"], ["Docs", "/docs"]].map(([label, href]) => (
              <Link key={href} href={href} className="nav-link" style={{
                textDecoration: "none", fontSize: 12, color: "var(--text-mono-dim)",
                fontFamily: "var(--font-sans)", fontWeight: 500,
              }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

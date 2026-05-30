"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, Clock, CheckCircle, Zap, Users } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import toast from "react-hot-toast";
import { DotmSquare3 } from "@/components/ui/dotm-square-3";
import { usePaperTrading } from "@/lib/paper-trading";
import { PaperWallet } from "@/components/PaperWallet";

// ─── Sports Markets ──────────────────────────────────────────────────────────
const SPORTS_MARKETS = [
  {
    id: "nba-1",
    sport: "NBA",
    emoji: "🏀",
    league: "NBA Finals 2026",
    question: "Will the Oklahoma City Thunder win the 2026 NBA Championship?",
    resolvesAt: new Date("2026-06-25").getTime(),
    yesPool: 142_800,
    noPool: 98_400,
    totalPool: 241_200,
    status: "Open",
    outcome: null,
    featured: true,
    recentBets: [
      { side: "yes", amount: 500, ago: "2m" },
      { side: "no", amount: 200, ago: "5m" },
      { side: "yes", amount: 1000, ago: "11m" },
    ],
  },
  {
    id: "ucl-1",
    sport: "Soccer",
    emoji: "⚽",
    league: "UEFA Champions League",
    question: "Will Real Madrid win the 2025-26 UEFA Champions League?",
    resolvesAt: new Date("2026-06-01").getTime(),
    yesPool: 89_200,
    noPool: 187_600,
    totalPool: 276_800,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "no", amount: 750, ago: "1m" },
      { side: "yes", amount: 300, ago: "8m" },
      { side: "no", amount: 1200, ago: "15m" },
    ],
  },
  {
    id: "f1-1",
    sport: "F1",
    emoji: "🏎️",
    league: "Formula 1 2026",
    question: "Will Max Verstappen win the 2026 F1 World Championship?",
    resolvesAt: new Date("2026-12-01").getTime(),
    yesPool: 67_400,
    noPool: 112_300,
    totalPool: 179_700,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "no", amount: 400, ago: "3m" },
      { side: "yes", amount: 150, ago: "9m" },
    ],
  },
  {
    id: "tennis-1",
    sport: "Tennis",
    emoji: "🎾",
    league: "Roland Garros 2026",
    question: "Will Carlos Alcaraz win the 2026 French Open?",
    resolvesAt: new Date("2026-06-08").getTime(),
    yesPool: 54_100,
    noPool: 43_800,
    totalPool: 97_900,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "yes", amount: 600, ago: "4m" },
      { side: "yes", amount: 250, ago: "12m" },
    ],
  },
  {
    id: "ufc-1",
    sport: "UFC",
    emoji: "🥊",
    league: "UFC 310",
    question: "Will Jon Jones defeat Stipe Miocic by KO or TKO?",
    resolvesAt: new Date("2026-06-28").getTime(),
    yesPool: 38_900,
    noPool: 29_600,
    totalPool: 68_500,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "yes", amount: 800, ago: "7m" },
      { side: "no", amount: 350, ago: "20m" },
    ],
  },
  {
    id: "nfl-1",
    sport: "NFL",
    emoji: "🏈",
    league: "Super Bowl LXI",
    question: "Will the Kansas City Chiefs win Super Bowl LXI?",
    resolvesAt: new Date("2027-02-08").getTime(),
    yesPool: 214_500,
    noPool: 189_300,
    totalPool: 403_800,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "yes", amount: 2000, ago: "6m" },
      { side: "no", amount: 500, ago: "14m" },
      { side: "yes", amount: 300, ago: "22m" },
    ],
  },
  {
    id: "cricket-1",
    sport: "Cricket",
    emoji: "🏏",
    league: "ICC T20 World Cup 2026",
    question: "Will India win the ICC T20 World Cup 2026?",
    resolvesAt: new Date("2026-11-15").getTime(),
    yesPool: 176_200,
    noPool: 94_800,
    totalPool: 271_000,
    status: "Open",
    outcome: null,
    featured: false,
    recentBets: [
      { side: "yes", amount: 1500, ago: "2m" },
      { side: "yes", amount: 400, ago: "10m" },
    ],
  },
  {
    id: "nba-resolved",
    sport: "NBA",
    emoji: "🏀",
    league: "NBA Playoffs 2026",
    question: "Will the Boston Celtics reach the 2026 Eastern Conference Finals?",
    resolvesAt: new Date("2026-05-20").getTime(),
    yesPool: 31_000,
    noPool: 22_000,
    totalPool: 53_000,
    status: "Resolved",
    outcome: true,
    featured: false,
    recentBets: [],
  },
];

const SPORT_FILTERS = ["All", "NBA", "Soccer", "F1", "Tennis", "UFC", "NFL", "Cricket"] as const;
type SportFilter = typeof SPORT_FILTERS[number];

interface Market {
  id: string;
  sport: string;
  emoji: string;
  league: string;
  question: string;
  resolvesAt: number;
  yesPool: number;
  noPool: number;
  totalPool: number;
  status: string;
  outcome: boolean | null;
  featured: boolean;
  recentBets: { side: string; amount: number; ago: string }[];
}

function timeUntil(ts: number) {
  const diff = ts - Date.now();
  if (diff < 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 30) return `${Math.floor(days / 30)}mo left`;
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

// ─── Bet Modal ─────────────────────────────────────────────────────────────
function BetModal({ market, onClose, defaultSide = "yes" }: {
  market: Market; onClose: () => void; defaultSide?: "yes" | "no";
}) {
  const { placeBet, state } = usePaperTrading();
  const [amount, setAmount] = useState("25");
  const [side, setSide] = useState<"yes" | "no">(defaultSide);
  const [loading, setLoading] = useState(false);

  const yesOdds = market.totalPool > 0 ? (market.totalPool / market.yesPool).toFixed(2) : "—";
  const noOdds = market.totalPool > 0 ? (market.totalPool / market.noPool).toFixed(2) : "—";
  const currentOdds = side === "yes" ? Number(yesOdds) : Number(noOdds);
  const potentialWin = (Number(amount) * currentOdds).toFixed(2);
  const profit = (Number(potentialWin) - Number(amount)).toFixed(2);
  const insufficient = Number(amount) > state.freeBalance;

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > state.freeBalance) {
      toast.error(`Insufficient balance — you have $${state.freeBalance.toFixed(2)}`);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const ok = placeBet({
      marketId: market.id,
      question: market.question,
      sport: market.sport,
      emoji: market.emoji,
      side,
      amount: amt,
      odds: currentOdds,
    });
    setLoading(false);
    if (ok) {
      toast.success(`${side.toUpperCase()} · $${amt} placed! Win = $${potentialWin}`, { icon: market.emoji });
      onClose();
    } else {
      toast.error("Failed to place bet");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#0d0d0d", border: "1px solid #222", borderRadius: 20, padding: 32, width: 440, maxWidth: "92vw", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 28 }}>{market.emoji}</span>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>{market.league}</div>
              <p style={{ fontSize: 14, color: "var(--text-1)", lineHeight: 1.5, margin: 0, fontWeight: 500, maxWidth: 320 }}>{market.question}</p>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "3px 7px", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)", marginBottom: 4 }}>PAPER</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-1)", fontWeight: 700 }}>${state.freeBalance.toFixed(2)}</div>
            <div style={{ fontSize: 9, color: "var(--text-4)" }}>available</div>
          </div>
        </div>

        {/* YES / NO toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {(["yes", "no"] as const).map(s => {
            const odds = s === "yes" ? yesOdds : noOdds;
            const pct = s === "yes"
              ? ((market.yesPool / market.totalPool) * 100).toFixed(0)
              : ((market.noPool / market.totalPool) * 100).toFixed(0);
            return (
              <button key={s} onClick={() => setSide(s)} style={{
                padding: "14px 12px", borderRadius: 12,
                border: side === s
                  ? `2px solid ${s === "yes" ? "#22c55e" : "#ef4444"}`
                  : "2px solid #1a1a1a",
                background: side === s
                  ? `${s === "yes" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`
                  : "#111",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: s === "yes" ? "#22c55e" : "#ef4444", marginBottom: 4 }}>
                  {s === "yes" ? "✓ YES" : "✗ NO"}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>{odds}×</div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{pct}% probability</div>
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Bet Amount (USDC)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="25.00"
            style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 16, fontFamily: "var(--font-mono)", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {["10", "25", "50", "100", "250"].map(a => (
            <button key={a} onClick={() => setAmount(a)} style={{
              flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid #1a1a1a",
              background: amount === a ? "#1e1e1e" : "none", color: amount === a ? "#f0f0f0" : "#444",
              fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 0.12s",
            }}>
              ${a}
            </button>
          ))}
        </div>

        {/* Payout summary */}
        <div style={{ background: "#111", borderRadius: 10, padding: "14px 16px", border: "1px solid #1a1a1a", marginBottom: 20 }}>
          {[
            ["Odds", `${currentOdds}×`],
            ["Potential payout", `$${potentialWin}`],
            ["Profit if correct", `+$${profit}`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#444" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#f0f0f0" }}>{val}</span>
            </div>
          ))}
        </div>

        <button onClick={submit} disabled={loading || !amount || insufficient} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
          background: insufficient ? "var(--border)" : side === "yes" ? "#22c55e" : "#ef4444",
          color: insufficient ? "var(--text-3)" : side === "yes" ? "#000" : "#fff",
          fontSize: 14, fontWeight: 700,
          cursor: (loading || insufficient) ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)", opacity: loading ? 0.6 : 1, transition: "all 0.15s",
        }}>
          {loading ? "Placing…"
            : insufficient ? `Insufficient balance`
            : `Place ${side.toUpperCase()} — $${amount || "0"}`}
        </button>
        {insufficient && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#ef4444", marginTop: 8 }}>
            Need ${(Number(amount) - state.freeBalance).toFixed(2)} more · reset account for $5,000
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Featured Market ────────────────────────────────────────────────────────
function FeaturedMarket({ market, onBet }: { market: Market; onBet: (side: "yes" | "no") => void }) {
  const yesPct = (market.yesPool / market.totalPool) * 100;
  const noPct = 100 - yesPct;
  const yesOdds = (market.totalPool / market.yesPool).toFixed(2);
  const noOdds = (market.totalPool / market.noPool).toFixed(2);

  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #222", borderRadius: 20, padding: 32, marginBottom: 32, position: "relative", overflow: "hidden" }}>
      {/* Decorative dotmatrix */}
      <div style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", opacity: 0.15 }}>
        <DotmSquare3 size={80} dotSize={6} color="grad-aurora" animated hoverAnimated />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: "#f59e0b", fontFamily: "var(--font-mono)", background: "rgba(245,158,11,0.1)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)" }}>
          ★ FEATURED
        </span>
        <span style={{ fontSize: 10, color: "#444", fontFamily: "var(--font-mono)" }}>{market.league}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 40 }}>{market.emoji}</span>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f0", margin: "0 0 4px", fontFamily: "var(--font-sans)", maxWidth: 600 }}>
            {market.question}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> {timeUntil(market.resolvesAt)}
            </span>
            <span style={{ fontSize: 12, color: "#555", display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} /> ${market.totalPool.toLocaleString()} pool
            </span>
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#22c55e", fontWeight: 700 }}>
            YES {yesPct.toFixed(0)}% · {yesOdds}×
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#ef4444", fontWeight: 700 }}>
            {noOdds}× · {noPct.toFixed(0)}% NO
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#ef4444", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${yesPct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)", transition: "width 0.5s" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onBet("yes")} style={{
          flex: 1, padding: "13px 0", borderRadius: 10, border: "none",
          background: "#22c55e", color: "#000", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          Bet YES · {yesOdds}×
        </button>
        <button onClick={() => onBet("no")} style={{
          flex: 1, padding: "13px 0", borderRadius: 10, border: "none",
          background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          Bet NO · {noOdds}×
        </button>
      </div>
    </div>
  );
}

// ─── Market Card ───────────────────────────────────────────────────────────
function MarketCard({ market, onBet }: { market: Market; onBet: (side: "yes" | "no") => void }) {
  const yesPct = market.totalPool > 0 ? (market.yesPool / market.totalPool) * 100 : 50;
  const noPct = 100 - yesPct;
  const yesOdds = (market.totalPool / market.yesPool).toFixed(2);
  const noOdds = (market.totalPool / market.noPool).toFixed(2);
  const isOpen = market.status === "Open";
  const isResolved = market.status === "Resolved";

  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16,
      padding: 22, display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.2s, transform 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>{market.emoji}</span>
          <span style={{ fontSize: 10, color: "#555", fontFamily: "var(--font-mono)" }}>{market.league}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isResolved
            ? <CheckCircle size={11} color={market.outcome ? "#22c55e" : "#ef4444"} />
            : <Zap size={11} color="#f59e0b" />}
          <span style={{
            fontSize: 10, fontFamily: "var(--font-mono)",
            color: isResolved ? (market.outcome ? "#22c55e" : "#ef4444") : "#f59e0b",
          }}>
            {isResolved ? (market.outcome ? "YES" : "NO") : timeUntil(market.resolvesAt)}
          </span>
        </div>
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", lineHeight: 1.55, margin: 0, minHeight: 40 }}>
        {market.question}
      </p>

      {/* Probability bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#22c55e", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            YES {yesPct.toFixed(0)}%
          </span>
          <span style={{ fontSize: 11, color: "#ef4444", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
            {noPct.toFixed(0)}% NO
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "#ef4444", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${yesPct}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)" }} />
        </div>
      </div>

      {/* Odds + pool */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "YES odds", val: `${yesOdds}×`, color: "#22c55e" },
          { label: "NO odds", val: `${noOdds}×`, color: "#ef4444" },
          { label: "Pool", val: `$${(market.totalPool / 1000).toFixed(0)}k`, color: "#f0f0f0" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#111", borderRadius: 8, padding: "8px 10px", border: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 8, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      {isOpen && market.recentBets.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {market.recentBets.slice(0, 3).map((b, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: 4,
              background: b.side === "yes" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              color: b.side === "yes" ? "#22c55e" : "#ef4444", border: `1px solid ${b.side === "yes" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
            }}>
              {b.side.toUpperCase()} ${b.amount} · {b.ago} ago
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isOpen ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onBet("yes")} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)",
            background: "rgba(34,197,94,0.08)", color: "#22c55e",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.color = "#000"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.08)"; e.currentTarget.style.color = "#22c55e"; }}
          >
            Bet YES · {yesOdds}×
          </button>
          <button onClick={() => onBet("no")} style={{
            flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)", color: "#ef4444",
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.12s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
          >
            Bet NO · {noOdds}×
          </button>
        </div>
      ) : (
        <button style={{
          width: "100%", padding: "10px 0", borderRadius: 8,
          border: "1px solid #1e1e1e", background: "none",
          color: market.outcome ? "#22c55e" : "#555",
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>
          {market.outcome ? "✓ Claim Winnings" : "Market Closed"}
        </button>
      )}
    </div>
  );
}

// ─── Live Feed ──────────────────────────────────────────────────────────────
const LIVE_FEED = [
  { sport: "🏀", side: "yes", amount: 500, question: "OKC Thunder NBA Champs", ago: 8 },
  { sport: "⚽", side: "no", amount: 1200, question: "Real Madrid UCL", ago: 23 },
  { sport: "🏈", side: "yes", amount: 2000, question: "Chiefs Super Bowl LXI", ago: 41 },
  { sport: "🏏", side: "yes", amount: 1500, question: "India T20 World Cup", ago: 67 },
  { sport: "🎾", side: "yes", amount: 600, question: "Alcaraz French Open", ago: 94 },
  { sport: "🥊", side: "yes", amount: 800, question: "Jones KO/TKO win", ago: 118 },
  { sport: "🏎️", side: "no", amount: 400, question: "Verstappen F1 2026", ago: 152 },
  { sport: "🏀", side: "no", amount: 200, question: "OKC Thunder NBA Champs", ago: 189 },
];

function LiveFeed() {
  const [feed, setFeed] = useState(LIVE_FEED);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setFeed(prev => {
        const newEntry = LIVE_FEED[Math.floor(Math.random() * LIVE_FEED.length)];
        return [{ ...newEntry, ago: 0 }, ...prev.slice(0, 11)];
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: 20, height: "fit-content", position: "sticky", top: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f0" }}>Live Bets</span>
        <span style={{ fontSize: 10, color: "#2a2a2a", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
          {tick > 0 && "just now"}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {feed.slice(0, 10).map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#111", borderRadius: 8, border: "1px solid #1a1a1a", opacity: i === 0 && tick > 0 ? 1 : 0.85, transition: "opacity 0.3s" }}>
            <span style={{ fontSize: 14 }}>{b.sport}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.question}</div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: b.side === "yes" ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                {b.side.toUpperCase()} ${b.amount}
              </div>
            </div>
            <span style={{ fontSize: 9, color: "#2a2a2a", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
              {i === 0 && tick > 0 ? "now" : `${b.ago}s`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function PredictionsPage() {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [initialSide, setInitialSide] = useState<"yes" | "no">("yes");
  const [filter, setFilter] = useState<SportFilter>("All");

  const openBet = (market: Market, side: "yes" | "no") => { setInitialSide(side); setSelectedMarket(market); };

  const featured = SPORTS_MARKETS.find(m => m.featured)!;
  const rest = SPORTS_MARKETS.filter(m => !m.featured);
  const filtered = filter === "All" ? rest : rest.filter(m => m.sport === filter);

  const totalVolume = SPORTS_MARKETS.reduce((s, m) => s + m.totalPool, 0);
  const openCount = SPORTS_MARKETS.filter(m => m.status === "Open").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0" }}>

      {/* Nav */}
      <header style={{ height: 52, display: "flex", alignItems: "center", padding: "0 28px", borderBottom: "1px solid #111", gap: 12, position: "sticky", top: 0, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(8px)", zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "#444", textDecoration: "none" }}>
          <ChevronLeft size={14} />
        </Link>
        <Activity size={13} color="#666" />
        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "#f0f0f0" }}>mrgin</span>
        <span style={{ color: "#222", fontSize: 13 }}>/</span>
        <span style={{ color: "#666", fontSize: 12 }}>Sports Predictions</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <PaperWallet />
          {/* Global stats */}
          <div style={{ display: "flex", gap: 20, marginRight: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Volume</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>
                ${(totalVolume / 1000).toFixed(0)}k
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.1em" }}>Open</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{openCount}</div>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* Body — two-column layout */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 28px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>

        {/* Left: main content */}
        <div>
          {/* Page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <DotmSquare3 size={32} dotSize={4} color="grad-aurora" animated />
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, fontFamily: "var(--font-sans)" }}>Sports Prediction Markets</h1>
              <p style={{ fontSize: 12, color: "#555", margin: 0 }}>Bet on sports outcomes. Shared collateral pool with your perp positions.</p>
            </div>
          </div>

          {/* Featured */}
          <FeaturedMarket market={featured} onBet={(side) => openBet(featured, side)} />

          {/* Sport filter tabs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 24 }}>
            {SPORT_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 20, border: "1px solid",
                borderColor: filter === f ? "#444" : "#1a1a1a",
                background: filter === f ? "#1e1e1e" : "none",
                color: filter === f ? "#f0f0f0" : "#444",
                fontSize: 12, fontWeight: filter === f ? 600 : 400,
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.12s",
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Market grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map(m => (
              <MarketCard key={m.id} market={m} onBet={(side) => openBet(m as Market, side)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#2a2a2a" }}>
              <p style={{ fontSize: 13 }}>No {filter} markets open right now.</p>
            </div>
          )}
        </div>

        {/* Right: live feed */}
        <LiveFeed />
      </div>

      {/* Bet modal */}
      {selectedMarket && (
        <BetModal market={selectedMarket as Market} onClose={() => setSelectedMarket(null)} defaultSide={initialSide} />
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}

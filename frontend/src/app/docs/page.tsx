"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { AccountButton } from "@/components/AccountButton";

const SECTIONS = [
  "Introduction",
  "Getting Started",
  "System Architecture",
  "Markets & Trading",
  "Cross-Margin Vault",
  "Sports Predictions",
  "Order Matching",
  "Liquidations & Risk",
  "Demo Accounts",
  "API Reference",
  "Data Flow",
  "FAQ",
] as const;

function CodeBlock({ code, lang = "text" }: { code: string; lang?: string }) {
  return (
    <div style={{
      background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 12,
      padding: "16px 20px", overflowX: "auto", marginBottom: 16,
    }}>
      <div style={{ fontSize: 9, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>{lang}</div>
      <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.75, whiteSpace: "pre" }}>{code}</pre>
    </div>
  );
}

function Tag({ children, color = "var(--green)" }: { children: string; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: "var(--font-mono)", padding: "3px 8px", borderRadius: 6,
      background: `${color}14`, color, border: `1px solid ${color}28`,
    }}>{children}</span>
  );
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} style={{
      fontSize: 26, fontWeight: 700, color: "var(--text-1)", margin: "0 0 10px",
      fontFamily: "var(--font-sans)", letterSpacing: "-0.03em", scrollMarginTop: 80,
    }}>{children}</h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-1)", margin: "28px 0 10px", fontFamily: "var(--font-sans)" }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.8, margin: "0 0 14px" }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "48px 0" }} />;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 18px", padding: "0 0 0 18px", color: "var(--text-3)", fontSize: 14, lineHeight: 1.85 }}>
      {items.map(item => <li key={item} style={{ marginBottom: 6 }}>{item}</li>)}
    </ul>
  );
}

function Card({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div style={{
      background: "var(--bg-2)", border: `1px solid ${color}22`, borderTop: `2px solid ${color}`,
      borderRadius: 14, padding: "20px 22px", marginBottom: 12,
    }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0, lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  const isGet = method === "GET";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2,
        color: isGet ? "var(--green)" : "var(--blue)",
        background: isGet ? "var(--green-dim)" : "rgba(96,165,250,0.1)",
        padding: "3px 7px", borderRadius: 5,
      }}>{method}</span>
      <div>
        <code style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-1)" }}>{path}</code>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: "var(--accent-grad)", color: "#08080a",
        display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800,
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.75 }}>{children}</div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-1)", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <header style={{
        height: 52, display: "flex", alignItems: "center", padding: "0 28px",
        borderBottom: "1px solid var(--border)", gap: 12,
        position: "sticky", top: 0, background: "rgba(8,8,10,0.92)", backdropFilter: "blur(12px)", zIndex: 50,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-4)", textDecoration: "none" }}>
          <ChevronLeft size={14} />
        </Link>
        <LogoMark size={16} />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16, color: "var(--text-1)", letterSpacing: "-0.04em", marginLeft: 2 }}>mrgin</span>
        <span style={{ color: "var(--border-2)", fontSize: 13 }}>/</span>
        <span style={{ color: "var(--text-3)", fontSize: 12 }}>Docs</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/perps" style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>Markets</Link>
          <AccountButton compact />
        </div>
      </header>

      {/* Hero strip */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        background: "linear-gradient(180deg, rgba(52,211,153,0.04) 0%, transparent 100%)",
        padding: "48px 28px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 12 }}>
            Documentation
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 12px", fontFamily: "var(--font-sans)" }}>
            mrgin Protocol Docs
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-3)", lineHeight: 1.75, margin: 0, maxWidth: 640 }}>
            Explore how mrgin combines leveraged markets and sports predictions in one cross-margined USDC vault — architecture, trading flows, risk, and public APIs.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
            <Tag>Solana</Tag>
            <Tag color="var(--blue)">USDC-settled</Tag>
            <Tag color="var(--amber)">Devnet</Tag>
            <Tag color="#c084fc">Cross-margin</Tag>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 28px" }}>

        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0, paddingTop: 36, paddingRight: 32,
          position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
            On this page
          </div>
          {SECTIONS.map(s => (
            <a key={s} href={`#${s.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "")}`} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 8px", borderRadius: 6, textDecoration: "none",
              color: "var(--text-4)", fontSize: 13, marginBottom: 2, transition: "color 120ms ease-out",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
            >
              <ChevronRight size={11} />
              {s}
            </a>
          ))}

          <div style={{ marginTop: 28, padding: 16, background: "var(--bg-2)", borderRadius: 12, border: "1px solid var(--border-2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 14 }}>
              mrgin is live on Solana <strong style={{ color: "var(--green)" }}>devnet</strong>. Start with $5,000 demo funds — no wallet required.
            </div>
            <Link href="/perps" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0", borderRadius: 8, background: "var(--accent-grad)",
                color: "#08080a", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)",
              }}>
                Open Markets <ArrowRight size={13} />
              </div>
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, paddingTop: 36, paddingBottom: 100, maxWidth: 740 }}>

          {/* Introduction */}
          <section id="introduction">
            <H2 id="introduction">Introduction</H2>
            <P>
              <strong style={{ color: "var(--text-1)" }}>mrgin</strong> is a cross-margined trading platform on Solana. It unifies two product lines — leveraged crypto markets (SOL, BTC, ETH) and binary sports predictions — inside a single USDC collateral pool.
            </P>
            <P>
              The core idea is simple: winnings from one product can cushion drawdowns in the other. A profitable sports bet increases your free collateral for markets; a winning market position does the same for your sports exposure. One account, one equity number, shared risk.
            </P>
            <BulletList items={[
              "Up to 20× leverage on USDC-settled markets",
              "Binary YES/NO sports markets with shared vault collateral",
              "Hybrid order book — fast off-chain matching, on-chain settlement",
              "Permissionless liquidations when portfolio health falls below threshold",
              "$5,000 demo balance for every new account",
            ]} />
          </section>

          <Divider />

          {/* Getting Started */}
          <section id="getting-started">
            <H2>Getting Started</H2>
            <P>No wallet or deposit is required to explore the platform. Create an account and you receive demo USDC instantly.</P>

            <Step n={1} title="Create your account">
              Click <strong>Sign in</strong> in the header, then <strong>Create an account</strong> with your email and a password (8+ characters). Your session persists across visits.
            </Step>
            <Step n={2} title="Open the Markets terminal">
              Navigate to <Link href="/perps" style={{ color: "var(--green)" }}>Markets</Link>. Choose SOL, BTC, or ETH from the market selector. Live prices, charts, and order book data stream in real time.
            </Step>
            <Step n={3} title="Place your first trade">
              Use the trade form on the right — pick Long or Short, set size and leverage, then submit. Collateral is deducted from your free balance and locked against the position.
            </Step>
            <Step n={4} title="Track positions & history">
              Open positions appear in the bottom panel. Close anytime at the current mark price. Closed trades show up under the <strong>History</strong> tab with realized PnL and ROE.
            </Step>
            <Step n={5} title="Try sports predictions">
              Head to <Link href="/predictions" style={{ color: "var(--blue)" }}>Sports</Link> to place YES/NO bets. They draw from the same vault — cross-margin in action.
            </Step>

            <div style={{
              padding: "14px 16px", borderRadius: 10, background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.18)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.7,
            }}>
              <strong style={{ color: "var(--amber)" }}>Devnet note:</strong> mrgin currently runs on Solana devnet with simulated/demo settlement. Mainnet deployment is planned. Do not treat demo balances as real funds.
            </div>
          </section>

          <Divider />

          {/* Architecture */}
          <section id="system-architecture">
            <H2>System Architecture</H2>
            <P>
              mrgin follows a layered architecture: on-chain programs hold collateral and enforce rules; off-chain services handle matching, indexing, and real-time data; the web app is the user interface.
            </P>

            <CodeBlock lang="architecture" code={`┌─────────────────────────────────────────────────────┐
│                   Web Application                    │
│         Markets · Sports · Portfolio · History       │
└────────────────────────┬────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   REST + WS API    Account Service   Price Feeds
   (markets, book)  (auth, demo state) (external)
         │               │               │
         └───────────────┼───────────────┘
                         ▼
              Off-chain Matching Engine
              (order book, fill routing)
                         │
                         ▼
              Solana Programs (devnet)
    ┌────────────────────┼────────────────────┐
    │   Market Engine    │  Prediction Markets │
    │   Cross-Margin Vault (shared USDC)      │
    └─────────────────────────────────────────┘`} />

            <H3>Core services</H3>
            <Card title="Market Engine" color="#c084fc" desc="Manages leveraged positions, funding rates, and market settlement. All positions are USDC-collateralised and oracle-anchored." />
            <Card title="Cross-Margin Vault" color="#60a5fa" desc="Single USDC pool per user. Tracks total equity, locked margin, and portfolio health across every open product." />
            <Card title="Prediction Markets" color="#34d399" desc="Binary event markets (YES/NO). Bets lock collateral from the same vault; resolved outcomes return winnings pro-rata." />
            <Card title="Matching Engine" color="#fbbf24" desc="Maintains the live order book off-chain for low-latency matching, then settles fills on-chain for finality." />
            <Card title="Indexer" color="#fb7185" desc="Listens to on-chain events and writes trade history, liquidations, and funding records to the database for portfolio views." />
          </section>

          <Divider />

          {/* Markets */}
          <section id="markets-trading">
            <H2>Markets &amp; Trading</H2>
            <P>
              mrgin supports multiple USDC-settled markets. Each market has its own order book, funding rate, and mark price sourced from external oracle feeds.
            </P>

            <H3>Supported markets</H3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { sym: "SOL", lev: "Up to 20×", fee: "0.05% maker" },
                { sym: "BTC", lev: "Up to 20×", fee: "0.05% maker" },
                { sym: "ETH", lev: "Up to 20×", fee: "0.05% maker" },
              ].map(m => (
                <div key={m.sym} style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", borderRadius: 12, padding: "16px 14px" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>{m.sym}-MARKET</div>
                  <div style={{ fontSize: 11, color: "var(--text-4)", lineHeight: 1.6 }}>{m.lev}<br />{m.fee}</div>
                </div>
              ))}
            </div>

            <H3>Order types</H3>
            <BulletList items={[
              "Market orders — filled immediately at the best available price (AMM backstop when book is thin)",
              "Limit orders — rest in the book until matched or cancelled",
              "All orders require sufficient free collateral before submission",
            ]} />

            <H3>Margin calculation</H3>
            <CodeBlock lang="formula" code={`Required margin  =  notional / leverage
Notional         =  size × entry price
Free collateral  =  total equity − locked margin
Max position     =  free collateral × leverage`} />

            <H3>Funding rate</H3>
            <P>
              Perpetual markets use an hourly funding rate to keep the mark price anchored to the spot oracle. When funding is positive, longs pay shorts; when negative, shorts pay longs. The rate is displayed on the Markets terminal header.
            </P>
          </section>

          <Divider />

          {/* Cross-Margin */}
          <section id="cross-margin-vault">
            <H2>Cross-Margin Vault</H2>
            <P>
              Instead of siloed margin per product, mrgin uses a single vault per user. Every deposit, position, and bet updates the same equity pool.
            </P>

            <H3>Equity formula</H3>
            <CodeBlock lang="formula" code={`Total equity     =  free balance + locked collateral + unrealized PnL
Portfolio health =  free collateral / locked notional   (in basis points)
Liquidation      =  health drops below 500 bps (5%)`} />

            <H3>How cross-margin helps</H3>
            <BulletList items={[
              "Sports winnings increase free collateral available for new market positions",
              "Profitable market positions cushion sports bet drawdowns",
              "One liquidation check covers the entire portfolio, not individual products",
              "No manual transfers between products — collateral flows automatically",
            ]} />

            <H3>Example scenario</H3>
            <P>
              You deposit $5,000 demo USDC. You open a $1,000-collateral SOL long at 5× and place a $250 YES bet on an NBA game. Your locked collateral is $1,250; free balance is $3,750. If the bet wins $422, your equity rises and your portfolio health improves — even if the SOL position is temporarily underwater.
            </P>
          </section>

          <Divider />

          {/* Sports */}
          <section id="sports-predictions">
            <H2>Sports Predictions</H2>
            <P>
              Binary prediction markets let you bet YES or NO on sporting events. Odds are pool-based: your payout depends on the ratio of YES vs NO liquidity at entry.
            </P>
            <BulletList items={[
              "Select an event from the Sports page (NBA, IPL, NFL, and more)",
              "Choose YES or NO and enter your stake in USDC",
              "Collateral locks from your shared vault — same balance as Markets",
              "When the market resolves, winners receive their share of the pool pro-rata",
              "Lost bets forfeit locked collateral back to the pool",
            ]} />
            <P>
              Because sports bets share the cross-margin vault, a winning bet can keep your account healthy enough to avoid liquidation on an underwater market position.
            </P>
          </section>

          <Divider />

          {/* Order Matching */}
          <section id="order-matching">
            <H2>Order Matching</H2>
            <P>
              mrgin uses a <strong style={{ color: "var(--text-1)" }}>hybrid central-limit order book (CLOB)</strong>. Resting limit orders are matched off-chain for speed; the result is settled on-chain for security and finality.
            </P>

            <H3>Matching flow</H3>
            <BulletList items={[
              "User submits an order via the web terminal",
              "Engine validates collateral and adds the order to the book",
              "When bid ≥ ask, a fill is generated at the maker's price",
              "Fill is settled on-chain — position PDAs and vault balances update",
              "Fill event is indexed and broadcast to connected clients via WebSocket",
            ]} />

            <H3>Price sources</H3>
            <P>
              Mark prices for charts, order books, and liquidations are sourced from major exchange feeds (Binance spot). The oracle price anchors funding calculations and acts as the AMM backstop reference when the book has no resting liquidity.
            </P>
          </section>

          <Divider />

          {/* Liquidations */}
          <section id="liquidations-risk">
            <H2>Liquidations &amp; Risk</H2>
            <P>
              When portfolio health falls below <strong style={{ color: "var(--text-1)" }}>500 basis points (5%)</strong>, the account becomes eligible for liquidation. Liquidations are permissionless — any participant can trigger them and earn a fee.
            </P>

            <H3>Liquidation triggers</H3>
            <BulletList items={[
              "Portfolio health &lt; 5% — automatic liquidation eligible",
              "Adverse price move erodes unrealized PnL below maintenance margin",
              "Multiple losing positions and bets compound locked collateral usage",
            ]} />

            <H3>Liquidation waterfall</H3>
            <BulletList items={[
              "Step 1 — Forfeit or close losing prediction bets (easier to unwind)",
              "Step 2 — Close largest market positions until health is restored",
              "Step 3 — Liquidator receives a fee (50 bps of notional) as incentive",
            ]} />

            <H3>Risk management tips</H3>
            <BulletList items={[
              "Monitor unrealized PnL in the Positions panel and account dropdown",
              "Lower leverage on volatile markets (BTC moves differently than SOL)",
              "Cross-margin helps, but correlated losses across products still increase risk",
              "Use the History tab to review closed trades and refine position sizing",
            ]} />
          </section>

          <Divider />

          {/* Demo Accounts */}
          <section id="demo-accounts">
            <H2>Demo Accounts</H2>
            <P>
              Every new account starts with <strong style={{ color: "var(--text-1)" }}>$5,000 USDC</strong> in demo funds. No wallet connection, no deposit, no KYC — just sign up and trade.
            </P>

            <H3>What gets saved</H3>
            <BulletList items={[
              "Free balance and locked collateral",
              "All open market positions and sports bets",
              "Full trade history with entry, exit, PnL, and ROE",
              "Account state syncs to the cloud when signed in — access from any device",
            ]} />

            <H3>Reset</H3>
            <P>
              You can reset your demo account to $5,000 at any time from the account dropdown in the header. This clears all positions, bets, and history — useful for testing strategies from a clean slate.
            </P>

            <H3>Guest mode</H3>
            <P>
              You can also trade without signing in — state is stored locally in your browser only. Sign in to persist your account to the cloud.
            </P>
          </section>

          <Divider />

          {/* API Reference */}
          <section id="api-reference">
            <H2>API Reference</H2>
            <P>
              The public REST API exposes market data, order books, portfolio summaries, and prediction markets. A WebSocket endpoint streams real-time fills, book updates, and liquidations.
            </P>

            <H3>Markets</H3>
            <Endpoint method="GET" path="/markets" desc="List all markets with mark price, 24h change, funding rate, and open interest." />
            <Endpoint method="GET" path="/markets/:market" desc="Single market details and current stats." />
            <Endpoint method="GET" path="/orderbook/:market" desc="Aggregated bid/ask levels for the order book." />
            <Endpoint method="GET" path="/trades/:market" desc="Recent fills and position events for a market." />

            <H3>Portfolio</H3>
            <Endpoint method="GET" path="/portfolio/:wallet" desc="Positions, bets, and health summary for a connected wallet." />
            <Endpoint method="GET" path="/portfolio/:wallet/trades" desc="Trade history for a wallet." />
            <Endpoint method="GET" path="/portfolio/:wallet/pnl" desc="Historical equity curve." />
            <Endpoint method="GET" path="/portfolio/:wallet/liquidations" desc="Liquidation history." />

            <H3>Sports</H3>
            <Endpoint method="GET" path="/prediction-markets" desc="All binary sports markets with pool sizes and status." />

            <H3>WebSocket</H3>
            <CodeBlock lang="websocket" code={`Connect to /stream

Channels:
  fills         — { price, size, side, market, timestamp }
  book-update   — { market, bids[], asks[] }
  liquidations  — { wallet, notional, fee }`} />

            <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 8, lineHeight: 1.75 }}>
              Base URL is configured via environment variable in your deployment. Demo account auth (sign-up, login, state sync) is handled by the web application directly.
            </p>
          </section>

          <Divider />

          {/* Data Flow */}
          <section id="data-flow">
            <H2>Data Flow</H2>

            <H3>Order lifecycle</H3>
            <CodeBlock lang="sequence" code={`User                Web App              Engine              Chain
 │                     │                    │                   │
 │── place order ─────►│                    │                   │
 │                     │── validate margin ►│                   │
 │                     │                    │── match fill ────►│
 │                     │                    │◄── confirmed ──────│
 │                     │◄── update UI ──────│                   │
 │◄── toast + position │                    │                   │`} />

            <H3>Price update → liquidation check</H3>
            <CodeBlock lang="sequence" code={`Oracle Feed ──► Mark Price Update ──► Health Recalc
                                              │
                                    health < 5% ?
                                              │
                              Yes ──► Liquidation Bot ──► On-chain Close
                              No  ──► Continue monitoring`} />

            <H3>Cross-margin equity update</H3>
            <BulletList items={[
              "Every price tick recalculates unrealized PnL on open market positions",
              "Resolved sports bets update realized PnL immediately",
              "Free collateral = equity minus locked margin across all products",
              "UI polls and WebSocket events keep the account dropdown live",
            ]} />
          </section>

          <Divider />

          {/* FAQ */}
          <section id="faq">
            <H2>FAQ</H2>

            <H3>Do I need a Solana wallet?</H3>
            <P>No — demo trading works with just an email account. Connect a wallet optionally to view on-chain portfolio data on the Portfolio tab.</P>

            <H3>Is this real money?</H3>
            <P>Not yet. Demo accounts use simulated USDC on devnet. Treat all balances and PnL as practice only.</P>

            <H3>What markets can I trade?</H3>
            <P>SOL, BTC, and ETH leveraged markets, plus binary sports predictions. All settle in USDC from one vault.</P>

            <H3>How does cross-margin work?</H3>
            <P>One pool of collateral backs every product. Winnings in sports can offset market losses and vice versa — no manual transfers needed.</P>

            <H3>Where is my data stored?</H3>
            <P>Signed-in accounts are stored securely in a cloud database. Guest sessions use browser local storage only.</P>

            <H3>What happens when I get liquidated?</H3>
            <P>Positions and bets are closed automatically to restore portfolio health. The liquidator earns a fee. You can review the event in your history once on-chain indexing is connected.</P>
          </section>

          {/* CTA */}
          <div style={{
            marginTop: 56, padding: "36px 32px", borderRadius: 18,
            background: "var(--bg-2)", border: "1px solid var(--border-2)",
            textAlign: "center",
          }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.03em" }}>Ready to get started?</h3>
            <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 22px", lineHeight: 1.7 }}>
              Open the Markets terminal with $5,000 demo USDC. No wallet, no deposit, no friction.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/perps" style={{ textDecoration: "none" }}>
                <button style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10, border: "none",
                  background: "var(--accent-grad)", color: "#08080a",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                  Open Markets <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/predictions" style={{ textDecoration: "none" }}>
                <button style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10,
                  border: "1px solid var(--border-2)", background: "transparent",
                  color: "var(--text-2)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                  Browse Sports <ExternalLink size={14} />
                </button>
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

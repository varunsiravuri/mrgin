"use client";
import Link from "next/link";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { DotmSquare3 } from "@/components/ui/dotm-square-3";

const SECTIONS = [
  "Overview",
  "Architecture",
  "Programs",
  "Cross-Margin",
  "Order Book",
  "Liquidations",
  "API Reference",
] as const;

type Section = typeof SECTIONS[number];

function CodeBlock({ code, lang = "rust" }: { code: string; lang?: string }) {
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", overflowX: "auto", marginBottom: 16 }}>
      <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>{lang}</div>
      <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "#aaa", lineHeight: 1.7, whiteSpace: "pre" }}>{code}</pre>
    </div>
  );
}

function Tag({ children, color = "#444" }: { children: string; color?: string }) {
  return (
    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "2px 7px", borderRadius: 5, background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f0", margin: "0 0 8px", fontFamily: "var(--font-sans)" }}>{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0", margin: "24px 0 8px", fontFamily: "var(--font-sans)" }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "#666", lineHeight: 1.75, margin: "0 0 14px" }}>{children}</p>;
}

function Divider() {
  return <div style={{ height: 1, background: "#111", margin: "40px 0" }} />;
}

function ProgramCard({ name, id, role, color }: { name: string; id: string; role: string; color: string }) {
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${color}20`, borderRadius: 12, padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color }}>{name}</span>
        <Tag color={color}>{`${id.slice(0, 8)}…`}</Tag>
      </div>
      <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.6 }}>{role}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <header style={{ height: 52, display: "flex", alignItems: "center", padding: "0 28px", borderBottom: "1px solid #111", gap: 12, position: "sticky", top: 0, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(8px)", zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 4, color: "#444", textDecoration: "none" }}>
          <ChevronLeft size={14} />
        </Link>
        <Activity size={13} color="#666" />
        <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 17, color: "#f0f0f0" }}>mrgin</span>
        <span style={{ color: "#222", fontSize: 13 }}>/</span>
        <span style={{ color: "#666", fontSize: 12 }}>Docs</span>
      </header>

      {/* Body — sidebar + content */}
      <div style={{ flex: 1, display: "flex", maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 28px" }}>

        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, paddingTop: 40, paddingRight: 32, position: "sticky", top: 52, height: "calc(100vh - 52px)", overflowY: "auto" }}>
          <div style={{ fontSize: 10, color: "#2a2a2a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, fontFamily: "var(--font-mono)" }}>
            On this page
          </div>
          {SECTIONS.map(s => (
            <a key={s} href={`#${s.toLowerCase().replace(/\s+/g, "-")}`} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 8px", borderRadius: 6, textDecoration: "none",
              color: "#444", fontSize: 13, marginBottom: 2, transition: "color 0.12s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f0f0f0")}
              onMouseLeave={e => (e.currentTarget.style.color = "#444")}
            >
              <ChevronRight size={11} />
              {s}
            </a>
          ))}

          <div style={{ marginTop: 32, padding: 14, background: "#0d0d0d", borderRadius: 10, border: "1px solid #1a1a1a" }}>
            <div style={{ marginBottom: 10 }}>
              <DotmSquare3 size={28} dotSize={3} color="grad-aurora" animated />
            </div>
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
              mrgin is live on Solana <strong style={{ color: "#22c55e" }}>devnet</strong>. Mainnet coming soon.
            </div>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>

          {/* ── Overview ─────────────────────────────────────── */}
          <section id="overview">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <DotmSquare3 size={48} dotSize={5} color="grad-neon" animated hoverAnimated />
              <div>
                <H2>Overview</H2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Tag color="#22c55e">Solana</Tag>
                  <Tag color="#3b82f6">Anchor 0.31</Tag>
                  <Tag color="#f59e0b">Devnet</Tag>
                  <Tag color="#a855f7">Cross-Margin</Tag>
                </div>
              </div>
            </div>
            <P>
              mrgin is a cross-margined derivatives protocol on Solana combining perpetual futures and binary prediction markets in a single shared USDC collateral pool. Three custom Anchor programs — <code style={{ fontFamily: "var(--font-mono)", color: "#a855f7", fontSize: 12 }}>perp_engine</code>, <code style={{ fontFamily: "var(--font-mono)", color: "#22c55e", fontSize: 12 }}>prediction_market</code>, and <code style={{ fontFamily: "var(--font-mono)", color: "#3b82f6", fontSize: 12 }}>cross_margin</code> — work together via CPI chains.
            </P>
            <P>
              The key insight: your prediction market winnings automatically cover perp losses, and vice versa. One <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>PortfolioAccount</code> holds all collateral. Margin locked in one product reduces free collateral available for all others.
            </P>
          </section>

          <Divider />

          {/* ── Architecture ─────────────────────────────────── */}
          <section id="architecture">
            <H2>Architecture</H2>
            <P>The system has four layers: the Solana programs (on-chain), a Redis-backed off-chain matching engine, a Postgres event store, and a Next.js frontend.</P>

            <CodeBlock lang="text" code={`User Wallet
    │
    ▼
cross_margin::deposit()         ← USDC into shared vault
    │
    ├── perp_engine::open_position()
    │       ├── CPI → cross_margin::lock_margin()
    │       ├── Matching engine (Redis off-chain)
    │       └── Funding rate crank (hourly, permissionless)
    │
    └── prediction_market::place_bet()
            └── CPI → cross_margin::lock_margin()
    │
cross_margin::check_health()
    health = equity / locked_notional  (bps)
    liquidation threshold = 500 bps (5%)
    │
cross_margin::cross_liquidate()
    ├── CPI → prediction_market::forfeit_lost_bet()
    └── CPI → perp_engine::liquidate()`} />

            <H3>Off-chain matching engine</H3>
            <P>
              Limit orders live in Redis sorted sets keyed by price. The matching engine runs as a Node.js process, matches resting orders against incoming ones in &lt;100ms, then fires a single on-chain <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>settle_fill()</code> CPI. This gives Binance-level UX with Solana-level settlement finality.
            </P>

            <CodeBlock lang="typescript" code={`// Matching engine hot path (simplified)
const bids = await redis.zrangebyscore("bids:SOL-PERP", limitPrice, "+inf", "LIMIT", 1);
if (bids.length) {
  const fill = { maker: bids[0], taker: order, price: bids[0].price, size: min(bids[0].size, order.size) };
  await program.methods.settleFill(fill).accounts({ market }).rpc();
  await postgres.insert(fills).values(fill);
}`} />
          </section>

          <Divider />

          {/* ── Programs ─────────────────────────────────────── */}
          <section id="programs">
            <H2>Programs</H2>
            <P>Three Anchor programs deployed to Solana devnet. Build order matters — <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>cross_margin</code> first since both others CPI into it.</P>

            <ProgramCard
              name="perp_engine"
              id="FiTnBYBBzxQkfiz63XGcUcPay8Z2E7nE5HXEMLPGjktB"
              color="#a855f7"
              role="AMM-based perpetual futures. Manages markets, positions, order book settlement, hourly funding rate accumulation, and permissionless liquidations."
            />
            <ProgramCard
              name="prediction_market"
              id="ARFaBkMfGFG6SNiomKPa3b2DzUe52jHa9jqPX26VukU7"
              color="#22c55e"
              role="Binary event markets. Creates YES/NO pools, accepts USDC bets, resolves via authority or Pyth oracle, distributes winnings pro-rata."
            />
            <ProgramCard
              name="cross_margin"
              id="2Khz6Ehrexn5Eou1SR72UT1XGyAmv5cmAkqCYT24UDDm"
              color="#3b82f6"
              role="Shared USDC vault and portfolio health engine. The critical program — tracks locked vs. free collateral across all products for a single user."
            />

            <H3>Key instructions</H3>
            <CodeBlock lang="rust" code={`// perp_engine
pub fn initialize_market(ctx, params: MarketParams) -> Result<()>
pub fn open_position(ctx, params: OpenPositionParams) -> Result<()>
pub fn close_position(ctx, params: ClosePositionParams) -> Result<()>
pub fn place_limit_order(ctx, params: LimitOrderParams) -> Result<()>
pub fn settle_fill(ctx, params: FillParams) -> Result<()>
pub fn update_funding(ctx) -> Result<()>
pub fn liquidate(ctx, params: LiquidateParams) -> Result<()>

// prediction_market
pub fn create_market(ctx, params: CreateMarketParams) -> Result<()>
pub fn place_bet(ctx, amount: u64, is_yes: bool) -> Result<()>
pub fn resolve_market(ctx, outcome: bool) -> Result<()>
pub fn claim_winnings(ctx) -> Result<()>

// cross_margin
pub fn create_portfolio(ctx) -> Result<()>
pub fn deposit(ctx, amount: u64) -> Result<()>
pub fn withdraw(ctx, amount: u64) -> Result<()>
pub fn lock_margin(ctx, amount: u64) -> Result<()>
pub fn check_health(ctx) -> Result<HealthReport>`} />
          </section>

          <Divider />

          {/* ── Cross-Margin ─────────────────────────────────── */}
          <section id="cross-margin">
            <H2>Cross-Margin</H2>
            <P>
              The <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>PortfolioAccount</code> PDA holds the full state for a user&apos;s cross-margin position. All products share <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>total_collateral</code>, with each product incrementing <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>locked_collateral</code> when margin is reserved.
            </P>

            <CodeBlock lang="rust" code={`pub struct PortfolioAccount {
    pub owner: Pubkey,
    pub total_collateral: u64,   // total USDC deposited (lamports, 6 dec)
    pub locked_collateral: u64,  // in use by open positions + bets
    pub realized_pnl: i64,       // cumulative settled PnL
    pub positions: [ProductRef; 8],  // perp positions
    pub bets: [ProductRef; 8],       // prediction bets
    pub bump: u8,
}

// free_collateral = total_collateral + unrealized_pnl - locked_collateral
// health_bps = free_collateral * 10_000 / locked_collateral
// liquidation when health_bps < 500`} />

            <H3>Health formula</H3>
            <P>Health is computed as a basis-point ratio. A fully-collateralised position is 10,000 bps (100%). Liquidation fires at 500 bps (5%).</P>
            <CodeBlock lang="rust" code={`pub fn health_bps(portfolio: &PortfolioAccount, unrealized_pnl: i64) -> u64 {
    let equity = (portfolio.total_collateral as i64)
        .checked_add(unrealized_pnl).unwrap_or(0);
    if equity <= 0 || portfolio.locked_collateral == 0 { return 0; }
    ((equity as u128) * 10_000 / portfolio.locked_collateral as u128) as u64
}`} />
          </section>

          <Divider />

          {/* ── Order Book ───────────────────────────────────── */}
          <section id="order-book">
            <H2>Order Book</H2>
            <P>mrgin uses a <strong style={{ color: "#f0f0f0" }}>hybrid CLOB + AMM</strong>. Resting limit orders live off-chain in Redis sorted sets. The AMM fills market orders when no resting limit is available, using a constant-product curve seeded from the oracle price.</P>

            <CodeBlock lang="text" code={`Redis key schema:
  bids:{market_address}   → ZADD price member="{maker}:{size}:{nonce}"
  asks:{market_address}   → ZADD price member="{maker}:{size}:{nonce}"
  mark:{market_address}   → STRING (u64 price, updated every 3s)

Matching loop (runs every 50ms):
  1. Pop best bid / best ask
  2. If bid.price >= ask.price → fill at maker's price
  3. CPI settle_fill() → on-chain PDA update + vault transfer
  4. Write fill event to Postgres (triggers Helius webhook)
  5. Broadcast fill over WebSocket to connected frontends`} />
          </section>

          <Divider />

          {/* ── Liquidations ─────────────────────────────────── */}
          <section id="liquidations">
            <H2>Liquidations</H2>
            <P>
              Liquidations are <strong style={{ color: "#f0f0f0" }}>permissionless</strong> — any wallet can call <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>cross_liquidate()</code> on an underwater account and earn the liquidation fee (currently 50 bps of notional). The waterfall prioritises prediction bets (binary, easier to unwind) before perp positions.
            </P>
            <CodeBlock lang="rust" code={`// Liquidation waterfall
pub fn cross_liquidate(ctx: Context<CrossLiquidate>) -> Result<()> {
    let health = check_health(&portfolio, oracle_price)?;
    require!(health < 500, ErrorCode::NotLiquidatable);

    // Step 1 — forfeit worst prediction bets first
    for bet in portfolio.bets.iter_mut().filter(|b| b.is_active) {
        prediction_market::cpi::forfeit_lost_bet(cpi_ctx, bet.key)?;
        if check_health(&portfolio, oracle_price)? >= 1000 { break; }
    }

    // Step 2 — close largest perp positions
    for pos in portfolio.positions.iter_mut().sorted_by(|a,b| b.notional.cmp(&a.notional)) {
        perp_engine::cpi::liquidate(cpi_ctx, pos.key, liquidator)?;
        if check_health(&portfolio, oracle_price)? >= 1000 { break; }
    }

    // Pay liquidator fee
    transfer_fee(ctx.accounts.liquidator, LIQUIDATION_FEE_BPS)?;
    Ok(())
}`} />
          </section>

          <Divider />

          {/* ── API Reference ────────────────────────────────── */}
          <section id="api-reference">
            <H2>API Reference</H2>
            <P>The off-chain API (Express + Drizzle + Postgres) exposes the following REST endpoints. WebSocket at <code style={{ fontFamily: "var(--font-mono)", color: "#888", fontSize: 12 }}>/stream</code> pushes real-time fills, liquidations, and book updates.</P>

            {[
              { method: "GET", path: "/markets", desc: "All perp markets with mark price, 24h change, funding rate, OI" },
              { method: "GET", path: "/orderbook/:market", desc: "Current bids/asks aggregated by price level" },
              { method: "GET", path: "/trades/:market", desc: "Recent fills and position events for a market" },
              { method: "GET", path: "/portfolio/:wallet", desc: "Positions, bets, PnL summary for a wallet" },
              { method: "GET", path: "/portfolio/:wallet/pnl", desc: "Historical PnL time-series" },
              { method: "GET", path: "/prediction-markets", desc: "All binary markets with pool sizes and status" },
              { method: "POST", path: "/prediction-markets/:id/bet", desc: "Place a YES/NO bet (demo endpoint — real bets go on-chain)" },
            ].map(({ method, path, desc }) => (
              <div key={path} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #0f0f0f" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: method === "GET" ? "#22c55e" : "#3b82f6", background: method === "GET" ? "rgba(34,197,94,0.08)" : "rgba(59,130,246,0.08)", padding: "2px 6px", borderRadius: 4, flexShrink: 0, marginTop: 2 }}>
                  {method}
                </span>
                <div>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#e0e0e0" }}>{path}</code>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}

            <H3>WebSocket channels</H3>
            <CodeBlock lang="typescript" code={`// Connect to ws://localhost:3001/stream
// Messages arrive as JSON:
{ "channel": "fills",       "data": { price, size, isLong, market, timestamp } }
{ "channel": "book-update", "data": { market, bids: [...], asks: [...] } }
{ "channel": "liquidations","data": { wallet, notional, liquidator, fee } }`} />
          </section>

        </main>
      </div>
    </div>
  );
}

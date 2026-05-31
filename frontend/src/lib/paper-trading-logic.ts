export interface PaperPosition {
  id: string;
  market: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  collateral: number;
  leverage: number;
  notional: number;
  openedAt: number;
}

export interface PaperBet {
  id: string;
  marketId: string;
  question: string;
  sport: string;
  emoji: string;
  side: "yes" | "no";
  amount: number;
  odds: number;
  potentialWin: number;
  placedAt: number;
  status: "active" | "won" | "lost";
}

export interface PaperHistoryEntry {
  id: string;
  type: "open" | "close" | "bet" | "reset";
  label: string;
  amount: number;
  pnl?: number;
  ts: number;
}

/** A fully realized perp trade — the durable record shown in trade history. */
export interface ClosedTrade {
  id: string;
  market: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  exitPrice: number;
  collateral: number;
  leverage: number;
  notional: number;
  pnl: number;
  roe: number; // return on equity, %
  openedAt: number;
  closedAt: number;
}

export interface PaperState {
  freeBalance: number;
  lockedCollateral: number;
  positions: PaperPosition[];
  bets: PaperBet[];
  history: PaperHistoryEntry[];
  closedTrades: ClosedTrade[];
}

export type PaperAction =
  | { type: "OPEN_POSITION"; position: PaperPosition }
  | { type: "CLOSE_POSITION"; id: string; exitPrice: number }
  | { type: "PLACE_BET"; bet: PaperBet }
  | { type: "RESOLVE_BET"; id: string; outcome: "yes" | "no" }
  | { type: "HYDRATE"; state: PaperState }
  | { type: "RESET" };

export const STARTING_BALANCE = 5000;

export function initialPaperState(): PaperState {
  return {
    freeBalance: STARTING_BALANCE,
    lockedCollateral: 0,
    positions: [],
    bets: [],
    closedTrades: [],
    history: [{
      id: "init",
      type: "open",
      label: "Demo account funded",
      amount: STARTING_BALANCE,
      ts: Date.now(),
    }],
  };
}

/** Normalize a possibly-partial state (e.g. loaded from storage before closedTrades existed). */
export function normalizePaperState(s: Partial<PaperState> | null | undefined): PaperState {
  const base = initialPaperState();
  if (!s) return base;
  return {
    freeBalance: typeof s.freeBalance === "number" ? s.freeBalance : base.freeBalance,
    lockedCollateral: typeof s.lockedCollateral === "number" ? s.lockedCollateral : 0,
    positions: Array.isArray(s.positions) ? s.positions : [],
    bets: Array.isArray(s.bets) ? s.bets : [],
    closedTrades: Array.isArray(s.closedTrades) ? s.closedTrades : [],
    history: Array.isArray(s.history) && s.history.length ? s.history : base.history,
  };
}

export function paperTradingReducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case "OPEN_POSITION": {
      const p = action.position;
      return {
        ...state,
        freeBalance: state.freeBalance - p.collateral,
        lockedCollateral: state.lockedCollateral + p.collateral,
        positions: [...state.positions, p],
        history: [{
          id: p.id + "-open",
          type: "open" as const,
          label: `Opened ${p.side.toUpperCase()} ${p.symbol}`,
          amount: p.collateral,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "CLOSE_POSITION": {
      const pos = state.positions.find(p => p.id === action.id);
      if (!pos) return state;
      const pnl = pos.side === "long"
        ? (action.exitPrice - pos.entryPrice) / pos.entryPrice * pos.notional
        : (pos.entryPrice - action.exitPrice) / pos.entryPrice * pos.notional;
      const returned = pos.collateral + pnl;
      const closedTrade: ClosedTrade = {
        id: pos.id,
        market: pos.market,
        symbol: pos.symbol,
        side: pos.side,
        size: pos.size,
        entryPrice: pos.entryPrice,
        exitPrice: action.exitPrice,
        collateral: pos.collateral,
        leverage: pos.leverage,
        notional: pos.notional,
        pnl,
        roe: pos.collateral > 0 ? (pnl / pos.collateral) * 100 : 0,
        openedAt: pos.openedAt,
        closedAt: Date.now(),
      };
      return {
        ...state,
        freeBalance: state.freeBalance + Math.max(0, returned),
        lockedCollateral: state.lockedCollateral - pos.collateral,
        positions: state.positions.filter(p => p.id !== action.id),
        closedTrades: [closedTrade, ...state.closedTrades].slice(0, 500),
        history: [{
          id: pos.id + "-close",
          type: "close" as const,
          label: `Closed ${pos.side.toUpperCase()} ${pos.symbol}`,
          amount: Math.abs(pnl),
          pnl,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "PLACE_BET": {
      const b = action.bet;
      if (b.amount > state.freeBalance) return state;
      return {
        ...state,
        freeBalance: state.freeBalance - b.amount,
        lockedCollateral: state.lockedCollateral + b.amount,
        bets: [...state.bets, b],
        history: [{
          id: b.id + "-bet",
          type: "bet" as const,
          label: `${b.side.toUpperCase()} bet · ${b.question.slice(0, 40)}`,
          amount: b.amount,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "RESOLVE_BET": {
      const bet = state.bets.find(b => b.id === action.id);
      if (!bet || bet.status !== "active") return state;
      const won = bet.side === action.outcome;
      const payout = won ? bet.potentialWin : 0;
      return {
        ...state,
        freeBalance: state.freeBalance + payout,
        lockedCollateral: state.lockedCollateral - bet.amount,
        bets: state.bets.map(b =>
          b.id === action.id ? { ...b, status: won ? "won" : "lost" } : b
        ),
      };
    }
    case "HYDRATE":
      return normalizePaperState(action.state);
    case "RESET":
      return initialPaperState();
    default:
      return state;
  }
}

export function paperEquity(state: PaperState): number {
  return state.freeBalance + state.lockedCollateral;
}

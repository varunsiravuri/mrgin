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

export interface PaperState {
  freeBalance: number;
  lockedCollateral: number;
  positions: PaperPosition[];
  bets: PaperBet[];
  history: PaperHistoryEntry[];
}

export type PaperAction =
  | { type: "OPEN_POSITION"; position: PaperPosition }
  | { type: "CLOSE_POSITION"; id: string; exitPrice: number }
  | { type: "PLACE_BET"; bet: PaperBet }
  | { type: "RESOLVE_BET"; id: string; outcome: "yes" | "no" }
  | { type: "RESET" };

export const STARTING_BALANCE = 5000;

export function initialPaperState(): PaperState {
  return {
    freeBalance: STARTING_BALANCE,
    lockedCollateral: 0,
    positions: [],
    bets: [],
    history: [{
      id: "init",
      type: "open",
      label: "Paper account funded",
      amount: STARTING_BALANCE,
      ts: Date.now(),
    }],
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
      return {
        ...state,
        freeBalance: state.freeBalance + Math.max(0, returned),
        lockedCollateral: state.lockedCollateral - pos.collateral,
        positions: state.positions.filter(p => p.id !== action.id),
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
    case "RESET":
      return initialPaperState();
    default:
      return state;
  }
}

export function paperEquity(state: PaperState): number {
  return state.freeBalance + state.lockedCollateral;
}

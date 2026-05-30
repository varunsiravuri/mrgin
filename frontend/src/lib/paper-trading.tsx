"use client";
import { createContext, useContext, useEffect, useReducer, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PaperPosition {
  id: string;
  market: string;
  symbol: string;
  side: "long" | "short";
  size: number;        // token units (e.g. SOL)
  entryPrice: number;  // USD
  collateral: number;  // USDC locked
  leverage: number;
  notional: number;    // size * entryPrice
  openedAt: number;
}

export interface PaperBet {
  id: string;
  marketId: string;
  question: string;
  sport: string;
  emoji: string;
  side: "yes" | "no";
  amount: number;       // USDC risked
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

interface PaperState {
  freeBalance: number;
  lockedCollateral: number;
  positions: PaperPosition[];
  bets: PaperBet[];
  history: PaperHistoryEntry[];
}

type Action =
  | { type: "OPEN_POSITION"; position: PaperPosition }
  | { type: "CLOSE_POSITION"; id: string; exitPrice: number }
  | { type: "PLACE_BET"; bet: PaperBet }
  | { type: "RESOLVE_BET"; id: string; outcome: "yes" | "no" }
  | { type: "RESET" };

// ── Initial state ─────────────────────────────────────────────────────────────

const STARTING_BALANCE = 5000;

function initialState(): PaperState {
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

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: PaperState, action: Action): PaperState {
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
          label: `Opened ${p.side.toUpperCase()} ${p.symbol} @ $${p.entryPrice.toFixed(2)} · ${p.leverage}×`,
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
          label: `Closed ${pos.side.toUpperCase()} ${pos.symbol} @ $${action.exitPrice.toFixed(2)}`,
          amount: Math.abs(pnl),
          pnl,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "PLACE_BET": {
      const b = action.bet;
      return {
        ...state,
        freeBalance: state.freeBalance - b.amount,
        lockedCollateral: state.lockedCollateral + b.amount,
        bets: [...state.bets, b],
        history: [{
          id: b.id + "-bet",
          type: "bet" as const,
          label: `${b.emoji} ${b.side.toUpperCase()} · ${b.question.slice(0, 40)}…`,
          amount: b.amount,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "RESOLVE_BET": {
      const bet = state.bets.find(b => b.id === action.id);
      if (!bet) return state;
      const won = bet.side === action.outcome;
      const returned = won ? bet.potentialWin : 0;
      const pnl = won ? bet.potentialWin - bet.amount : -bet.amount;
      return {
        ...state,
        freeBalance: state.freeBalance + returned,
        lockedCollateral: state.lockedCollateral - bet.amount,
        bets: state.bets.map(b => b.id === action.id ? { ...b, status: won ? "won" : "lost" } : b),
        history: [{
          id: bet.id + "-resolve",
          type: "bet" as const,
          label: `${won ? "✓ Won" : "✗ Lost"} · ${bet.emoji} ${bet.side.toUpperCase()}`,
          amount: Math.abs(pnl),
          pnl,
          ts: Date.now(),
        }, ...state.history].slice(0, 100),
      };
    }
    case "RESET":
      return initialState();
    default:
      return state;
  }
}

// ── LocalStorage persistence ──────────────────────────────────────────────────

const LS_KEY = "mrgin:paper";

function load(): PaperState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return initialState();
}

function save(s: PaperState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface PaperCtx {
  state: PaperState;
  openPosition: (params: {
    market: string; symbol: string; side: "long" | "short";
    size: number; price: number; collateral: number; leverage: number;
  }) => boolean;
  closePosition: (id: string, exitPrice: number) => void;
  placeBet: (params: {
    marketId: string; question: string; sport: string; emoji: string;
    side: "yes" | "no"; amount: number; odds: number;
  }) => boolean;
  resolveBet: (id: string, outcome: "yes" | "no") => void;
  reset: () => void;
  equity: (markPrices: Record<string, number>) => number;
  unrealizedPnL: (markPrices: Record<string, number>) => number;
}

const Ctx = createContext<PaperCtx | null>(null);

export function PaperTradingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => { save(state); }, [state]);

  const openPosition = useCallback((params: {
    market: string; symbol: string; side: "long" | "short";
    size: number; price: number; collateral: number; leverage: number;
  }): boolean => {
    if (params.collateral > state.freeBalance) return false;
    if (params.size <= 0 || params.collateral <= 0) return false;
    dispatch({
      type: "OPEN_POSITION",
      position: {
        id: crypto.randomUUID(),
        market: params.market,
        symbol: params.symbol,
        side: params.side,
        size: params.size,
        entryPrice: params.price,
        collateral: params.collateral,
        leverage: params.leverage,
        notional: params.size * params.price,
        openedAt: Date.now(),
      },
    });
    return true;
  }, [state.freeBalance]);

  const closePosition = useCallback((id: string, exitPrice: number) => {
    dispatch({ type: "CLOSE_POSITION", id, exitPrice });
  }, []);

  const placeBet = useCallback((params: {
    marketId: string; question: string; sport: string; emoji: string;
    side: "yes" | "no"; amount: number; odds: number;
  }): boolean => {
    if (params.amount > state.freeBalance) return false;
    if (params.amount <= 0) return false;
    dispatch({
      type: "PLACE_BET",
      bet: {
        id: crypto.randomUUID(),
        marketId: params.marketId,
        question: params.question,
        sport: params.sport,
        emoji: params.emoji,
        side: params.side,
        amount: params.amount,
        odds: params.odds,
        potentialWin: params.amount * params.odds,
        placedAt: Date.now(),
        status: "active",
      },
    });
    return true;
  }, [state.freeBalance]);

  const resolveBet = useCallback((id: string, outcome: "yes" | "no") => {
    dispatch({ type: "RESOLVE_BET", id, outcome });
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const unrealizedPnL = useCallback((markPrices: Record<string, number>): number => {
    return state.positions.reduce((acc, p) => {
      const mark = markPrices[p.market] ?? p.entryPrice;
      const pnl = p.side === "long"
        ? (mark - p.entryPrice) / p.entryPrice * p.notional
        : (p.entryPrice - mark) / p.entryPrice * p.notional;
      return acc + pnl;
    }, 0);
  }, [state.positions]);

  const equity = useCallback((markPrices: Record<string, number>): number => {
    return state.freeBalance + state.lockedCollateral + unrealizedPnL(markPrices);
  }, [state.freeBalance, state.lockedCollateral, unrealizedPnL]);

  return (
    <Ctx.Provider value={{ state, openPosition, closePosition, placeBet, resolveBet, reset, equity, unrealizedPnL }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePaperTrading() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePaperTrading must be inside PaperTradingProvider");
  return ctx;
}

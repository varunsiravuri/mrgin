"use client";
import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import {
  type PaperPosition,
  type PaperBet,
  type PaperHistoryEntry,
  type PaperState,
  type PaperAction,
  STARTING_BALANCE,
  initialPaperState,
  paperTradingReducer,
  paperEquity,
} from "./paper-trading-logic";

export type { PaperPosition, PaperBet, PaperHistoryEntry };

function reducer(state: PaperState, action: PaperAction): PaperState {
  switch (action.type) {
    case "OPEN_POSITION": {
      const next = paperTradingReducer(state, action);
      const p = action.position;
      return {
        ...next,
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
      const next = paperTradingReducer(state, action);
      return {
        ...next,
        history: [{
          id: pos.id + "-close",
          type: "close" as const,
          label: `Closed ${pos.side.toUpperCase()} ${pos.symbol} @ $${action.exitPrice.toFixed(2)}`,
          amount: Math.abs((next.history[0]?.pnl) ?? 0),
          pnl: next.history[0]?.pnl,
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
      return initialPaperState();
    default:
      return state;
  }
}

// ── LocalStorage persistence ──────────────────────────────────────────────────

const LS_KEY = "mrgin:paper";

function load(): PaperState {
  if (typeof window === "undefined") return initialPaperState();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return initialPaperState();
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

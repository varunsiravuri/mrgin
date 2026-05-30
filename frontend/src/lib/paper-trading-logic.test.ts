import { describe, it, expect } from "vitest";
import {
  initialPaperState,
  paperTradingReducer,
  paperEquity,
  STARTING_BALANCE,
  type PaperBet,
  type PaperPosition,
} from "./paper-trading-logic";

describe("paper trading logic", () => {
  it("starts with $5000 free balance", () => {
    const state = initialPaperState();
    expect(state.freeBalance).toBe(STARTING_BALANCE);
    expect(state.lockedCollateral).toBe(0);
    expect(paperEquity(state)).toBe(STARTING_BALANCE);
  });

  it("opens a position and locks collateral", () => {
    const position: PaperPosition = {
      id: "p1",
      market: "SOL-PERP",
      symbol: "SOL",
      side: "long",
      size: 10,
      entryPrice: 100,
      collateral: 500,
      leverage: 2,
      notional: 1000,
      openedAt: Date.now(),
    };
    const next = paperTradingReducer(initialPaperState(), {
      type: "OPEN_POSITION",
      position,
    });
    expect(next.freeBalance).toBe(4500);
    expect(next.lockedCollateral).toBe(500);
    expect(next.positions).toHaveLength(1);
  });

  it("rejects bets larger than free balance", () => {
    const bet: PaperBet = {
      id: "b1",
      marketId: "ipl-final",
      question: "RCB vs GT",
      sport: "IPL",
      emoji: "🏏",
      side: "yes",
      amount: 6000,
      odds: 1.9,
      potentialWin: 11400,
      placedAt: Date.now(),
      status: "active",
    };
    const next = paperTradingReducer(initialPaperState(), {
      type: "PLACE_BET",
      bet,
    });
    expect(next.bets).toHaveLength(0);
    expect(next.freeBalance).toBe(STARTING_BALANCE);
  });

  it("places a bet and locks stake", () => {
    const bet: PaperBet = {
      id: "b1",
      marketId: "ipl-final",
      question: "RCB vs GT",
      sport: "IPL",
      emoji: "🏏",
      side: "yes",
      amount: 100,
      odds: 1.9,
      potentialWin: 190,
      placedAt: Date.now(),
      status: "active",
    };
    const next = paperTradingReducer(initialPaperState(), {
      type: "PLACE_BET",
      bet,
    });
    expect(next.freeBalance).toBe(4900);
    expect(next.lockedCollateral).toBe(100);
    expect(next.bets).toHaveLength(1);
  });

  it("resolves a winning bet", () => {
    const bet: PaperBet = {
      id: "b1",
      marketId: "ipl-final",
      question: "RCB vs GT",
      sport: "IPL",
      emoji: "🏏",
      side: "yes",
      amount: 100,
      odds: 1.9,
      potentialWin: 190,
      placedAt: Date.now(),
      status: "active",
    };
    let state = paperTradingReducer(initialPaperState(), { type: "PLACE_BET", bet });
    state = paperTradingReducer(state, {
      type: "RESOLVE_BET",
      id: "b1",
      outcome: "yes",
    });
    expect(state.freeBalance).toBe(5090);
    expect(state.lockedCollateral).toBe(0);
    expect(state.bets[0]?.status).toBe("won");
  });
});

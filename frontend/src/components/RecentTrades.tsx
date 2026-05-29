"use client";
import useSWR from "swr";
import { fetchTrades } from "@/lib/api";

interface Trade {
  id: number;
  fillPrice?: number;
  entryPrice?: number;
  exitPrice?: number;
  size: number;
  isLong?: boolean;
  eventType: string;
  timestamp: string;
}

export function RecentTrades({ market }: { market: string }) {
  const { data: trades = [] } = useSWR<Trade[]>(
    market ? `trades:${market}` : null,
    () => fetchTrades(market),
    { refreshInterval: 2000 }
  );

  const getPrice = (t: Trade) => t.fillPrice ?? t.exitPrice ?? t.entryPrice ?? 0;

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-[#111] shrink-0">
        <span className="text-xs font-semibold">Recent Trades</span>
      </div>
      <div className="flex justify-between px-3 py-1 shrink-0">
        <span className="text-[9px] text-[#333] uppercase tracking-widest">Price</span>
        <span className="text-[9px] text-[#333] uppercase tracking-widest">Size</span>
        <span className="text-[9px] text-[#333] uppercase tracking-widest">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-[#2a2a2a]">No trades yet</span>
          </div>
        ) : (
          trades.slice(0, 40).map((t) => {
            const p = getPrice(t);
            const isBuy = t.isLong === true || t.eventType === "opened";
            return (
              <div key={t.id} className="flex justify-between items-center px-3 py-[3px] hover:bg-[#111] cursor-default">
                <span className="text-xs w-20" style={{ fontFamily: "var(--font-mono)", color: isBuy ? "#22c55e" : "#ef4444" }}>
                  {p > 0 ? p.toFixed(2) : "—"}
                </span>
                <span className="text-xs text-[#666]" style={{ fontFamily: "var(--font-mono)" }}>
                  {(t.size / 1e6).toFixed(4)}
                </span>
                <span className="text-[10px] text-[#444]" style={{ fontFamily: "var(--font-mono)" }}>
                  {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

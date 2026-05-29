"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import useSWR from "swr";
import { fetchTrades } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Trade {
  id: number;
  market: string;
  owner?: string;
  maker?: string;
  taker?: string;
  entryPrice?: number;
  exitPrice?: number;
  fillPrice?: number;
  size: number;
  isLong?: boolean;
  realizedPnl?: number;
  eventType: string;
  timestamp: string;
}

export function Positions({ market }: { market: string }) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const { data: trades = [] } = useSWR<Trade[]>(
    market ? `trades:${market}` : null,
    () => fetchTrades(market),
    { refreshInterval: 3000 }
  );

  const myTrades = wallet
    ? trades.filter((t) => t.owner === wallet || t.maker === wallet || t.taker === wallet)
    : [];

  const cols = ["Type", "Size", "Entry Price", "Mark Price", "PnL", "Time", "Status"];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#111] shrink-0">
        <span className="text-xs font-semibold">Positions</span>
        <span className="text-[10px] text-[#444]">
          {wallet ? `${myTrades.length} trade${myTrades.length !== 1 ? "s" : ""}` : "—"}
        </span>
      </div>

      {!wallet ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[#2a2a2a]">Connect wallet to see positions</p>
        </div>
      ) : myTrades.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-[#2a2a2a]">No positions yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#111]">
                {cols.map((c) => (
                  <th key={c} className="text-left px-4 py-2 text-[9px] text-[#333] uppercase tracking-widest font-normal">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTrades.map((t) => {
                const pnl = t.realizedPnl ? t.realizedPnl / 1e6 : 0;
                const entry = (t.entryPrice ?? t.fillPrice ?? 0);
                return (
                  <tr key={t.id} className="border-b border-[#0d0d0d] hover:bg-[#0d0d0d] transition-colors">
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                        t.isLong ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                      )}>
                        {t.isLong ? "Long" : "Short"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#aaa]" style={{ fontFamily: "var(--font-mono)" }}>
                      {(t.size / 1e6).toFixed(4)}
                    </td>
                    <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-mono)" }}>
                      ${entry > 0 ? entry.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#555]" style={{ fontFamily: "var(--font-mono)" }}>—</td>
                    <td className="px-4 py-2.5" style={{ fontFamily: "var(--font-mono)", color: pnl >= 0 ? "#22c55e" : "#ef4444" }}>
                      {pnl !== 0 ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#444]" style={{ fontFamily: "var(--font-mono)" }}>
                      {new Date(t.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px]",
                        t.eventType === "opened" ? "bg-[#1a1a1a] text-[#555]" : "bg-[#111] text-[#444]"
                      )}>
                        {t.eventType}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

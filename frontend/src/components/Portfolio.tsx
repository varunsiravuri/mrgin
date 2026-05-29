"use client";
import useSWR from "swr";
import { fetchPortfolio } from "@/lib/api";
import { useWallet } from "@solana/wallet-adapter-react";
import { TrendingUp, TrendingDown, Shield, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function Portfolio() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();

  const { data: portfolio } = useSWR(
    wallet ? `portfolio:${wallet}` : null,
    () => fetchPortfolio(wallet!),
    { refreshInterval: 5000 }
  );

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Shield size={32} className="text-[#222]" />
        <p className="text-sm text-[#333]">Connect wallet to view portfolio</p>
      </div>
    );
  }

  const total = (portfolio?.totalCollateral ?? 0) / 1e6;
  const locked = (portfolio?.lockedCollateral ?? 0) / 1e6;
  const free = total - locked;
  const healthBps = portfolio?.healthBps ?? 10000;
  const healthPct = healthBps / 100;
  const healthColor =
    healthBps < 500 ? "#ef4444" : healthBps < 1000 ? "#eab308" : "#22c55e";

  const stats = [
    { label: "Total Equity", value: `$${total.toFixed(2)}`, icon: DollarSign, color: "#f0f0f0" },
    { label: "Free Margin", value: `$${free.toFixed(2)}`, icon: TrendingUp, color: "#22c55e" },
    { label: "Locked Margin", value: `$${locked.toFixed(2)}`, icon: TrendingDown, color: "#aaa" },
    { label: "Portfolio Health", value: `${healthPct.toFixed(1)}%`, icon: Shield, color: healthColor },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color }} />
              <span className="text-[10px] text-[#444] uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-xl font-semibold" style={{ fontFamily: "var(--font-mono)", color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Health bar */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-[#444] uppercase tracking-widest">Margin Health</span>
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: healthColor }}>
            {healthPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(healthPct, 100)}%`,
              background: healthColor,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#333]">Liquidation (5%)</span>
          <span className="text-[9px] text-[#333]">100%</span>
        </div>
      </div>

      {/* No positions message */}
      {!portfolio && (
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-8 text-center">
          <p className="text-sm text-[#333]">No open positions</p>
          <p className="text-xs text-[#222] mt-1">Place a trade to get started</p>
        </div>
      )}
    </div>
  );
}

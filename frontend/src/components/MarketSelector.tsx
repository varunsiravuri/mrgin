"use client";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Market {
  address: string;
  markPrice: number | null;
  symbol?: string;
}

interface MarketSelectorProps {
  markets: Market[];
  selected: string | null;
  onSelect: (address: string) => void;
}

export function MarketSelector({ markets, selected, onSelect }: MarketSelectorProps) {
  const [open, setOpen] = useState(false);
  const current = markets.find((m) => m.address === selected);
  const label = current?.symbol ?? "SOL-PERP";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111] border border-[#1e1e1e] hover:border-[#333] transition-colors text-sm font-semibold"
      >
        <span className="w-2 h-2 rounded-full bg-white/80" />
        {label}
        <span className="text-[#555] text-xs font-normal" style={{ fontFamily: "var(--font-mono)" }}>
          {current?.markPrice ? `$${current.markPrice.toFixed(2)}` : "—"}
        </span>
        <ChevronDown size={12} className="text-[#555]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-[#111] border border-[#1e1e1e] rounded-lg py-1 min-w-48 shadow-2xl">
            {markets.map((m) => (
              <button
                key={m.address}
                onClick={() => { onSelect(m.address); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#1a1a1a] transition-colors",
                  m.address === selected && "bg-[#1a1a1a]"
                )}
              >
                <span className="font-medium">{m.symbol ?? "SOL-PERP"}</span>
                <span className="text-[#aaa]" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {m.markPrice ? `$${m.markPrice.toFixed(2)}` : "—"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

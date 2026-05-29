"use client";
import { cn } from "@/lib/utils";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Interval = typeof INTERVALS[number];

interface IntervalSelectorProps {
  value: Interval;
  onChange: (v: Interval) => void;
}

export function IntervalSelector({ value, onChange }: IntervalSelectorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {INTERVALS.map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={cn(
            "px-2 py-1 rounded text-xs transition-all",
            i === value
              ? "bg-white text-black font-semibold"
              : "text-[#555] hover:text-[#aaa] hover:bg-[#1a1a1a]"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

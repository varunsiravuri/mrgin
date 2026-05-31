"use client";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  markPrice: number;
  change24h?: number;
  volume24h?: number;
  openInterest?: number;
  fundingRate?: number;
}

export function Header({ markPrice, change24h = 0, volume24h = 0, openInterest = 0, fundingRate = 0 }: HeaderProps) {
  const changePositive = change24h >= 0;

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b border-[#1a1a1a] bg-[#0a0a0a] shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-6">
        <Link href="/" aria-label="mrgin home" className="flex items-center">
          <Logo size={18} wordSize={18} />
        </Link>

        {/* Market stats strip */}
        {markPrice > 0 && (
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col">
              <span className="text-[#555] uppercase tracking-wider" style={{ fontSize: 9 }}>Mark</span>
              <span
                className="font-medium leading-tight"
                style={{ fontFamily: "var(--font-mono)", color: changePositive ? "#22c55e" : "#ef4444" }}
              >
                ${markPrice.toFixed(2)}
              </span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[#555] uppercase tracking-wider" style={{ fontSize: 9 }}>24h Change</span>
              <span
                className="font-medium leading-tight"
                style={{ fontFamily: "var(--font-mono)", color: changePositive ? "#22c55e" : "#ef4444" }}
              >
                {changePositive ? "+" : ""}{change24h.toFixed(2)}%
              </span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[#555] uppercase tracking-wider" style={{ fontSize: 9 }}>Volume 24h</span>
              <span className="text-[#aaa] font-medium leading-tight" style={{ fontFamily: "var(--font-mono)" }}>
                ${volume24h > 1e6 ? (volume24h / 1e6).toFixed(2) + "M" : volume24h.toLocaleString()}
              </span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[#555] uppercase tracking-wider" style={{ fontSize: 9 }}>Open Interest</span>
              <span className="text-[#aaa] font-medium leading-tight" style={{ fontFamily: "var(--font-mono)" }}>
                ${openInterest > 1e6 ? (openInterest / 1e6).toFixed(2) + "M" : openInterest.toLocaleString()}
              </span>
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[#555] uppercase tracking-wider" style={{ fontSize: 9 }}>Funding</span>
              <span
                className="font-medium leading-tight"
                style={{ fontFamily: "var(--font-mono)", color: fundingRate >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {fundingRate >= 0 ? "+" : ""}{(fundingRate * 100).toFixed(4)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right: network + wallet */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#111] border border-[#1a1a1a]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[#555] text-xs">devnet</span>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}

"use client";
import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

type Side = "long" | "short";
type Mode = "limit" | "market";

const LEVERAGES = [2, 5, 10, 20];

export function TradeForm({ market, markPrice }: { market: string; markPrice: number }) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [side, setSide] = useState<Side>("long");
  const [mode, setMode] = useState<Mode>("limit");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState(markPrice > 0 ? markPrice.toFixed(2) : "");
  const [collateral, setCollateral] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [loading, setLoading] = useState(false);

  const notional = Number(size) * (Number(price) || markPrice);
  const impliedCollateral = leverage > 0 ? (notional / leverage).toFixed(2) : "";
  const displayLeverage =
    size && collateral
      ? (notional / Number(collateral)).toFixed(1)
      : leverage.toFixed(1);

  const handleLeverageClick = (lev: number) => {
    setLeverage(lev);
    if (size && (Number(price) || markPrice)) {
      setCollateral(((Number(size) * (Number(price) || markPrice)) / lev).toFixed(2));
    }
  };

  const submit = async () => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      toast.error("Connect wallet first");
      return;
    }
    if (!size || (!collateral && !impliedCollateral)) {
      toast.error("Enter size and collateral");
      return;
    }

    setLoading(true);
    const tid = toast.loading(mode === "limit" ? "Placing limit order…" : "Opening position…");
    try {
      const anchorWallet = { publicKey, signTransaction, signAllTransactions } as any;
      const provider = new AnchorProvider(connection, anchorWallet, {});
      const idl = await fetch("/perp_engine.json").then((r) => r.json());
      const program = new Program(idl, provider) as any;
      const marketPubkey = new PublicKey(market);
      const col = Number(collateral || impliedCollateral);

      if (mode === "limit") {
        await program.methods.placeLimitOrder({
          size: new BN(Math.round(Number(size) * 1e6)),
          collateral: new BN(Math.round(col * 1e6)),
          limitPrice: new BN(Math.round(Number(price) * 1e6)),
          isLong: side === "long",
        }).accounts({ market: marketPubkey }).rpc();
        toast.success("Limit order placed!", { id: tid });
      } else {
        await program.methods.openPosition({
          size: new BN(Math.round(Number(size) * 1e6)),
          collateral: new BN(Math.round(col * 1e6)),
          isLong: side === "long",
          maxSlippageBps: 100,
        }).accounts({ market: marketPubkey }).rpc();
        toast.success(`${side === "long" ? "Long" : "Short"} opened!`, { id: tid });
      }

      setSize(""); setCollateral("");
    } catch (e: any) {
      toast.error(e.message?.slice(0, 80) ?? "Transaction failed", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #111", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#f0f0f0" }}>Place Order</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Side toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[#1a1a1a] p-0.5 gap-0.5 bg-[#0d0d0d]">
          {(["long", "short"] as Side[]).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-md transition-all",
                side === s
                  ? s === "long"
                    ? "bg-[#22c55e] text-black"
                    : "bg-[#ef4444] text-white"
                  : "text-[#444] hover:text-[#888]"
              )}
            >
              {s === "long" ? "↑ Long" : "↓ Short"}
            </button>
          ))}
        </div>

        {/* Limit / Market */}
        <div className="flex gap-1">
          {(["limit", "market"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1 text-xs rounded transition-all",
                mode === m ? "bg-[#1e1e1e] text-white font-semibold" : "text-[#444] hover:text-[#888]"
              )}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          {mode === "limit" && (
            <div>
              <label className="block text-[10px] text-[#444] uppercase tracking-widest mb-1">Limit Price (USD)</label>
              <input
                type="number"
                placeholder={markPrice > 0 ? markPrice.toFixed(2) : "0.00"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#333] transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-[#444] uppercase tracking-widest mb-1">Size</label>
            <input
              type="number"
              placeholder="0.000"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#333] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#444] uppercase tracking-widest mb-1">Collateral (USDC)</label>
            <input
              type="number"
              placeholder={impliedCollateral || "0.00"}
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#333] focus:outline-none focus:border-[#333] transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
        </div>

        {/* Leverage presets */}
        <div>
          <label className="block text-[10px] text-[#444] uppercase tracking-widest mb-2">Leverage</label>
          <div className="flex gap-1">
            {LEVERAGES.map((lev) => (
              <button
                key={lev}
                onClick={() => handleLeverageClick(lev)}
                className={cn(
                  "flex-1 py-1.5 text-xs rounded transition-all border",
                  leverage === lev
                    ? "border-white/30 bg-[#1e1e1e] text-white font-semibold"
                    : "border-[#1a1a1a] text-[#444] hover:text-[#888] hover:border-[#333]"
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] p-3 space-y-2">
          {[
            ["Leverage", `${displayLeverage}x`],
            ["Notional", notional > 0 ? `$${notional.toFixed(2)}` : "—"],
            ["Required Margin", collateral ? `$${Number(collateral).toFixed(2)}` : impliedCollateral ? `$${impliedCollateral}` : "—"],
            ["Entry Price", mode === "market" ? "Market" : price ? `$${Number(price).toFixed(2)}` : "—"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[11px] text-[#444]">{label}</span>
              <span className="text-[11px] text-[#aaa]" style={{ fontFamily: "var(--font-mono)" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading || !publicKey || !size}
          className={cn(
            "w-full py-3 rounded-lg font-semibold text-sm transition-all",
            side === "long"
              ? "bg-[#22c55e] hover:bg-[#16a34a] text-black disabled:opacity-40"
              : "bg-[#ef4444] hover:bg-[#dc2626] text-white disabled:opacity-40",
            "disabled:cursor-not-allowed"
          )}
        >
          {loading
            ? "Confirming…"
            : `${mode === "limit" ? "Place Limit" : "Market"} ${side === "long" ? "Long" : "Short"}`}
        </button>

        {!publicKey && (
          <p style={{ textAlign: "center", fontSize: 11, color: "#2a2a2a" }}>Connect wallet to trade</p>
        )}
      </div>
    </div>
  );
}

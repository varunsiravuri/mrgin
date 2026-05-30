"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { usePaperTrading } from "@/lib/paper-trading";

type Side = "long" | "short";
type Mode = "limit" | "market";

const LEVERAGES = [2, 5, 10, 20];

export function TradeForm({ market, markPrice }: { market: string; markPrice: number }) {
  const { state, openPosition } = usePaperTrading();

  const [side, setSide] = useState<Side>("long");
  const [mode, setMode] = useState<Mode>("market");
  const [sizeStr, setSizeStr] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [collateralStr, setCollateralStr] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [loading, setLoading] = useState(false);

  const effectivePrice = mode === "market" ? markPrice : (Number(priceStr) || markPrice);
  const size = Number(sizeStr) || 0;
  const collateral = Number(collateralStr) || 0;

  const notional = size * effectivePrice;
  const impliedCollateral = notional > 0 ? (notional / leverage).toFixed(2) : "";
  const impliedLeverage = size && collateral && effectivePrice
    ? (notional / collateral).toFixed(1)
    : leverage.toFixed(1);

  const liqPrice = (() => {
    if (!size || !effectivePrice) return null;
    const col = collateral || Number(impliedCollateral);
    if (!col) return null;
    const liqDelta = col / notional;
    return side === "long"
      ? effectivePrice * (1 - liqDelta * 0.9)
      : effectivePrice * (1 + liqDelta * 0.9);
  })();

  const handleLeverageClick = (lev: number) => {
    setLeverage(lev);
    if (size && effectivePrice) {
      setCollateralStr((size * effectivePrice / lev).toFixed(2));
    }
  };

  const handleSizeChange = (v: string) => {
    setSizeStr(v);
    const s = Number(v);
    if (s > 0 && effectivePrice && leverage) {
      setCollateralStr((s * effectivePrice / leverage).toFixed(2));
    }
  };

  const handleCollateralChange = (v: string) => {
    setCollateralStr(v);
    const col = Number(v);
    if (col > 0 && effectivePrice && leverage) {
      setSizeStr((col * leverage / effectivePrice).toFixed(4));
    }
  };

  const submit = async () => {
    const col = collateral || Number(impliedCollateral);
    if (!size || !col) { toast.error("Enter size or collateral"); return; }
    if (col > state.freeBalance) {
      toast.error(`Insufficient balance — you have $${state.freeBalance.toFixed(2)}`);
      return;
    }
    if (mode === "limit" && !priceStr) { toast.error("Enter a limit price"); return; }

    setLoading(true);

    // Simulate brief latency for realism
    await new Promise(r => setTimeout(r, 400));

    const fillPrice = mode === "market"
      ? markPrice * (side === "long" ? 1.0005 : 0.9995) // 0.05% slippage
      : Number(priceStr);

    const ok = openPosition({
      market,
      symbol: "SOL-PERP",
      side,
      size,
      price: fillPrice,
      collateral: col,
      leverage,
    });

    setLoading(false);

    if (ok) {
      toast.success(
        mode === "market"
          ? `${side === "long" ? "↑ Long" : "↓ Short"} opened @ $${fillPrice.toFixed(2)}`
          : `Limit order placed @ $${fillPrice.toFixed(2)}`,
        { icon: side === "long" ? "📈" : "📉" }
      );
      setSizeStr(""); setCollateralStr("");
    } else {
      toast.error("Failed to open position");
    }
  };

  const fmtBalance = state.freeBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--bg)" }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>Place Order</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Long / Short */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {(["long", "short"] as Side[]).map(s => (
            <button key={s} onClick={() => setSide(s)} style={{
              padding: "10px 0", borderRadius: 8,
              border: side === s
                ? "none"
                : `1px solid ${s === "long" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              cursor: "pointer",
              background: side === s
                ? (s === "long" ? "#22c55e" : "#ef4444")
                : (s === "long" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)"),
              color: side === s
                ? (s === "long" ? "#000" : "#fff")
                : (s === "long" ? "#22c55e" : "#ef4444"),
              fontSize: 12, fontWeight: 700, fontFamily: "var(--font-sans)", transition: "all 0.15s",
            }}>
              {s === "long" ? "↑ Long" : "↓ Short"}
            </button>
          ))}
        </div>

        {/* Market / Limit tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
          {(["market", "limit"] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "5px 12px", borderRadius: 6, border: "none",
              borderBottom: mode === m ? "2px solid var(--text-1)" : "2px solid transparent",
              background: "none",
              color: mode === m ? "var(--text-1)" : "var(--text-3)",
              fontSize: 12, fontWeight: mode === m ? 600 : 400, cursor: "pointer",
              fontFamily: "var(--font-sans)", transition: "all 0.12s",
            }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Inputs */}
        {mode === "limit" && (
          <InputRow label="Limit Price (USD)" value={priceStr} onChange={setPriceStr}
            placeholder={markPrice > 0 ? markPrice.toFixed(2) : "0.00"} />
        )}

        <InputRow label="Size (SOL)" value={sizeStr} onChange={handleSizeChange} placeholder="0.000" />
        <InputRow
          label={`Collateral (USDC) — avail $${fmtBalance}`}
          value={collateralStr} onChange={handleCollateralChange}
          placeholder={impliedCollateral || "0.00"}
          warn={collateral > state.freeBalance}
        />

        {/* Leverage presets */}
        <div>
          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>Leverage</div>
          <div style={{ display: "flex", gap: 4 }}>
            {LEVERAGES.map(lev => (
              <button key={lev} onClick={() => handleLeverageClick(lev)} style={{
                flex: 1, padding: "7px 0", borderRadius: 6,
                border: `1px solid ${leverage === lev ? "var(--border-3)" : "var(--border-2)"}`,
                background: leverage === lev ? "var(--bg-3)" : "none",
                color: leverage === lev ? "var(--text-1)" : "var(--text-2)",
                fontSize: 11, fontWeight: leverage === lev ? 700 : 500,
                cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 0.12s",
              }}>
                {lev}×
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            ["Leverage", `${impliedLeverage}×`],
            ["Notional", notional > 0 ? `$${notional.toFixed(2)}` : "—"],
            ["Margin", collateral ? `$${collateral.toFixed(2)}` : impliedCollateral ? `$${impliedCollateral}` : "—"],
            ["Entry", mode === "market" ? `~$${markPrice.toFixed(2)}` : priceStr ? `$${Number(priceStr).toFixed(2)}` : "—"],
            ["Liq. Price", liqPrice ? `$${liqPrice.toFixed(2)}` : "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
                color: label === "Liq. Price" ? "#ef4444" : val === "—" ? "var(--text-3)" : "var(--text-1)",
              }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading || !sizeStr}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 9, border: "none",
            background: loading || !sizeStr
              ? "var(--bg-3)"
              : side === "long" ? "#22c55e" : "#ef4444",
            color: loading || !sizeStr
              ? "var(--text-3)"
              : side === "long" ? "#000" : "#fff",
            fontSize: 13, fontWeight: 700, cursor: loading || !sizeStr ? "not-allowed" : "pointer",
            fontFamily: "var(--font-sans)", transition: "all 0.15s",
            boxShadow: !loading && sizeStr
              ? side === "long" ? "0 0 20px rgba(34,197,94,0.2)" : "0 0 20px rgba(239,68,68,0.2)"
              : "none",
            outline: !loading && !sizeStr ? `1px solid var(--border-2)` : "none",
          }}
        >
          {loading ? "Filling…" : !sizeStr ? "Enter size to continue" : `${mode === "market" ? "Market" : "Limit"} ${side === "long" ? "Long" : "Short"}`}
        </button>

        {/* Balance warning */}
        {collateral > state.freeBalance && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#ef4444" }}>
            Insufficient balance — need ${(collateral - state.freeBalance).toFixed(2)} more
          </div>
        )}
      </div>
    </div>
  );
}

function InputRow({ label, value, onChange, placeholder, warn }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; warn?: boolean;
}) {
  return (
    <div>
      <div style={{ fontSize: 9, color: warn ? "#ef4444" : "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5, transition: "color 0.12s" }}>
        {label}
      </div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        style={{
          width: "100%", background: "var(--bg-3)",
          border: `1px solid ${warn ? "rgba(239,68,68,0.5)" : "var(--border-2)"}`,
          borderRadius: 8, padding: "10px 12px", color: "var(--text-1)",
          fontSize: 13, fontFamily: "var(--font-mono)", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.12s",
        }}
        onFocus={e => { if (!warn) e.target.style.borderColor = "var(--border-3)"; e.target.style.background = "var(--bg-2)"; }}
        onBlur={e => { if (!warn) e.target.style.borderColor = "var(--border-2)"; e.target.style.background = "var(--bg-3)"; }}
      />
    </div>
  );
}

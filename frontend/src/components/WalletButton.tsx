"use client";
import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@/lib/wallet-modal";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { openWallet } = useWalletModal();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!publicKey || !connected) { setBalance(null); return; }
    connection.getBalance(publicKey)
      .then(lamports => setBalance(lamports / LAMPORTS_PER_SOL))
      .catch(() => setBalance(null));
  }, [publicKey, connected, connection]);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => openWallet()}
        style={{
          padding: "6px 14px", borderRadius: 8,
          border: "1px solid var(--border-2)", background: "var(--bg-2)",
          color: "var(--text-2)", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-3)"; e.currentTarget.style.color = "var(--text-1)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
      >
        Connect Wallet
      </button>
    );
  }

  const addr = publicKey.toBase58();
  const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setMenuOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 10px", borderRadius: 8,
          border: "1px solid var(--border-2)", background: "var(--bg-2)",
          cursor: "pointer", transition: "border-color 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-3)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-1)", fontWeight: 600, lineHeight: 1 }}>
            {short}
          </div>
          {balance !== null && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-4)", marginTop: 1 }}>
              {balance.toFixed(3)} SOL
            </div>
          )}
        </div>
      </button>

      {menuOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--bg-2)", border: "1px solid var(--border-2)",
            borderRadius: 10, zIndex: 99, minWidth: 190, overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 9, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                Connected
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-2)" }}>{short}</div>
              {balance !== null && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginTop: 4 }}>
                  {balance.toFixed(4)} SOL
                </div>
              )}
            </div>
            <button
              onClick={() => { disconnect(); setMenuOpen(false); }}
              style={{
                width: "100%", padding: "10px 14px", background: "none", border: "none",
                textAlign: "left", color: "#ef4444", fontSize: 12, cursor: "pointer",
                fontFamily: "var(--font-sans)", transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}

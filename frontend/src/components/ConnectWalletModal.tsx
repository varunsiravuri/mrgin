"use client";
import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink, Loader2, Wallet, ChevronRight } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState, type WalletName } from "@solana/wallet-adapter-base";
import { useWalletModal } from "@/lib/wallet-modal";
import { LogoMark } from "@/components/Logo";

const INSTALL_URLS: Record<string, string> = {
  Phantom: "https://phantom.app/download",
  Backpack: "https://backpack.app/download",
  Solflare: "https://solflare.com/download",
};

function statusLabel(state: WalletReadyState) {
  if (state === WalletReadyState.Installed) return "Detected";
  if (state === WalletReadyState.Loadable) return "Available";
  return "Not installed";
}

export function ConnectWalletModal() {
  const { open, closeWallet } = useWalletModal();
  const { wallets, select, connect, connecting, connected } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPending(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeWallet();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeWallet]);

  useEffect(() => {
    if (connected && open) closeWallet();
  }, [connected, open, closeWallet]);

  const sorted = useMemo(() => {
    const rank = (s: WalletReadyState) =>
      s === WalletReadyState.Installed ? 0 : s === WalletReadyState.Loadable ? 1 : 2;
    return [...wallets].sort((a, b) => rank(a.readyState) - rank(b.readyState));
  }, [wallets]);

  const detected = sorted.filter(w => w.readyState === WalletReadyState.Installed);
  const others = sorted.filter(w => w.readyState !== WalletReadyState.Installed);

  if (!open) return null;

  const pick = async (name: string, ready: WalletReadyState) => {
    if (ready === WalletReadyState.NotDetected) {
      const url = INSTALL_URLS[name];
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setError(null);
    setPending(name);
    try {
      select(name as WalletName);
      await connect();
      closeWallet();
    } catch {
      setError("Connection was cancelled or failed. Try again.");
    } finally {
      setPending(null);
    }
  };

  const busy = connecting || !!pending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) closeWallet(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 210, display: "grid", placeItems: "center",
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)", padding: 20,
        animation: "wallet-fade-in 160ms ease-out",
      }}
    >
      <style>{`
        @keyframes wallet-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes wallet-pop-in { from { opacity: 0; transform: translateY(10px) scale(0.98) } to { opacity: 1; transform: none } }
        .wallet-row:hover:not(:disabled) { border-color: var(--border-3) !important; background: var(--bg-3) !important; }
        .wallet-row:hover:not(:disabled) .wallet-row-arrow { color: var(--green); transform: translateX(2px); }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 400, background: "var(--bg-2)",
        border: "1px solid var(--border-2)", borderRadius: 18, overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(52,211,153,0.06)",
        animation: "wallet-pop-in 220ms cubic-bezier(0,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px 0",
          background: "linear-gradient(180deg, rgba(52,211,153,0.06) 0%, transparent 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <LogoMark size={22} />
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.04em", color: "var(--text-1)" }}>mrgin</span>
            </div>
            <button onClick={closeWallet} disabled={busy} aria-label="Close" style={{
              display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
              background: "none", border: "1px solid var(--border-2)", color: "var(--text-3)",
              cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.5 : 1,
            }}>
              <X size={15} />
            </button>
          </div>

          <div style={{
            width: 44, height: 44, borderRadius: 12, marginBottom: 14,
            background: "var(--bg-3)", border: "1px solid var(--border-2)",
            display: "grid", placeItems: "center",
          }}>
            <Wallet size={20} color="var(--green)" strokeWidth={2} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px", color: "var(--text-1)" }}>
            Connect your wallet
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.65, margin: "0 0 4px" }}>
            Link a Solana wallet to view on-chain portfolio data on devnet.
          </p>
          <p style={{ fontSize: 11.5, color: "var(--text-4)", lineHeight: 1.55, margin: 0 }}>
            Demo trading works with email — a wallet is optional.
          </p>
        </div>

        {/* Wallet list */}
        <div style={{ padding: "18px 22px 22px" }}>
          {detected.length > 0 && (
            <>
              <div style={{
                fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase",
                letterSpacing: "0.12em", fontFamily: "var(--font-mono)", marginBottom: 10,
              }}>
                Ready to connect
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: others.length ? 16 : 0 }}>
                {detected.map(w => (
                  <WalletRow
                    key={w.adapter.name}
                    name={w.adapter.name}
                    icon={w.adapter.icon}
                    badge="Detected"
                    badgeColor="var(--green)"
                    loading={pending === w.adapter.name}
                    disabled={busy && pending !== w.adapter.name}
                    onClick={() => pick(w.adapter.name, w.readyState)}
                  />
                ))}
              </div>
            </>
          )}

          {others.length > 0 && (
            <>
              <div style={{
                fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase",
                letterSpacing: "0.12em", fontFamily: "var(--font-mono)", marginBottom: 10,
              }}>
                {detected.length ? "More wallets" : "Popular wallets"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {others.map(w => {
                  const notInstalled = w.readyState === WalletReadyState.NotDetected;
                  return (
                    <WalletRow
                      key={w.adapter.name}
                      name={w.adapter.name}
                      icon={w.adapter.icon}
                      badge={statusLabel(w.readyState)}
                      badgeColor={notInstalled ? "var(--text-4)" : "var(--amber)"}
                      loading={pending === w.adapter.name}
                      disabled={busy && pending !== w.adapter.name}
                      external={notInstalled}
                      onClick={() => pick(w.adapter.name, w.readyState)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {sorted.length === 0 && (
            <div style={{
              padding: "24px 16px", textAlign: "center", borderRadius: 12,
              border: "1px dashed var(--border-2)", color: "var(--text-3)", fontSize: 13,
            }}>
              No wallets found. Install Phantom or Backpack to continue.
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--red)", lineHeight: 1.5 }}>{error}</div>
          )}

          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)" }} />
            <span style={{ fontSize: 10, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>Solana devnet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletRow({
  name, icon, badge, badgeColor, loading, disabled, external, onClick,
}: {
  name: string;
  icon: string;
  badge: string;
  badgeColor: string;
  loading?: boolean;
  disabled?: boolean;
  external?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="wallet-row"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
        background: "var(--bg-3)", border: "1px solid var(--border-2)",
        opacity: disabled ? 0.55 : 1, transition: "border-color 120ms ease-out, background 120ms ease-out",
        textAlign: "left",
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "var(--bg-2)", border: "1px solid var(--border)",
        display: "grid", placeItems: "center", overflow: "hidden",
      }}>
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" width={22} height={22} style={{ borderRadius: 6, display: "block" }} />
        ) : (
          <Wallet size={16} color="var(--text-3)" />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--font-sans)" }}>{name}</div>
        <div style={{ fontSize: 11, color: badgeColor, marginTop: 2, fontFamily: "var(--font-mono)" }}>{badge}</div>
      </div>

      {loading ? (
        <Loader2 size={16} color="var(--green)" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      ) : external ? (
        <ExternalLink size={15} color="var(--text-4)" style={{ flexShrink: 0 }} />
      ) : (
        <ChevronRight size={16} color="var(--text-4)" className="wallet-row-arrow" style={{ flexShrink: 0, transition: "transform 120ms ease-out, color 120ms ease-out" }} />
      )}
    </button>
  );
}

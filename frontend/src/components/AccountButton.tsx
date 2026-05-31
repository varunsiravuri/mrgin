"use client";
import { useEffect, useRef, useState } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function AccountButton({ compact = false }: { compact?: boolean }) {
  const { user, loading, openAuth, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (loading) {
    return <div style={{ width: compact ? 72 : 92, height: 32, borderRadius: 8, background: "var(--bg-3)", border: "1px solid var(--border-2)" }} aria-hidden />;
  }

  if (!user) {
    return (
      <button onClick={openAuth} style={{
        display: "flex", alignItems: "center", gap: 7, padding: compact ? "6px 12px" : "7px 14px",
        borderRadius: 8, border: "1px solid var(--border-2)", background: "var(--bg-2)",
        color: "var(--text-2)", fontSize: 13, fontWeight: 500, cursor: "pointer",
        fontFamily: "var(--font-sans)", transition: "border-color 120ms ease-out, color 120ms ease-out",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-3)"; e.currentTarget.style.color = "var(--text-1)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.color = "var(--text-2)"; }}
      >
        <User size={14} /> Sign in
      </button>
    );
  }

  const initial = user.email[0]?.toUpperCase() ?? "?";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "5px 8px 5px 6px",
        borderRadius: 8, border: "1px solid var(--border-2)", background: "var(--bg-2)", cursor: "pointer",
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center",
          background: "var(--accent-grad)", color: "#08080a", fontSize: 12, fontWeight: 700,
        }}>{initial}</span>
        {!compact && (
          <span style={{ fontSize: 12, color: "var(--text-2)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
            {user.email}
          </span>
        )}
        <ChevronDown size={13} color="var(--text-3)" />
      </button>

      {open && (
        <div role="menu" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 120,
          minWidth: 200, padding: 6, borderRadius: 12, background: "var(--bg-2)",
          border: "1px solid var(--border-2)", boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: "var(--text-mono-dim)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--font-mono)", marginBottom: 4 }}>Signed in</div>
            <div style={{ fontSize: 13, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
          <button role="menuitem" onClick={() => { setOpen(false); logout(); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
            borderRadius: 8, border: "none", background: "transparent", color: "var(--text-2)",
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

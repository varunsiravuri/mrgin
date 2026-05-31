"use client";
import { useEffect, useState } from "react";
import { X, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";

type Mode = "login" | "signup";

export function AuthModal() {
  const { authOpen, closeAuth, loginWithPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authOpen) return;
    setError(null); setBusy(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [authOpen, closeAuth]);

  if (!authOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await loginWithPassword(email, password, mode);
    setBusy(false);
    if (!r.ok) setError(r.error ?? "Something went wrong");
    // success closes the modal via the provider
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to mrgin"
      onMouseDown={e => { if (e.target === e.currentTarget) closeAuth(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", padding: 20,
        animation: "fade-in 160ms ease-out",
      }}
    >
      <style>{`@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop-in { from { opacity: 0; transform: translateY(8px) scale(0.985) } to { opacity: 1; transform: none } }
        .auth-in::placeholder { color: #4a4a52; }
        .auth-in:focus { border-color: var(--border-3) !important; }`}</style>

      <div style={{
        width: "100%", maxWidth: 420, background: "var(--bg-2)",
        border: "1px solid var(--border-2)", borderRadius: 18, overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)", animation: "pop-in 200ms cubic-bezier(0,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={22} />
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.04em", color: "var(--text-1)" }}>mrgin</span>
          </div>
          <button onClick={closeAuth} aria-label="Close" style={{
            display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
            background: "none", border: "1px solid var(--border-2)", color: "var(--text-3)", cursor: "pointer",
          }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: "16px 22px 24px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", margin: "8px 0 4px", color: "var(--text-1)" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, margin: "0 0 20px" }}>
            {mode === "login"
              ? "Sign in to access your $5,000 balance, open positions, and trade history."
              : "Sign up to save your $5,000 balance, positions, and history across devices."}
          </p>

          <form onSubmit={submit}>
            <Field icon={<Mail size={15} />} label="Email">
              <input
                className="auth-in" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                style={inputStyle}
              />
            </Field>
            <div style={{ height: 12 }} />
            <Field icon={<Lock size={15} />} label="Password">
              <input
                className="auth-in" type="password" required minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                style={inputStyle}
              />
            </Field>
            {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 12 }}>{error}</div>}
            <button type="submit" disabled={busy} style={{
              width: "100%", marginTop: 18, padding: "12px 0", borderRadius: 10, border: "none",
              background: busy ? "var(--bg-3)" : "var(--accent-grad)", color: busy ? "var(--text-3)" : "#08080a",
              fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity 120ms ease-out",
            }}>
              {busy ? "Working…" : <>{mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={15} /></>}
            </button>
          </form>

          <p style={{ fontSize: 12.5, color: "var(--text-3)", textAlign: "center", marginTop: 16 }}>
            {mode === "login" ? "New to mrgin?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); }}
              style={{ background: "none", border: "none", color: "var(--green)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, padding: 0 }}>
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-3)", border: "1px solid var(--border-2)",
  borderRadius: 9, padding: "11px 12px 11px 36px", color: "var(--text-1)",
  fontSize: 14, fontFamily: "var(--font-sans)", outline: "none",
  boxSizing: "border-box", transition: "border-color 120ms ease-out",
};

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</span>
      <span style={{ position: "relative", display: "block" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", display: "grid", placeItems: "center" }}>{icon}</span>
        {children}
      </span>
    </label>
  );
}

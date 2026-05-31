"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface WalletModalCtx {
  open: boolean;
  openWallet: () => void;
  closeWallet: () => void;
}

const Ctx = createContext<WalletModalCtx | null>(null);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openWallet = useCallback(() => setOpen(true), []);
  const closeWallet = useCallback(() => setOpen(false), []);

  return (
    <Ctx.Provider value={{ open, openWallet, closeWallet }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWalletModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWalletModal must be used inside WalletModalProvider");
  return ctx;
}

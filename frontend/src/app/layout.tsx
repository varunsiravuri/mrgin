import type { Metadata } from "next";
import "./globals.css";
import { WalletProviders } from "@/components/WalletProviders";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "mrgin — Cross-Margined Perps",
  description: "Perpetual futures and prediction markets on Solana with shared cross-margin collateral",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <WalletProviders>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#f0f0f0",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </WalletProviders>
      </body>
    </html>
  );
}

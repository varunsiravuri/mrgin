import Image from "next/image";

export type TokenSymbol = "SOL" | "BTC" | "ETH";

const LOGOS: Record<TokenSymbol, string> = {
  SOL: "/icons/sol.svg",
  BTC: "/icons/btc.svg",
  ETH: "/icons/eth.svg",
};

export function TokenIcon({
  symbol,
  size = 18,
  className,
}: {
  symbol: TokenSymbol | string;
  size?: number;
  className?: string;
}) {
  const src = LOGOS[symbol as TokenSymbol];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, flexShrink: 0, display: "block" }}
      unoptimized
    />
  );
}

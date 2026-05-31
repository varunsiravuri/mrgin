"use client";

/** Brand mark — rising M-chart with upward arrow (blue → teal → green). */
export function LogoMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const grad = "mrgin-brand-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={grad} x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="0.45" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
      </defs>
      {/* M-chart stroke rising into arrow — matches brand lockup */}
      <path
        d="M6 34 C6 34 8 22 14 26 L22 14 L30 24 L38 8 L42 4"
        stroke={`url(#${grad})`}
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow head */}
      <path
        d="M42 4 L34 6 L38 12 Z"
        fill={`url(#${grad})`}
      />
      {/* Base accent triangle */}
      <path
        d="M30 28 L26 34 L34 34 Z"
        fill={`url(#${grad})`}
        opacity="0.85"
      />
    </svg>
  );
}

export function Logo({
  size = 22,
  wordSize = 21,
  color = "var(--text-1)",
  showWord = true,
  className,
}: {
  size?: number;
  wordSize?: number;
  color?: string;
  showWord?: boolean;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: size * 0.42 }}
    >
      <LogoMark size={size} />
      {showWord && (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: wordSize,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color,
            marginTop: 1,
          }}
        >
          mrgin
        </span>
      )}
    </span>
  );
}

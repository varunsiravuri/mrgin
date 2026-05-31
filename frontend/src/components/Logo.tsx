"use client";

/**
 * mrgin mark — two markets (perps + predictions) converging into one vault.
 * The split notch at the top reads as two inputs; the single rising stroke
 * inside is the shared cross-margin equity line. Scales cleanly from 16→64px.
 */
export function LogoMark({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = "mrgin-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={id} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      {/* vault */}
      <rect
        x="2.4"
        y="2.4"
        width="19.2"
        height="19.2"
        rx="6"
        stroke={`url(#${id})`}
        strokeWidth="1.6"
      />
      {/* two markets converging — the split feed lines */}
      <path
        d="M7.5 7.2 L12 11 L16.5 7.2"
        stroke={`url(#${id})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* shared cross-margin equity line, rising */}
      <path
        d="M7.5 16.6 L10.4 13.7 L13 15.4 L16.8 10.4"
        stroke={`url(#${id})`}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.8" cy="10.4" r="1.35" fill="#a3e635" />
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
            // optical: cap-height sits high, nudge to baseline-align with the mark
            marginTop: 1,
          }}
        >
          mrgin
        </span>
      )}
    </span>
  );
}

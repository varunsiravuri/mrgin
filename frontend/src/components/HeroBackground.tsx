"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";

const LAYERS = [
  {
    src: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=70",
    alt: "",
    style: { top: "-8%", left: "-12%", width: "58%", height: "72%", opacity: 0.14 },
    blur: 2,
    parallax: 0.018,
  },
  {
    src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=70",
    alt: "",
    style: { top: "10%", right: "-14%", width: "52%", height: "68%", opacity: 0.12 },
    blur: 3,
    parallax: 0.024,
  },
  {
    src: "https://images.unsplash.com/photo-1639765487024-403b45635d86?auto=format&fit=crop&w=1400&q=70",
    alt: "",
    style: { bottom: "-18%", left: "22%", width: "48%", height: "55%", opacity: 0.1 },
    blur: 4,
    parallax: 0.012,
  },
] as const;

function FloatingCard({
  children,
  style,
  wrapperStyle,
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div style={{ position: "absolute", pointerEvents: "none", ...wrapperStyle }}>
      <div className={className}>
        <div
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(10,10,10,0.55)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.55)",
            ...style,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setOffset({ x, y });
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div ref={ref} aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {LAYERS.map((layer, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            borderRadius: 24,
            overflow: "hidden",
            filter: `blur(${layer.blur}px) saturate(0.35) contrast(1.1)`,
            transform: `translate(${offset.x * layer.parallax * 120}px, ${offset.y * layer.parallax * 120}px)`,
            transition: "transform 0.4s ease-out",
            ...layer.style,
          }}
        >
          <Image
            src={layer.src}
            alt={layer.alt}
            fill
            sizes="60vw"
            style={{ objectFit: "cover" }}
            priority={i === 0}
          />
        </div>
      ))}

      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 90% 70% at 15% 20%, rgba(34,197,94,0.06) 0%, transparent 55%),
          radial-gradient(ellipse 80% 60% at 85% 25%, rgba(59,130,246,0.05) 0%, transparent 50%),
          linear-gradient(to right, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.88) 42%, rgba(8,8,8,0.55) 68%, rgba(8,8,8,0.35) 100%),
          linear-gradient(to bottom, rgba(8,8,8,0.35) 0%, rgba(8,8,8,0.82) 55%, rgba(8,8,8,0.96) 100%)
        `,
      }} />

      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
      >
        <path
          d="M0,520 C120,480 180,560 300,500 S540,420 680,480 S920,560 1200,440 L1200,800 L0,800 Z"
          fill="url(#chartFill)"
        />
        <path
          d="M0,560 C80,520 200,600 340,540 S620,460 780,520 S980,580 1200,500"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <FloatingCard
        className="hero-float-a"
        wrapperStyle={{
          top: "14%", right: "4%",
          transform: `translate(${offset.x * -8}px, ${offset.y * -8}px)`,
          transition: "transform 0.4s ease-out",
        }}
        style={{ width: 220, padding: "14px 16px", transform: "rotate(6deg)", opacity: 0.55 }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#333", letterSpacing: "0.12em", marginBottom: 10 }}>
          SOL-PERP · LIVE
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#f2f2f2", marginBottom: 4 }}>
          $83.08
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#22c55e" }}>+2.41% · 20×</div>
        <div style={{ marginTop: 12, height: 40, display: "flex", alignItems: "flex-end", gap: 3 }}>
          {[28, 42, 35, 55, 48, 62, 58, 70].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: h, borderRadius: 2,
              background: i > 5 ? "#22c55e" : "#1a1a1a",
              opacity: i > 5 ? 0.8 : 1,
            }} />
          ))}
        </div>
      </FloatingCard>

      <FloatingCard
        className="hero-float-b"
        wrapperStyle={{
          bottom: "18%", left: "2%",
          transform: `translate(${offset.x * 10}px, ${offset.y * 10}px)`,
          transition: "transform 0.4s ease-out",
        }}
        style={{ width: 200, padding: "14px 16px", transform: "rotate(-5deg)", opacity: 0.5 }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#333", letterSpacing: "0.12em", marginBottom: 10 }}>
          IPL FINAL · YES
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🏏</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#888" }}>RCB vs GT</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>53%</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#555" }}>1.89×</span>
        </div>
        <div style={{ marginTop: 10, height: 4, background: "#161616", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: "53%", height: "100%", background: "#3b82f6" }} />
        </div>
      </FloatingCard>

      <FloatingCard
        className="hero-float-c"
        wrapperStyle={{
          top: "52%", right: "18%",
          transform: `translate(${offset.x * -5}px, ${offset.y * 6}px)`,
          transition: "transform 0.4s ease-out",
        }}
        style={{ width: 160, padding: "12px 14px", transform: "rotate(3deg)", opacity: 0.35 }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#2a2a2a", marginBottom: 6 }}>CROSS-MARGIN</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "#22c55e" }}>+$142.50</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#444", marginTop: 4 }}>Health 82%</div>
      </FloatingCard>

      <div className="dot-grid" style={{
        position: "absolute", inset: 0, opacity: 0.4,
        maskImage: "radial-gradient(ellipse 85% 75% at 45% 40%, black 15%, transparent 72%)",
      }} />

      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 50% 45% at 35% 40%, transparent 0%, rgba(8,8,8,0.75) 100%)",
      }} />

      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)",
      }} />
    </div>
  );
}

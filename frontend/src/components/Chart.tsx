"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";
import { fetchBinanceKlines } from "@/lib/api";
import type { Interval } from "./IntervalSelector";

// Binance interval strings match our Interval type exactly
const BINANCE_SYMBOL = "SOLUSDT";

interface ChartProps {
  market: string;
  interval: Interval;
  markPrice: number;
}

export function Chart({ market, interval, markPrice }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef    = useRef<any>(null);
  const seriesRef   = useRef<any>(null);
  const wsRef       = useRef<WebSocket | null>(null);

  // ── Init chart + load candles ────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#444",
        fontFamily: "IBM Plex Mono",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#111", style: 1 },
        horzLines: { color: "#111", style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#2a2a2a", labelBackgroundColor: "#1a1a1a" },
        horzLine: { color: "#2a2a2a", labelBackgroundColor: "#1a1a1a" },
      },
      rightPriceScale: { borderColor: "#161616", textColor: "#444" },
      timeScale: { borderColor: "#161616", timeVisible: true, secondsVisible: false },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    // Load historical candles from Binance
    fetchBinanceKlines(BINANCE_SYMBOL, interval, 200)
      .then(candles => {
        series.setData(candles);
        chart.timeScale().fitContent();
      })
      .catch(() => {});

    // Open Binance WebSocket for live candle stream
    const streamInterval = interval; // "1m", "5m" etc. match Binance exactly
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${BINANCE_SYMBOL.toLowerCase()}@kline_${streamInterval}`
    );
    ws.onmessage = (evt) => {
      try {
        const { k } = JSON.parse(evt.data);
        if (!k) return;
        seriesRef.current?.update({
          time:  k.t / 1000,
          open:  Number(k.o),
          high:  Number(k.h),
          low:   Number(k.l),
          close: Number(k.c),
        });
      } catch { /* */ }
    };
    ws.onerror = () => {};
    wsRef.current = ws;

    // ResizeObserver
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      ws.close();
      chart.remove();
    };
  // Re-init when market or interval changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, interval]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />
  );
}

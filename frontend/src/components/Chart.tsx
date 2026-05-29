"use client";
import { useEffect, useRef } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from "lightweight-charts";
import type { Interval } from "./IntervalSelector";

interface ChartProps {
  market: string;
  interval: Interval;
  markPrice: number;
}

function generateCandles(markPrice: number, count = 120): any[] {
  const candles = [];
  let price = markPrice * 0.95;
  const now = Math.floor(Date.now() / 1000);
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.49) * markPrice * 0.004;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * markPrice * 0.003;
    const low = Math.min(open, close) - Math.random() * markPrice * 0.003;
    candles.push({ time: now - i * 60, open, high, low, close });
    price = close;
  }
  return candles;
}

export function Chart({ market, interval, markPrice }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#555",
        fontFamily: "IBM Plex Mono",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#111", style: 1 },
        horzLines: { color: "#111", style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#333", labelBackgroundColor: "#1a1a1a" },
        horzLine: { color: "#333", labelBackgroundColor: "#1a1a1a" },
      },
      rightPriceScale: {
        borderColor: "#1a1a1a",
        textColor: "#555",
      },
      timeScale: {
        borderColor: "#1a1a1a",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const candles = generateCandles(markPrice || 100);
    series.setData(candles);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, interval]);

  // Update last candle when markPrice ticks
  useEffect(() => {
    if (!seriesRef.current || !markPrice) return;
    const now = Math.floor(Date.now() / 1000);
    seriesRef.current.update({
      time: now,
      open: markPrice * 0.9998,
      high: markPrice * 1.0003,
      low: markPrice * 0.9996,
      close: markPrice,
    });
  }, [markPrice]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
  );
}

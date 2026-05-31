"use client";
import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  UTCTimestamp,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";
import { fetchBinanceKlines } from "@/lib/api";
import type { Interval } from "./IntervalSelector";

interface ChartProps {
  binanceSymbol: string;
  interval: Interval;
  markPrice: number;
}

function safeChartOp(fn: () => void) {
  try {
    fn();
  } catch {
    // Chart may already be disposed during unmount / interval switch.
  }
}

export function Chart({ binanceSymbol, interval }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let alive = true;
    let chart: IChartApi | null = null;
    let series: ISeriesApi<"Candlestick"> | null = null;

    chart = createChart(el, {
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
      width: el.clientWidth,
      height: el.clientHeight,
    });

    series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    fetchBinanceKlines(binanceSymbol, interval, 200)
      .then(candles => {
        if (!alive || !series || !chart) return;
        safeChartOp(() => {
          series!.setData(candles);
          chart!.timeScale().fitContent();
        });
      })
      .catch(() => {});

    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@kline_${interval}`
    );
    ws.onmessage = evt => {
      if (!alive || !series) return;
      try {
        const { k } = JSON.parse(evt.data as string);
        if (!k) return;
        const bar: CandlestickData<UTCTimestamp> = {
          time: Math.floor(k.t / 1000) as UTCTimestamp,
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close: Number(k.c),
        };
        safeChartOp(() => series!.update(bar));
      } catch {
        /* ignore parse / disposed */
      }
    };
    ws.onerror = () => {};

    const ro = new ResizeObserver(() => {
      if (!alive || !chart || !containerRef.current) return;
      safeChartOp(() => {
        chart!.applyOptions({
          width: containerRef.current!.clientWidth,
          height: containerRef.current!.clientHeight,
        });
      });
    });
    ro.observe(el);

    return () => {
      alive = false;
      ro.disconnect();
      ws.onmessage = null;
      ws.onopen = null;
      ws.onerror = null;
      ws.onclose = null;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      series = null;
      safeChartOp(() => chart!.remove());
      chart = null;
    };
  }, [binanceSymbol, interval]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#0a0a0a" }} />
  );
}

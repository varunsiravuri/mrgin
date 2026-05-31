import { NextRequest, NextResponse } from "next/server";

// Public market-data endpoint (works on Vercel; api.binance.com is geo-blocked in many regions).
const BINANCE = "https://data-api.binance.vision/api/v3";
const BINANCE_FALLBACK = "https://api.binance.com/api/v3";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = req.nextUrl.search;
  try {
    let r = await fetch(`${BINANCE}/${path}${search}`, { cache: "no-store" });
    if (!r.ok && r.status !== 404) {
      r = await fetch(`${BINANCE_FALLBACK}/${path}${search}`, { cache: "no-store" });
    }
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: "market data unavailable" }, { status: 502 });
  }
}

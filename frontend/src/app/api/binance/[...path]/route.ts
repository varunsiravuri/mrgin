import { NextRequest, NextResponse } from "next/server";

const BINANCE = "https://api.binance.com/api/v3";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = req.nextUrl.search;
  try {
    const r = await fetch(`${BINANCE}/${path}${search}`, { cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ error: "market data unavailable" }, { status: 502 });
  }
}

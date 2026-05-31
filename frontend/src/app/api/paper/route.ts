import { NextResponse } from "next/server";
import { getCurrentUser, getDemoState, saveDemoState } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ state: await getDemoState(user.id) });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let state: unknown;
  try {
    ({ state } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  if (!state || typeof state !== "object") return NextResponse.json({ error: "invalid" }, { status: 400 });
  await saveDemoState(user.id, state);
  return NextResponse.json({ ok: true });
}

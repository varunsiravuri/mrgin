import { NextResponse } from "next/server";
import {
  normalizeEmail, getUserByEmail, createUser, setUserPassword,
  hashPassword, verifyPassword, createSession, setSessionCookie,
} from "@/lib/server/auth";
import type { User } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "", password = "", mode: "login" | "signup" = "login";
  try {
    ({ email, password, mode } = await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  email = normalizeEmail(email ?? "");
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  if (!password || password.length < 8) return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });

  let user: User | undefined = await getUserByEmail(email);

  if (mode === "signup") {
    if (user?.password_hash) {
      return NextResponse.json({ ok: false, error: "Account already exists — sign in instead" }, { status: 409 });
    }
    if (user) await setUserPassword(user.id, hashPassword(password));
    else user = await createUser(email, hashPassword(password));
  } else {
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
    }
  }

  if (!user) return NextResponse.json({ ok: false, error: "Could not sign in" }, { status: 500 });

  const token = await createSession(user.id);
  setSessionCookie(token);
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
}

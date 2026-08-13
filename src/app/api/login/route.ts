import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple in-memory rate limiting (per IP)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Input sanitizer — strips HTML tags + dangerous chars
function sanitize(input: string): string {
  return String(input || "")
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/['";\\]/g, "") // strip SQL injection chars
    .trim()
    .slice(0, 100); // max length
}

export async function POST(request: Request) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.lastAttempt > WINDOW_MS) {
      // Reset after window expires
      loginAttempts.set(ip, { count: 1, lastAttempt: now });
    } else if (record.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait 5 minutes." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    } else {
      record.count++;
      record.lastAttempt = now;
    }
  } else {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  }

  let pin: string;
  try {
    const body = await request.json();
    pin = sanitize(body.pin || "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Validate PIN format (exactly 4 digits)
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  }

  if (pin !== "0000") {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  // Success — reset rate limit
  loginAttempts.delete(ip);

  const cookieStore = await cookies();
  cookieStore.set("session", "admin-001", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // upgraded from "lax" to "strict" for CSRF protection
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true });
}

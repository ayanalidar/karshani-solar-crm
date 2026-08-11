import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { pin } = await request.json();

  if (pin !== "0000") {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("session", "admin-001", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ ok: true });
}

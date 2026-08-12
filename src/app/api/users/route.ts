import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  // Strip PIN from list response — list view shouldn't expose PINs
  return NextResponse.json(users.map((u) => ({ id: u.id, name: u.name, role: u.role, createdAt: u.createdAt })));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  if (!String(data.name || "").trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const pin = String(data.pin || "").trim();
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: String(data.name).trim(),
      pin,
      role: String(data.role || "staff").trim(),
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Failed to create user. Check DATABASE_URL on Vercel." },
      { status: 500 }
    );
  }
  // Return without PIN
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, createdAt: user.createdAt }, { status: 201 });
}

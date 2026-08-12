import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const entries = await prisma.cashBookEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const entry = await prisma.cashBookEntry.create({
    data: {
      type: String(data.type || "credit").trim(),
      description: String(data.description || "").trim(),
      amount: Number(data.amount || 0),
      entryDate: String(data.entryDate || todayISO()),
    },
  });
  return NextResponse.json(entry, { status: 201 });
}

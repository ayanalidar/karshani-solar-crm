import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let entries = await prisma.cashBookEntry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!entries || entries.length === 0) {
    const rows = await rawSelect("cash_book", "created_at.desc", 100);
    if (rows) entries = toCamelArray(rows) as any;
  }
  return NextResponse.json(entries || []);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    type: String(data.type || "credit").trim(),
    description: String(data.description || "").trim(),
    amount: Number(data.amount || 0),
    entryDate: String(data.entryDate || todayISO()),
  };

  let entry = await prisma.cashBookEntry.create({ data: insertData });
  if (!entry) {
    const row = await rawInsert("cash_book", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    entry = toCamel(row) as any;
  }
  return NextResponse.json(entry, { status: 201 });
}

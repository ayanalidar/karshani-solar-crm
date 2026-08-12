import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, toSnake, toCamel } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(expenses);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    category: String(data.category || "").trim(),
    description: String(data.description || "").trim(),
    amount: Number(data.amount || 0),
    expenseDate: String(data.expenseDate || todayISO()),
  };

  let expense = await prisma.expense.create({ data: insertData });
  if (!expense) {
    const row = await rawInsert("expenses", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    expense = toCamel(row) as any;
  }
  return NextResponse.json(expense, { status: 201 });
}

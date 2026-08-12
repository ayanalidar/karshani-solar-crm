import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
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
  const expense = await prisma.expense.create({
    data: {
      category: String(data.category || "").trim(),
      description: String(data.description || "").trim(),
      amount: Number(data.amount || 0),
      expenseDate: String(data.expenseDate || todayISO()),
    },
  });
  return NextResponse.json(expense, { status: 201 });
}

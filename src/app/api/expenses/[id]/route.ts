import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.category !== undefined && { category: String(data.category).trim() }),
      ...(data.description !== undefined && { description: String(data.description).trim() }),
      ...(data.amount !== undefined && { amount: Number(data.amount) }),
      ...(data.expenseDate !== undefined && { expenseDate: String(data.expenseDate) }),
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

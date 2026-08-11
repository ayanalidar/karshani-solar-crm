import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const entry = await prisma.cashBookEntry.update({
    where: { id },
    data: {
      ...(data.type !== undefined && { type: String(data.type).trim() }),
      ...(data.description !== undefined && { description: String(data.description).trim() }),
      ...(data.amount !== undefined && { amount: Number(data.amount) }),
      ...(data.entryDate !== undefined && { entryDate: String(data.entryDate) }),
    },
  });
  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.cashBookEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

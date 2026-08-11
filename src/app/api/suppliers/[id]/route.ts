import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const order = await prisma.supplierOrder.update({
    where: { id },
    data: {
      ...(data.poNumber !== undefined && { poNumber: String(data.poNumber).trim() }),
      ...(data.supplierName !== undefined && { supplierName: String(data.supplierName).trim() }),
      ...(data.items !== undefined && { items: String(data.items).trim() }),
      ...(data.amount !== undefined && { amount: Number(data.amount) }),
      ...(data.orderDate !== undefined && { orderDate: String(data.orderDate) }),
      ...(data.status !== undefined && { status: String(data.status).trim() }),
    },
  });
  return NextResponse.json(order);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.supplierOrder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
      ...(data.city !== undefined && { city: String(data.city).trim() }),
      ...(data.gstin !== undefined && { gstin: String(data.gstin).trim().toUpperCase() }),
      ...(data.totalPurchases !== undefined && { totalPurchases: Number(data.totalPurchases) }),
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

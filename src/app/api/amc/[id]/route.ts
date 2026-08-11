import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const contract = await prisma.amcContract.update({
    where: { id },
    data: {
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.system !== undefined && { system: String(data.system).trim() }),
      ...(data.contractType !== undefined && { contractType: String(data.contractType).trim() }),
      ...(data.startDate !== undefined && { startDate: String(data.startDate) }),
      ...(data.expiryDate !== undefined && { expiryDate: String(data.expiryDate) }),
    },
  });
  return NextResponse.json(contract);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.amcContract.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

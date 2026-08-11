import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: {
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
      ...(data.source !== undefined && { source: String(data.source).trim() }),
      ...(data.systemDescription !== undefined && { systemDescription: String(data.systemDescription).trim() }),
      ...(data.estimatedAmount !== undefined && { estimatedAmount: Number(data.estimatedAmount) }),
      ...(data.status !== undefined && { status: String(data.status).trim() }),
      ...(data.notes !== undefined && { notes: String(data.notes).trim() }),
      ...(data.customerId !== undefined && { customerId: data.customerId ? String(data.customerId) : null }),
    },
  });
  return NextResponse.json(enquiry);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.enquiry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const install = await prisma.installation.update({
    where: { id },
    data: {
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.systemDescription !== undefined && { systemDescription: String(data.systemDescription).trim() }),
      ...(data.installDate !== undefined && { installDate: String(data.installDate) }),
      ...(data.stage !== undefined && { stage: String(data.stage).trim() }),
      ...(data.team !== undefined && { team: String(data.team).trim() }),
      ...(data.notes !== undefined && { notes: String(data.notes).trim() }),
      ...(data.customerId !== undefined && { customerId: data.customerId ? String(data.customerId) : null }),
    },
  });
  return NextResponse.json(install);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.installation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

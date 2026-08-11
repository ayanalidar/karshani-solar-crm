import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.role !== undefined && { role: String(data.role).trim() }),
      ...(data.phone !== undefined && { phone: String(data.phone).trim() }),
      ...(data.salary !== undefined && { salary: Number(data.salary) }),
      ...(data.joinDate !== undefined && { joinDate: String(data.joinDate) }),
      ...(data.active !== undefined && { active: Boolean(data.active) }),
    },
  });
  return NextResponse.json(employee);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

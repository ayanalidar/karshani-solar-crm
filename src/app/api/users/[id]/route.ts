import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();

  // If updating PIN, validate it's 4 digits
  if (data.pin !== undefined) {
    const pin = String(data.pin).trim();
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.pin !== undefined && { pin: String(data.pin).trim() }),
      ...(data.role !== undefined && { role: String(data.role).trim() }),
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Failed to update user. Check DATABASE_URL on Vercel." },
      { status: 500 }
    );
  }
  return NextResponse.json({ id: user.id, name: user.name, role: user.role, createdAt: user.createdAt });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;

  // Prevent self-delete (the current session is admin-001, can't delete
  // yourself or you'd lock yourself out)
  if (id === "admin-001") {
    return NextResponse.json(
      { error: "Cannot delete the primary admin account" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.category !== undefined && { category: String(data.category).trim() }),
      ...(data.brand !== undefined && { brand: String(data.brand).trim() }),
      ...(data.spec !== undefined && { spec: String(data.spec).trim() }),
      ...(data.hsnCode !== undefined && { hsnCode: String(data.hsnCode).trim() }),
      ...(data.unitPrice !== undefined && { unitPrice: Number(data.unitPrice) }),
      ...(data.gstPercentage !== undefined && { gstPercentage: Number(data.gstPercentage) }),
      ...(data.stockQuantity !== undefined && { stockQuantity: Number(data.stockQuantity) }),
    },
  });

  if (!product) {
    return NextResponse.json(
      { error: "Failed to update product. Check DATABASE_URL on Vercel." },
      { status: 500 }
    );
  }
  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

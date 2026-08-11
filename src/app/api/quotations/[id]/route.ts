import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true, customer: true },
  });
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quotation);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();

  // If items provided, replace them
  if (Array.isArray(data.items)) {
    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    if (data.items.length > 0) {
      await prisma.quotationItem.createMany({
        data: data.items.map((i: any) => ({
          quotationId: id,
          itemName: String(i.itemName || "").trim(),
          hsnCode: String(i.hsnCode || "").trim(),
          quantity: Number(i.quantity || 1),
          unitPrice: Number(i.unitPrice || 0),
          gstPercentage: Number(i.gstPercentage || 0),
          amount: Number(i.amount || Number(i.quantity || 1) * Number(i.unitPrice || 0)),
        })),
      });
    }
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.customerPhone !== undefined && { customerPhone: String(data.customerPhone).trim() }),
      ...(data.customerLocation !== undefined && { customerLocation: String(data.customerLocation).trim() }),
      ...(data.systemDescription !== undefined && { systemDescription: String(data.systemDescription).trim() }),
      ...(data.subtotal !== undefined && { subtotal: Number(data.subtotal) }),
      ...(data.gstTotal !== undefined && { gstTotal: Number(data.gstTotal) }),
      ...(data.grandTotal !== undefined && { grandTotal: Number(data.grandTotal) }),
      ...(data.status !== undefined && { status: String(data.status).trim() }),
      ...(data.customerId !== undefined && { customerId: data.customerId ? String(data.customerId) : null }),
    },
    include: { items: true },
  });
  return NextResponse.json(quotation);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.quotation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

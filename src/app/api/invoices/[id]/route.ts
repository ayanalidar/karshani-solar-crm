import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  // Use findFirst + separate items query (findUnique + include has issues)
  const invoice = await prisma.invoice.findFirst({ where: { id } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id } });
  return NextResponse.json({ ...invoice, items });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();

  if (Array.isArray(data.items)) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    if (data.items.length > 0) {
      await prisma.invoiceItem.createMany({
        data: data.items.map((i: any) => ({
          invoiceId: id,
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

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(data.customerName !== undefined && { customerName: String(data.customerName).trim() }),
      ...(data.description !== undefined && { description: String(data.description).trim() }),
      ...(data.subtotal !== undefined && { subtotal: Number(data.subtotal) }),
      ...(data.gstTotal !== undefined && { gstTotal: Number(data.gstTotal) }),
      ...(data.grandTotal !== undefined && { grandTotal: Number(data.grandTotal) }),
      ...(data.invoiceDate !== undefined && { invoiceDate: String(data.invoiceDate) }),
      ...(data.dueDate !== undefined && { dueDate: String(data.dueDate) }),
      ...(data.status !== undefined && { status: String(data.status).trim() }),
      ...(data.customerId !== undefined && { customerId: data.customerId ? String(data.customerId) : null }),
    },
    include: { items: true },
  });
  return NextResponse.json(invoice);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

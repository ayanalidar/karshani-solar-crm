import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const count = await prisma.invoice.count();
  const invoiceNo = data.invoiceNo || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const items = Array.isArray(data.items) ? data.items : [];

  let subtotal = Number(data.subtotal || 0);
  let gstTotal = Number(data.gstTotal || 0);
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((s: number, i: any) => s + Number(i.amount || i.quantity * i.unitPrice || 0), 0);
    gstTotal = items.reduce(
      (s: number, i: any) => s + (Number(i.amount || i.quantity * i.unitPrice || 0) * Number(i.gstPercentage || 0)) / 100,
      0
    );
  }
  const grandTotal = subtotal + gstTotal;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      customerName: String(data.customerName || "").trim(),
      description: String(data.description || "").trim(),
      subtotal,
      gstTotal,
      grandTotal,
      invoiceDate: String(data.invoiceDate || todayISO()),
      dueDate: String(data.dueDate || ""),
      status: String(data.status || "due").trim(),
      ...(data.customerId && { customerId: String(data.customerId) }),
      items: {
        create: items.map((i: any) => ({
          itemName: String(i.itemName || "").trim(),
          hsnCode: String(i.hsnCode || "").trim(),
          quantity: Number(i.quantity || 1),
          unitPrice: Number(i.unitPrice || 0),
          gstPercentage: Number(i.gstPercentage || 0),
          amount: Number(i.amount || Number(i.quantity || 1) * Number(i.unitPrice || 0)),
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(invoice, { status: 201 });
}

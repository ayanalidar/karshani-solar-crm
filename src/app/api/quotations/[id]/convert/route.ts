import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

// Convert a quotation into an invoice (one-shot). Creates a new Invoice
// with the same items + totals, and marks the quotation as "won".
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  if (quotation.status === "won" || quotation.status === "converted") {
    return NextResponse.json({ error: "Already converted" }, { status: 409 });
  }

  // Generate next invoice number: INV-YYYY-NNNN
  const count = await prisma.invoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      customerName: quotation.customerName,
      description: quotation.systemDescription,
      subtotal: quotation.subtotal,
      gstTotal: quotation.gstTotal,
      grandTotal: quotation.grandTotal,
      invoiceDate: todayISO(),
      dueDate: "",
      status: "due",
      ...(quotation.customerId && { customerId: quotation.customerId }),
      items: {
        create: quotation.items.map((i) => ({
          itemName: i.itemName,
          hsnCode: i.hsnCode,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          gstPercentage: i.gstPercentage,
          amount: i.amount,
        })),
      },
    },
    include: { items: true },
  });

  // Mark quotation as won
  await prisma.quotation.update({
    where: { id },
    data: { status: "won" },
  });

  return NextResponse.json(invoice, { status: 201 });
}

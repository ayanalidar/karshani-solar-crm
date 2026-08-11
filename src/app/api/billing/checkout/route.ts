import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

// POST /api/billing/checkout
// Body: {
//   customerId?: string,         // optional, link to existing customer
//   customerName: string,         // required (walk-in or selected name)
//   items: [{ productId, quantity }]
// }
// Creates: Invoice + InvoiceItem[] + decrements stock + updates customer.totalPurchases
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const data = await request.json();
  const customerName = String(data.customerName || "").trim();
  const items = Array.isArray(data.items) ? data.items : [];

  if (!customerName) {
    return NextResponse.json({ error: "customerName is required" }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate stock + collect snapshot
  const productIds = items.map((i: any) => String(i.productId));
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
  }

  for (const item of items) {
    const p = products.find((p) => p.id === String(item.productId));
    if (!p) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
    if (p.stockQuantity < Number(item.quantity)) {
      return NextResponse.json(
        { error: `Insufficient stock for ${p.name} (have ${p.stockQuantity}, need ${item.quantity})` },
        { status: 400 }
      );
    }
  }

  // Compute totals
  type LineItem = {
    productName: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    gstPercentage: number;
    amount: number;
    gst: number;
  };
  const lineItems: LineItem[] = items.map((i: any) => {
    const p = products.find((p) => p.id === String(i.productId))!;
    const qty = Number(i.quantity);
    const amount = qty * p.unitPrice;
    const gst = (amount * p.gstPercentage) / 100;
    return {
      productName: p.name,
      hsnCode: p.hsnCode,
      quantity: qty,
      unitPrice: p.unitPrice,
      gstPercentage: p.gstPercentage,
      amount,
      gst,
    };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const gstTotal = lineItems.reduce((s, i) => s + i.gst, 0);
  const grandTotal = subtotal + gstTotal;

  // Generate invoice number
  const count = await prisma.invoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  // Atomic transaction: create invoice + items + decrement stock + update customer
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNo,
        customerName,
        description: lineItems.map((i) => `${i.productName} x${i.quantity}`).join("; "),
        subtotal,
        gstTotal,
        grandTotal,
        invoiceDate: todayISO(),
        dueDate: "",
        status: "due",
        ...(data.customerId && { customerId: String(data.customerId) }),
        items: {
          create: lineItems.map((i) => ({
            itemName: i.productName,
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

    // Decrement stock
    for (const item of items) {
      const p = products.find((p) => p.id === String(item.productId))!;
      await tx.product.update({
        where: { id: p.id },
        data: { stockQuantity: { decrement: Number(item.quantity) } },
      });
    }

    // Update customer totalPurchases if linked
    if (data.customerId) {
      await tx.customer.update({
        where: { id: String(data.customerId) },
        data: { totalPurchases: { increment: grandTotal } },
      });
    }

    return inv;
  });

  return NextResponse.json(invoice, { status: 201 });
}

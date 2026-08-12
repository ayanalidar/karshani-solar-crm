import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";
import { rawInsert } from "@/lib/raw-db";

// POST /api/billing/checkout
// Body: {
//   customerId?: string,
//   customerName: string,
//   items: [{ productId, quantity }],
//   paymentMethod?: string,  // 'cash', 'upi', 'dbt', 'bank_finance', 'cheque'
//   financeAmount?: number,  // if bank finance: how much financed by bank
//   paidAmount?: number,     // how much paid by customer (non-finance)
// }
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const data = await request.json();
  const customerName = String(data.customerName || "").trim();
  const items = Array.isArray(data.items) ? data.items : [];

  if (!customerName) return NextResponse.json({ error: "customerName is required" }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  const productIds = items.map((i: any) => String(i.productId));
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) return NextResponse.json({ error: "One or more products not found" }, { status: 400 });

  for (const item of items) {
    const p = products.find((p) => p.id === String(item.productId))!;
    if (p.stockQuantity < Number(item.quantity)) {
      return NextResponse.json({ error: `Insufficient stock for ${p.name} (have ${p.stockQuantity}, need ${item.quantity})` }, { status: 400 });
    }
  }

  type LineItem = { productName: string; hsnCode: string; quantity: number; unitPrice: number; gstPercentage: number; amount: number; gst: number; };
  const lineItems: LineItem[] = items.map((i: any) => {
    const p = products.find((p) => p.id === String(i.productId))!;
    const qty = Number(i.quantity);
    const amount = qty * p.unitPrice;
    const gst = (amount * p.gstPercentage) / 100;
    return { productName: p.name, hsnCode: p.hsnCode, quantity: qty, unitPrice: p.unitPrice, gstPercentage: p.gstPercentage, amount, gst };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const gstTotal = lineItems.reduce((s, i) => s + i.gst, 0);
  const grandTotal = subtotal + gstTotal;

  const count = await prisma.invoice.count();
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNo, customerName,
        description: lineItems.map((i) => `${i.productName} x${i.quantity}`).join("; "),
        subtotal, gstTotal, grandTotal,
        invoiceDate: todayISO(), dueDate: "", status: "due",
        ...(data.customerId && { customerId: String(data.customerId) }),
        items: { create: lineItems.map((i) => ({ itemName: i.productName, hsnCode: i.hsnCode, quantity: i.quantity, unitPrice: i.unitPrice, gstPercentage: i.gstPercentage, amount: i.amount })) },
      },
      include: { items: true },
    });

    for (const item of items) {
      const p = products.find((p) => p.id === String(item.productId))!;
      await tx.product.update({ where: { id: p.id }, data: { stockQuantity: { decrement: Number(item.quantity) } } });
    }

    if (data.customerId) {
      await tx.customer.update({ where: { id: String(data.customerId) }, data: { totalPurchases: { increment: grandTotal } } });
    }

    return inv;
  });

  // === AUTO-CREATE LEDGER TRANSACTIONS ===
  // Helper: try insert with payment_method, fall back without
  const safeInsert = async (tableData: Record<string, any>) => {
    let r = await rawInsert("transactions", { ...tableData, payment_method: tableData.payment_method || "cash" });
    if (!r) r = await rawInsert("transactions", tableData);
    return r;
  };

  // If credit customer (walk-in), create a customer record + link it
  let linkedCustomerId = data.customerId ? String(data.customerId) : null;
  if (!linkedCustomerId && data.customerPhone && data.customerLocation) {
    // Create a new customer record for the credit customer
    const newCust = await rawInsert("customers", {
      name: customerName,
      phone: String(data.customerPhone),
      city: String(data.customerLocation),
      gstin: "",
      total_purchases: grandTotal,
    });
    if (newCust) {
      linkedCustomerId = newCust.id;
    }
  }

  // Credit the full invoice amount (customer owes this) — linked to customer
  await safeInsert({
    party_type: "customer",
    party_id: linkedCustomerId,
    party_name: customerName,
    type: "credit",
    amount: grandTotal,
    description: `Invoice ${invoice.invoiceNo}`,
    transaction_date: todayISO(),
    reference_type: "invoice",
    reference_id: invoice.id,
    payment_method: "cash",
  });

  // Process payments
  const payments = Array.isArray(data.payments) ? data.payments : [];
  if (payments.length === 0 && data.paidAmount) {
    payments.push({ method: data.paymentMethod || "cash", amount: Number(data.paidAmount) });
  }
  if (data.financeAmount > 0) {
    payments.push({ method: "bank_finance", amount: Number(data.financeAmount) });
  }

  for (const p of payments) {
    if (p.amount > 0) {
      await safeInsert({
        party_type: "customer",
        party_id: linkedCustomerId,
        party_name: customerName,
        type: "debit",
        amount: Number(p.amount),
        description: `Payment for ${invoice.invoiceNo} (${p.method})`,
        transaction_date: todayISO(),
        reference_type: "payment",
        reference_id: invoice.id,
        payment_method: p.method,
      });
    }
  }

  return NextResponse.json(invoice, { status: 201 });
}

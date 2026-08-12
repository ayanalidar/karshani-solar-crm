import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("invoices", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const count = (await fetchAll("invoices", undefined, 1)).length;
  const invoiceNo = data.invoiceNo || `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const items = Array.isArray(data.items) ? data.items : [];

  let subtotal = Number(data.subtotal || 0);
  let gstTotal = Number(data.gstTotal || 0);
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((s: number, i: any) => s + Number(i.amount || i.quantity * i.unitPrice || 0), 0);
    gstTotal = items.reduce((s: number, i: any) => s + (Number(i.amount || i.quantity * i.unitPrice || 0) * Number(i.gstPercentage || 0)) / 100, 0);
  }
  const grandTotal = subtotal + gstTotal;

  const insertData = {
    invoice_no: invoiceNo,
    customer_name: String(data.customerName || "").trim(),
    description: String(data.description || "").trim(),
    subtotal,
    gst_total: gstTotal,
    grand_total: grandTotal,
    invoice_date: String(data.invoiceDate || todayISO()),
    due_date: String(data.dueDate || ""),
    status: String(data.status || "due").trim(),
    ...(data.customerId && { customer_id: String(data.customerId) }),
  };

  const row = await rawInsert("invoices", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });

  // Insert items
  const invoiceId = row.id;
  for (const item of items) {
    await rawInsert("invoice_items", {
      invoice_id: invoiceId,
      item_name: String(item.itemName || "").trim(),
      hsn_code: String(item.hsnCode || "").trim(),
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unitPrice || 0),
      gst_percentage: Number(item.gstPercentage || 0),
      amount: Number(item.amount || Number(item.quantity || 1) * Number(item.unitPrice || 0)),
    });
  }

  return NextResponse.json(toCamel(row), { status: 201 });
}

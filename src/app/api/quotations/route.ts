import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("quotations", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const count = (await fetchAll("quotations", undefined, 1)).length;
  const estimateNo = data.estimateNo || `EST-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const items = Array.isArray(data.items) ? data.items : [];

  let subtotal = Number(data.subtotal || 0);
  let gstTotal = Number(data.gstTotal || 0);
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((s: number, i: any) => s + Number(i.amount || i.quantity * i.unitPrice || 0), 0);
    gstTotal = items.reduce((s: number, i: any) => s + (Number(i.amount || i.quantity * i.unitPrice || 0) * Number(i.gstPercentage || 0)) / 100, 0);
  }
  const grandTotal = subtotal + gstTotal;

  const insertData = {
    estimate_no: estimateNo,
    customer_name: String(data.customerName || "").trim(),
    customer_phone: String(data.customerPhone || "").trim(),
    customer_location: String(data.customerLocation || "").trim(),
    system_description: String(data.systemDescription || "").trim(),
    subtotal,
    gst_total: gstTotal,
    grand_total: grandTotal,
    quote_date: String(data.quoteDate || todayISO()),
    status: String(data.status || "sent").trim(),
    ...(data.customerId && { customer_id: String(data.customerId) }),
  };

  const row = await rawInsert("quotations", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });

  // Insert items
  const quotationId = row.id;
  for (const item of items) {
    await rawInsert("quotation_items", {
      quotation_id: quotationId,
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

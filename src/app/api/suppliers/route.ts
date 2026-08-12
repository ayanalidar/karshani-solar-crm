import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("supplier_orders", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    po_number: String(data.poNumber || `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`),
    supplier_name: String(data.supplierName || "").trim(),
    items: String(data.items || "").trim(),
    amount: Number(data.amount || 0),
    order_date: String(data.orderDate || todayISO()),
    status: String(data.status || "pending").trim(),
  };

  const row = await rawInsert("supplier_orders", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

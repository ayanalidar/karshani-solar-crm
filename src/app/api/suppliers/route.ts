import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let orders = await prisma.supplierOrder.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!orders || orders.length === 0) {
    const rows = await rawSelect("supplier_orders", "created_at.desc", 100);
    if (rows) orders = toCamelArray(rows) as any;
  }
  return NextResponse.json(orders || []);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    poNumber: String(data.poNumber || `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`),
    supplierName: String(data.supplierName || "").trim(),
    items: String(data.items || "").trim(),
    amount: Number(data.amount || 0),
    orderDate: String(data.orderDate || todayISO()),
    status: String(data.status || "pending").trim(),
  };

  let order = await prisma.supplierOrder.create({ data: insertData });
  if (!order) {
    const row = await rawInsert("supplier_orders", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    order = toCamel(row) as any;
  }
  return NextResponse.json(order, { status: 201 });
}

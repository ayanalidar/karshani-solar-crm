import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("enquiries", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customer_name: String(data.customerName || "").trim(),
    phone: String(data.phone || "").trim(),
    source: String(data.source || "walk-in").trim(),
    system_description: String(data.systemDescription || "").trim(),
    estimated_amount: Number(data.estimatedAmount || 0),
    status: String(data.status || "new").trim(),
    notes: String(data.notes || "").trim(),
    ...(data.customerId && { customer_id: String(data.customerId) }),
  };

  const row = await rawInsert("enquiries", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

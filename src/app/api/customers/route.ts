import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("customers", "name.asc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  if (!String(data.name || "").trim()) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }

  const insertData = {
    name: String(data.name).trim(),
    phone: String(data.phone || "").trim(),
    city: String(data.city || "").trim(),
    gstin: String(data.gstin || "").trim().toUpperCase(),
    total_purchases: Number(data.totalPurchases || 0),
  };

  const row = await rawInsert("customers", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

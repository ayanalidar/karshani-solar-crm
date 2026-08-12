import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";

// PRIMARY: Supabase REST API (HTTPS, unlimited connections)
// No more Prisma pg Pool (port 5432, 15-connection limit) for reads.
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("products", "category.asc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  if (!String(data.name || "").trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  if (!String(data.category || "").trim()) {
    return NextResponse.json({ error: "Product category is required" }, { status: 400 });
  }

  const insertData = {
    name: String(data.name).trim(),
    category: String(data.category).trim(),
    brand: String(data.brand || "").trim(),
    spec: String(data.spec || "").trim(),
    hsn_code: String(data.hsnCode || "").trim(),
    unit_price: Number(data.unitPrice || 0),
    gst_percentage: Number(data.gstPercentage || 0),
    stock_quantity: Number(data.stockQuantity || 0),
  };

  const row = await rawInsert("products", insertData);
  if (!row) {
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }
  return NextResponse.json(toCamel(row), { status: 201 });
}

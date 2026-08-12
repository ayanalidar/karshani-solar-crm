import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let products = await prisma.product.findMany({ orderBy: { category: "asc" }, take: 100 });
  // If Prisma returned empty (pool exhausted), try REST API fallback
  if (!products || products.length === 0) {
    const rows = await rawSelect("products", "category.asc", 100);
    if (rows) products = toCamelArray(rows) as any;
  }
  return NextResponse.json(products || []);
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
    hsnCode: String(data.hsnCode || "").trim(),
    unitPrice: Number(data.unitPrice || 0),
    gstPercentage: Number(data.gstPercentage || 0),
    stockQuantity: Number(data.stockQuantity || 0),
  };

  // Try Prisma first, then REST API fallback
  let product = await prisma.product.create({ data: insertData });
  if (!product) {
    const row = await rawInsert("products", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    product = toCamel(row) as any;
  }
  return NextResponse.json(product, { status: 201 });
}

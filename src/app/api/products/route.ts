import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, toSnake, toCamel } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const products = await prisma.product.findMany({ orderBy: { category: "asc" }, take: 100 });
  return NextResponse.json(products);
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

  // Try Prisma first
  let product = await prisma.product.create({
    data: {
      name: String(data.name).trim(),
      category: String(data.category).trim(),
      brand: String(data.brand || "").trim(),
      spec: String(data.spec || "").trim(),
      hsnCode: String(data.hsnCode || "").trim(),
      unitPrice: Number(data.unitPrice || 0),
      gstPercentage: Number(data.gstPercentage || 0),
      stockQuantity: Number(data.stockQuantity || 0),
    },
  });

  // If Prisma failed (safeWrap returned null), fall back to raw SQL
  if (!product) {
    const row = await rawInsert("products", toSnake({
      name: String(data.name).trim(),
      category: String(data.category).trim(),
      brand: String(data.brand || "").trim(),
      spec: String(data.spec || "").trim(),
      hsnCode: String(data.hsnCode || "").trim(),
      unitPrice: Number(data.unitPrice || 0),
      gstPercentage: Number(data.gstPercentage || 0),
      stockQuantity: Number(data.stockQuantity || 0),
    }));
    if (!row) {
      return NextResponse.json(
        { error: "Failed to save product. The database connection may be busy — please try again." },
        { status: 500 }
      );
    }
    product = toCamel(row) as any;
  }

  return NextResponse.json(product, { status: 201 });
}

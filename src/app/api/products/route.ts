import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const product = await prisma.product.create({
    data: {
      name: String(data.name || "").trim(),
      category: String(data.category || "").trim(),
      brand: String(data.brand || "").trim(),
      spec: String(data.spec || "").trim(),
      hsnCode: String(data.hsnCode || "").trim(),
      unitPrice: Number(data.unitPrice || 0),
      gstPercentage: Number(data.gstPercentage || 0),
      stockQuantity: Number(data.stockQuantity || 0),
    },
  });
  return NextResponse.json(product, { status: 201 });
}

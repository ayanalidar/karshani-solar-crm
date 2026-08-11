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

  // Validate required fields before calling Prisma — gives the user
  // a useful error message instead of a silent safeWrap null.
  if (!String(data.name || "").trim()) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  }
  if (!String(data.category || "").trim()) {
    return NextResponse.json({ error: "Product category is required" }, { status: 400 });
  }

  const product = await prisma.product.create({
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

  // safeWrap returns null on DB failure — surface as a 500 so the
  // client UI can show "Failed to save" instead of silently succeeding.
  if (!product) {
    return NextResponse.json(
      { error: "Failed to save product. Check that DATABASE_URL is set on Vercel." },
      { status: 500 }
    );
  }

  return NextResponse.json(product, { status: 201 });
}

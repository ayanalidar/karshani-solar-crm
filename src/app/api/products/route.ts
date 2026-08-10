import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const data = await request.json();
  const product = await prisma.product.create({ data });
  return NextResponse.json(product, { status: 201 });
}

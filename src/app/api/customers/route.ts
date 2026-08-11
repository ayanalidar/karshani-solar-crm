import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const customer = await prisma.customer.create({
    data: {
      name: String(data.name || "").trim(),
      phone: String(data.phone || "").trim(),
      city: String(data.city || "").trim(),
      gstin: String(data.gstin || "").trim().toUpperCase(),
      totalPurchases: Number(data.totalPurchases || 0),
    },
  });
  return NextResponse.json(customer, { status: 201 });
}

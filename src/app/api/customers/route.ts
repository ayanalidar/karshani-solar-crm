import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, toSnake, toCamel } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, take: 100 });
  return NextResponse.json(customers);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  if (!String(data.name || "").trim()) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }

  let customer = await prisma.customer.create({
    data: {
      name: String(data.name).trim(),
      phone: String(data.phone || "").trim(),
      city: String(data.city || "").trim(),
      gstin: String(data.gstin || "").trim().toUpperCase(),
      totalPurchases: Number(data.totalPurchases || 0),
    },
  });

  if (!customer) {
    const row = await rawInsert("customers", toSnake({
      name: String(data.name).trim(),
      phone: String(data.phone || "").trim(),
      city: String(data.city || "").trim(),
      gstin: String(data.gstin || "").trim().toUpperCase(),
      totalPurchases: Number(data.totalPurchases || 0),
    }));
    if (!row) {
      return NextResponse.json(
        { error: "Failed to save customer. The database connection may be busy — please try again." },
        { status: 500 }
      );
    }
    customer = toCamel(row) as any;
  }

  return NextResponse.json(customer, { status: 201 });
}

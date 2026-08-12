import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, take: 100 });
  if (!customers || customers.length === 0) {
    const rows = await rawSelect("customers", "name.asc", 100);
    if (rows) customers = toCamelArray(rows) as any;
  }
  return NextResponse.json(customers || []);
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
    totalPurchases: Number(data.totalPurchases || 0),
  };

  let customer = await prisma.customer.create({ data: insertData });
  if (!customer) {
    const row = await rawInsert("customers", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    customer = toCamel(row) as any;
  }
  return NextResponse.json(customer, { status: 201 });
}

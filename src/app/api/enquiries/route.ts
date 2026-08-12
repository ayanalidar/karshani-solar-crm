import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, toSnake, toCamel } from "@/lib/raw-db";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(enquiries);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customerName: String(data.customerName || "").trim(),
    phone: String(data.phone || "").trim(),
    source: String(data.source || "walk-in").trim(),
    systemDescription: String(data.systemDescription || "").trim(),
    estimatedAmount: Number(data.estimatedAmount || 0),
    status: String(data.status || "new").trim(),
    notes: String(data.notes || "").trim(),
    ...(data.customerId && { customerId: String(data.customerId) }),
  };

  let enquiry = await prisma.enquiry.create({ data: insertData });

  if (!enquiry) {
    const row = await rawInsert("enquiries", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    enquiry = toCamel(row) as any;
  }

  return NextResponse.json(enquiry, { status: 201 });
}

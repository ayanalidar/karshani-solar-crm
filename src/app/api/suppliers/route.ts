import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const orders = await prisma.supplierOrder.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const count = await prisma.supplierOrder.count();
  const poNumber = data.poNumber || `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  const order = await prisma.supplierOrder.create({
    data: {
      poNumber,
      supplierName: String(data.supplierName || "").trim(),
      items: String(data.items || "").trim(),
      amount: Number(data.amount || 0),
      orderDate: String(data.orderDate || todayISO()),
      status: String(data.status || "pending").trim(),
    },
  });
  return NextResponse.json(order, { status: 201 });
}

import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  // List view: fetch only quotation fields (no items) to reduce egress.
  // Items are fetched separately on the detail page.
  const quotations = await prisma.quotation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      estimateNo: true,
      customerName: true,
      customerPhone: true,
      customerLocation: true,
      systemDescription: true,
      subtotal: true,
      gstTotal: true,
      grandTotal: true,
      quoteDate: true,
      status: true,
      createdAt: true,
      customerId: true,
      printedAt: true,
      printCount: true,
    },
  });
  return NextResponse.json(quotations);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  // Generate next estimate number: EST-YYYY-NNNN
  const count = await prisma.quotation.count();
  const estimateNo = `EST-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const items = Array.isArray(data.items) ? data.items : [];

  // Compute totals if not provided
  let subtotal = Number(data.subtotal || 0);
  let gstTotal = Number(data.gstTotal || 0);
  if (subtotal === 0 && items.length > 0) {
    subtotal = items.reduce((s: number, i: any) => s + Number(i.amount || i.quantity * i.unitPrice || 0), 0);
    gstTotal = items.reduce(
      (s: number, i: any) => s + (Number(i.amount || i.quantity * i.unitPrice || 0) * Number(i.gstPercentage || 0)) / 100,
      0
    );
  }
  const grandTotal = subtotal + gstTotal;

  const quotation = await prisma.quotation.create({
    data: {
      estimateNo,
      customerName: String(data.customerName || "").trim(),
      customerPhone: String(data.customerPhone || "").trim(),
      customerLocation: String(data.customerLocation || "").trim(),
      systemDescription: String(data.systemDescription || "").trim(),
      subtotal,
      gstTotal,
      grandTotal,
      quoteDate: String(data.quoteDate || todayISO()),
      status: String(data.status || "sent").trim(),
      ...(data.customerId && { customerId: String(data.customerId) }),
      items: {
        create: items.map((i: any) => ({
          itemName: String(i.itemName || "").trim(),
          hsnCode: String(i.hsnCode || "").trim(),
          quantity: Number(i.quantity || 1),
          unitPrice: Number(i.unitPrice || 0),
          gstPercentage: Number(i.gstPercentage || 0),
          amount: Number(i.amount || Number(i.quantity || 1) * Number(i.unitPrice || 0)),
        })),
      },
    },
    include: { items: true },
  });
  return NextResponse.json(quotation, { status: 201 });
}

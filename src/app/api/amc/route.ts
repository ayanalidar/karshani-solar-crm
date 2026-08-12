import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const contracts = await prisma.amcContract.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(contracts);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const contract = await prisma.amcContract.create({
    data: {
      customerName: String(data.customerName || "").trim(),
      system: String(data.system || "").trim(),
      contractType: String(data.contractType || "AMC").trim(),
      startDate: String(data.startDate || todayISO()),
      expiryDate: String(data.expiryDate || todayISO()),
    },
  });
  return NextResponse.json(contract, { status: 201 });
}

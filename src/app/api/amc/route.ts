import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let contracts = await prisma.amcContract.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!contracts || contracts.length === 0) {
    const rows = await rawSelect("amc_contracts", "created_at.desc", 100);
    if (rows) contracts = toCamelArray(rows) as any;
  }
  return NextResponse.json(contracts || []);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customerName: String(data.customerName || "").trim(),
    system: String(data.system || "").trim(),
    contractType: String(data.contractType || "AMC").trim(),
    startDate: String(data.startDate || todayISO()),
    expiryDate: String(data.expiryDate || todayISO()),
  };

  let contract = await prisma.amcContract.create({ data: insertData });
  if (!contract) {
    const row = await rawInsert("amc_contracts", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    contract = toCamel(row) as any;
  }
  return NextResponse.json(contract, { status: 201 });
}

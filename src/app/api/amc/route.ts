import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("amc_contracts", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customer_name: String(data.customerName || "").trim(),
    system: String(data.system || "").trim(),
    contract_type: String(data.contractType || "AMC").trim(),
    start_date: String(data.startDate || todayISO()),
    expiry_date: String(data.expiryDate || todayISO()),
  };

  const row = await rawInsert("amc_contracts", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

// GET /api/transactions — list all transactions, optionally filtered by partyType or date
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const url = new URL(request.url);
  const partyType = url.searchParams.get("partyType"); // 'customer' or 'supplier'
  const partyId = url.searchParams.get("partyId");
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  let rows = await fetchAll("transactions", "transaction_date.desc", 500);

  // Filter
  if (partyType) rows = rows.filter((r: any) => r.party_type === partyType);
  if (partyId) rows = rows.filter((r: any) => r.party_id === partyId);
  if (fromDate) rows = rows.filter((r: any) => r.transaction_date >= fromDate);
  if (toDate) rows = rows.filter((r: any) => r.transaction_date <= toDate);

  return NextResponse.json(toCamelArray(rows));
}

// POST /api/transactions — create a new transaction (credit/debit)
export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  if (!String(data.partyName || "").trim()) {
    return NextResponse.json({ error: "Party name is required" }, { status: 400 });
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const insertData = {
    party_type: String(data.partyType || "customer").trim(),
    party_id: data.partyId ? String(data.partyId) : null,
    party_name: String(data.partyName).trim(),
    type: String(data.type || "credit").trim(), // credit = they owe us, debit = they paid
    amount: Number(data.amount),
    description: String(data.description || "").trim(),
    transaction_date: String(data.transactionDate || todayISO()),
    reference_type: String(data.referenceType || "manual").trim(),
    reference_id: data.referenceId ? String(data.referenceId) : null,
  };

  const row = await rawInsert("transactions", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

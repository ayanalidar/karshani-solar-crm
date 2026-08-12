import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("installations", "created_at.desc", 100);
  return NextResponse.json(toCamelArray(rows));
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customer_name: String(data.customerName || "").trim(),
    system_description: String(data.systemDescription || "").trim(),
    install_date: String(data.installDate || todayISO()),
    stage: String(data.stage || "scheduled").trim(),
    team: String(data.team || "").trim(),
    notes: String(data.notes || "").trim(),
    ...(data.customerId && { customer_id: String(data.customerId) }),
  };

  const row = await rawInsert("installations", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

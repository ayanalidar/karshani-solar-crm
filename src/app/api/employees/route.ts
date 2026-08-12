import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const rows = await fetchAll("employees", "created_at.desc", 100);
  // Convert active from boolean to "true"/"false" for the form
  const result = toCamelArray(rows).map((e: any) => ({
    ...e,
    active: e.active ? "true" : "false",
  }));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    name: String(data.name || "").trim(),
    role: String(data.role || "").trim(),
    phone: String(data.phone || "").trim(),
    salary: Number(data.salary || 0),
    join_date: String(data.joinDate || todayISO()),
    active: data.active !== undefined ? Boolean(data.active) : true,
  };

  const row = await rawInsert("employees", insertData);
  if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  return NextResponse.json(toCamel(row), { status: 201 });
}

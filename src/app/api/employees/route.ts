import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!employees || employees.length === 0) {
    const rows = await rawSelect("employees", "created_at.desc", 100);
    if (rows) employees = toCamelArray(rows) as any;
  }
  return NextResponse.json(employees || []);
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
    joinDate: String(data.joinDate || todayISO()),
    active: data.active !== undefined ? Boolean(data.active) : true,
  };

  let employee = await prisma.employee.create({ data: insertData });
  if (!employee) {
    const row = await rawInsert("employees", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    employee = toCamel(row) as any;
  }
  return NextResponse.json(employee, { status: 201 });
}

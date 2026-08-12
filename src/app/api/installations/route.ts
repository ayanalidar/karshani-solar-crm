import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawInsert, rawSelect, toSnake, toCamel, toCamelArray } from "@/lib/raw-db";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  let installations = await prisma.installation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  if (!installations || installations.length === 0) {
    const rows = await rawSelect("installations", "created_at.desc", 100);
    if (rows) installations = toCamelArray(rows) as any;
  }
  return NextResponse.json(installations || []);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();

  const insertData = {
    customerName: String(data.customerName || "").trim(),
    systemDescription: String(data.systemDescription || "").trim(),
    installDate: String(data.installDate || todayISO()),
    stage: String(data.stage || "scheduled").trim(),
    team: String(data.team || "").trim(),
    notes: String(data.notes || "").trim(),
    ...(data.customerId && { customerId: String(data.customerId) }),
  };

  let install = await prisma.installation.create({ data: insertData });
  if (!install) {
    const row = await rawInsert("installations", toSnake(insertData));
    if (!row) return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    install = toCamel(row) as any;
  }
  return NextResponse.json(install, { status: 201 });
}

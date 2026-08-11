import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const employee = await prisma.employee.create({
    data: {
      name: String(data.name || "").trim(),
      role: String(data.role || "").trim(),
      phone: String(data.phone || "").trim(),
      salary: Number(data.salary || 0),
      joinDate: String(data.joinDate || todayISO()),
      active: data.active !== undefined ? Boolean(data.active) : true,
    },
  });
  return NextResponse.json(employee, { status: 201 });
}

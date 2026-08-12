import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { todayISO } from "@/lib/format";

export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const installations = await prisma.installation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(installations);
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const data = await request.json();
  const install = await prisma.installation.create({
    data: {
      customerName: String(data.customerName || "").trim(),
      systemDescription: String(data.systemDescription || "").trim(),
      installDate: String(data.installDate || todayISO()),
      stage: String(data.stage || "scheduled").trim(),
      team: String(data.team || "").trim(),
      notes: String(data.notes || "").trim(),
      ...(data.customerId && { customerId: String(data.customerId) }),
    },
  });
  return NextResponse.json(install, { status: 201 });
}

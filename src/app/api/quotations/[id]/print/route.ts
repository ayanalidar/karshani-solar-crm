import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

// POST /api/quotations/[id]/print
// Records a print event — increments printCount + sets printedAt to now.
// Used by the "Print" and "Reprint" buttons on the quotation detail page.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;

  try {
    const updated = await prisma.quotation.update({
      where: { id },
      data: {
        printCount: { increment: 1 },
        printedAt: new Date(),
      },
      select: { id: true, printCount: true, printedAt: true },
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Quotation not found or DB error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      printCount: updated.printCount,
      printedAt: updated.printedAt,
    });
  } catch (err: any) {
    // If the printed_at/print_count columns don't exist yet, return a
    // helpful error pointing to scripts/add-print-columns.sql
    if (err?.message?.includes("column") || err?.message?.includes("does not exist")) {
      return NextResponse.json(
        {
          error: "Print tracking columns not added to database yet. Run scripts/setup-supabase.sql in Supabase SQL Editor (includes printed_at + print_count columns).",
          hint: "https://supabase.com/dashboard/project/ayiwltqmxbvurxoqyvbw/sql/new",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}

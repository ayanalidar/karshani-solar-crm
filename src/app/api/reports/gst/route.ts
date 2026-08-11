import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

// GET /api/reports/gst?fy=2026 (Indian financial year April-March)
// Returns quarterly GST breakdown from paid invoices
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const url = new URL(request.url);
  const fyParam = url.searchParams.get("fy");
  const year = fyParam ? Number(fyParam) : new Date().getFullYear();

  // Indian FY: April 1 of `year` to March 31 of `year+1`
  // Quarters: Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
  const fyStart = `${year}-04-01`;
  const fyEnd = `${year + 1}-03-31`;

  const invoices = await prisma.invoice.findMany({
    where: {
      status: "paid",
      invoiceDate: { gte: fyStart, lte: fyEnd },
    },
    include: { items: true },
  });

  const quarters = [
    { id: "Q1", label: `Q1 (Apr–Jun ${year})`, start: `${year}-04-01`, end: `${year}-06-30` },
    { id: "Q2", label: `Q2 (Jul–Sep ${year})`, start: `${year}-07-01`, end: `${year}-09-30` },
    { id: "Q3", label: `Q3 (Oct–Dec ${year})`, start: `${year}-10-01`, end: `${year}-12-31` },
    { id: "Q4", label: `Q4 (Jan–Mar ${year + 1})`, start: `${year + 1}-01-01`, end: `${year + 1}-03-31` },
  ];

  const quarterly = quarters.map((q) => {
    const inQ = invoices.filter((inv) => inv.invoiceDate >= q.start && inv.invoiceDate <= q.end);
    const invoiceCount = inQ.length;
    const taxableValue = inQ.reduce((s, i) => s + i.subtotal, 0);
    const gstCollected = inQ.reduce((s, i) => s + i.gstTotal, 0);

    // Breakdown by GST slab across all line items in this quarter
    const slabMap: Record<number, { taxable: number; gst: number }> = {};
    for (const inv of inQ) {
      for (const item of inv.items) {
        const slab = item.gstPercentage;
        if (!slabMap[slab]) slabMap[slab] = { taxable: 0, gst: 0 };
        slabMap[slab].taxable += item.amount;
        slabMap[slab].gst += (item.amount * slab) / 100;
      }
    }

    return {
      id: q.id,
      label: q.label,
      invoiceCount,
      taxableValue,
      gstCollected,
      slabs: Object.entries(slabMap)
        .map(([slab, v]) => ({ slab: Number(slab), ...v }))
        .sort((a, b) => a.slab - b.slab),
    };
  });

  const total = {
    invoiceCount: invoices.length,
    taxableValue: quarterly.reduce((s, q) => s + q.taxableValue, 0),
    gstCollected: quarterly.reduce((s, q) => s + q.gstCollected, 0),
  };

  return NextResponse.json({ fy: year, fyStart, fyEnd, quarterly, total });
}

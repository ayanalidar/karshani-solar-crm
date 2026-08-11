import { prisma } from "@/lib/db";
import { GstReportView } from "./GstReportView";

export const dynamic = "force-dynamic";

type Slab = { slab: number; taxable: number; gst: number };
type Quarter = {
  id: string;
  label: string;
  invoiceCount: number;
  taxableValue: number;
  gstCollected: number;
  slabs: Slab[];
};
type GstReport = {
  fy: number;
  fyStart: string;
  fyEnd: string;
  quarterly: Quarter[];
  total: { invoiceCount: number; taxableValue: number; gstCollected: number };
};

function computeReport(year: number, invoices: any[]): GstReport {
  const fyStart = `${year}-04-01`;
  const fyEnd = `${year + 1}-03-31`;

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

    const slabMap: Record<number, { taxable: number; gst: number }> = {};
    for (const inv of inQ) {
      for (const item of inv.items || []) {
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

  return {
    fy: year,
    fyStart,
    fyEnd,
    quarterly,
    total: {
      invoiceCount: invoices.length,
      taxableValue: quarterly.reduce((s, q) => s + q.taxableValue, 0),
      gstCollected: quarterly.reduce((s, q) => s + q.gstCollected, 0),
    },
  };
}

export default async function GstReportPage() {
  const year = new Date().getFullYear();

  let invoices: any[] = [];
  try {
    invoices = await prisma.invoice.findMany({
      where: {
        status: "paid",
        invoiceDate: { gte: `${year}-04-01`, lte: `${year + 1}-03-31` },
      },
      include: { items: true },
    });
  } catch {
    invoices = [];
  }

  const initialData = computeReport(year, invoices);
  return <GstReportView initialData={initialData} />;
}

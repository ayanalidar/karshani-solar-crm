import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";
import { fiscalYearPrefix } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!q) notFound();

  // Use fiscal-year numbering in the proforma (matches sample: 2026-27/210)
  // Fall back to estimateNo if it already looks like a fiscal-year number.
  const fyPrefix = fiscalYearPrefix(new Date(q.quoteDate));
  const docNo = /\d{4}-\d{2}\/\d+/.test(q.estimateNo) ? q.estimateNo : `${fyPrefix}/${q.estimateNo.split("-").pop()}`;

  const data: ProformaData = {
    docNo,
    date: q.quoteDate,
    customerName: q.customerName,
    customerPhone: q.customerPhone,
    customerLocation: q.customerLocation,
    systemDescription: q.systemDescription,
    items: q.items.map((i) => ({
      id: i.id,
      itemName: i.itemName,
      hsnCode: i.hsnCode,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      gstPercentage: i.gstPercentage,
      amount: i.amount,
    })),
    subtotal: q.subtotal,
    gstTotal: q.gstTotal,
    grandTotal: q.grandTotal,
  };

  return <ProformaView data={data} kind="proforma" />;
}

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";
import { fiscalYearPrefix } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationPdfPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "true" || print === "1";

  // Use findFirst + separate items query instead of findUnique + include
  const q = await prisma.quotation.findFirst({ where: { id } });
  if (!q) notFound();

  const items = await prisma.quotationItem.findMany({ where: { quotationId: id } });

  // Use fiscal-year numbering in the proforma (matches sample: 2026-27/210)
  const fyPrefix = fiscalYearPrefix(new Date(q.quoteDate));
  const docNo = /\d{4}-\d{2}\/\d+/.test(q.estimateNo) ? q.estimateNo : `${fyPrefix}/${q.estimateNo.split("-").pop()}`;

  const data: ProformaData = {
    docNo,
    date: q.quoteDate,
    customerName: q.customerName,
    customerPhone: q.customerPhone,
    customerLocation: q.customerLocation,
    systemDescription: q.systemDescription,
    items: items.map((i) => ({
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

  return (
    <ProformaView
      data={data}
      kind="proforma"
      autoPrint={autoPrint}
      recordPrintUrl={`/api/quotations/${id}/print`}
    />
  );
}

import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";
import { fiscalYearPrefix } from "@/lib/format";
import { fetchOne, fetchBy, toCamel } from "@/lib/raw-db";

export const dynamic = "force-dynamic";

export default async function QuotationPdfPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "true" || print === "1";

  // Use Supabase REST API (HTTPS) — no pg Pool, no connection limit
  const row = await fetchOne("quotations", id);
  if (!row) notFound();

  const itemRows = await fetchBy("quotation_items", "quotation_id", id, "created_at.asc", 100);

  const q = toCamel(row);
  const items = itemRows.map((i: any) => toCamel(i));

  const fyPrefix = fiscalYearPrefix(new Date(q.quoteDate));
  const docNo = /\d{4}-\d{2}\/\d+/.test(q.estimateNo) ? q.estimateNo : `${fyPrefix}/${q.estimateNo.split("-").pop()}`;

  const data: ProformaData = {
    docNo,
    date: q.quoteDate,
    customerName: q.customerName,
    customerPhone: q.customerPhone,
    customerLocation: q.customerLocation,
    systemDescription: q.systemDescription,
    items: items.map((i: any) => ({
      id: i.id,
      itemName: i.itemName,
      hsnCode: i.hsnCode,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      gstPercentage: Number(i.gstPercentage),
      amount: Number(i.amount),
    })),
    subtotal: Number(q.subtotal),
    gstTotal: Number(q.gstTotal),
    grandTotal: Number(q.grandTotal),
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

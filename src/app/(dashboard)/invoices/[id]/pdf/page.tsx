import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";
import { fetchOne, fetchBy, toCamel } from "@/lib/raw-db";

export const dynamic = "force-dynamic";

export default async function InvoicePdfPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "true" || print === "1";

  // Use Supabase REST API (HTTPS) — no pg Pool, no connection limit
  const row = await fetchOne("invoices", id);
  if (!row) notFound();

  const itemRows = await fetchBy("invoice_items", "invoice_id", id, "created_at.asc", 100);

  const inv = toCamel(row);
  const items = itemRows.map((i: any) => toCamel(i));

  const data: ProformaData = {
    docNo: inv.invoiceNo,
    date: inv.invoiceDate,
    dueDate: inv.dueDate || undefined,
    customerName: inv.customerName,
    systemDescription: inv.description,
    status: inv.status,
    items: items.map((i: any) => ({
      id: i.id,
      itemName: i.itemName,
      hsnCode: i.hsnCode,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      gstPercentage: Number(i.gstPercentage),
      amount: Number(i.amount),
    })),
    subtotal: Number(inv.subtotal),
    gstTotal: Number(inv.gstTotal),
    grandTotal: Number(inv.grandTotal),
  };

  return (
    <ProformaView
      data={data}
      kind="tax-invoice"
      autoPrint={autoPrint}
      recordPrintUrl={`/api/invoices/${id}/print`}
    />
  );
}

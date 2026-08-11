import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";

export const dynamic = "force-dynamic";

export default async function InvoicePdfPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "true" || print === "1";

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!inv) notFound();

  const data: ProformaData = {
    docNo: inv.invoiceNo,
    date: inv.invoiceDate,
    dueDate: inv.dueDate || undefined,
    customerName: inv.customerName,
    systemDescription: inv.description,
    status: inv.status,
    items: inv.items.map((i) => ({
      id: i.id,
      itemName: i.itemName,
      hsnCode: i.hsnCode,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      gstPercentage: i.gstPercentage,
      amount: i.amount,
    })),
    subtotal: inv.subtotal,
    gstTotal: inv.gstTotal,
    grandTotal: inv.grandTotal,
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

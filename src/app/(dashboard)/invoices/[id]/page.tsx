import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { InvoiceDetail } from "./InvoiceDetail";

export const dynamic = "force-dynamic";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Use findFirst + separate items query instead of findUnique + include
  const invoiceRow = await prisma.invoice.findFirst({ where: { id } });
  if (!invoiceRow) notFound();

  const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id } });
  const invoice = { ...invoiceRow, items };

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <InvoiceDetail invoice={invoice} baseUrl={baseUrl} />;
}

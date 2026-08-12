import { prisma } from "@/lib/db";
import { InvoicesList } from "./InvoicesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <InvoicesList invoices={invoices} />;
}

import { prisma } from "@/lib/db";
import { InvoicesList } from "./InvoicesList";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
  return <InvoicesList invoices={invoices} />;
}

import { prisma } from "@/lib/db";
import { QuotationsList } from "./QuotationsList";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" } });
  return <QuotationsList quotations={quotations} />;
}

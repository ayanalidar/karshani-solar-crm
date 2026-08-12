import { prisma } from "@/lib/db";
import { QuotationsList } from "./QuotationsList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <QuotationsList quotations={quotations} />;
}

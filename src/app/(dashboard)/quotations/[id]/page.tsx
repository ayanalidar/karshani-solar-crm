import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QuotationDetail } from "./QuotationDetail";

export const dynamic = "force-dynamic";

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Use findFirst + separate items query instead of findUnique + include
  // (PrismaPg adapter has issues with findUnique + include in some configs)
  const quotationRow = await prisma.quotation.findFirst({ where: { id } });
  if (!quotationRow) notFound();

  const items = await prisma.quotationItem.findMany({ where: { quotationId: id } });
  const quotation = { ...quotationRow, items };

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <QuotationDetail quotation={quotation} baseUrl={baseUrl} />;
}

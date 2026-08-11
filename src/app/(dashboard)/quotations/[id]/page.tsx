import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QuotationDetail } from "./QuotationDetail";

export const dynamic = "force-dynamic";

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!quotation) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <QuotationDetail quotation={quotation} baseUrl={baseUrl} />;
}

import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { InvoiceDetail } from "./InvoiceDetail";

export const dynamic = "force-dynamic";

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!invoice) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <InvoiceDetail invoice={invoice} baseUrl={baseUrl} />;
}

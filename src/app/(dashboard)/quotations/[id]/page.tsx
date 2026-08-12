import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { QuotationDetail } from "./QuotationDetail";
import { fetchOne, fetchBy, toCamel } from "@/lib/raw-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QuotationViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use Supabase REST API (HTTPS) — no pg Pool, no connection limit
  const row = await fetchOne("quotations", id);
  if (!row) notFound();

  const itemRows = await fetchBy("quotation_items", "quotation_id", id, "created_at.asc", 100);

  const quotation = {
    ...toCamel(row),
    items: itemRows.map((i: any) => toCamel(i)),
  };

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <QuotationDetail quotation={quotation as any} baseUrl={baseUrl} />;
}

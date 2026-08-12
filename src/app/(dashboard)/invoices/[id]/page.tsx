import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { InvoiceDetail } from "./InvoiceDetail";
import { fetchOne, fetchBy, toCamel } from "@/lib/raw-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use Supabase REST API (HTTPS) — no pg Pool, no connection limit
  const row = await fetchOne("invoices", id);
  if (!row) notFound();

  const itemRows = await fetchBy("invoice_items", "invoice_id", id, "created_at.asc", 100);

  const invoice = {
    ...toCamel(row),
    items: itemRows.map((i: any) => toCamel(i)),
  };

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return <InvoiceDetail invoice={invoice as any} baseUrl={baseUrl} />;
}

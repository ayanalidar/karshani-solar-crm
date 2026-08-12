import { Pool } from "pg";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { InvoiceDetail } from "./InvoiceDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let pool: Pool | null = null;
function getPool() {
  if (pool) return pool;
  const cs = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  if (!cs) return null;
  pool = new Pool({ connectionString: cs, max: 2, connectionTimeoutMillis: 10000 });
  return pool;
}

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getPool();
  if (!p) notFound();

  try {
    const res = await p.query("SELECT * FROM invoices WHERE id = $1", [id]);
    if (!res.rows || res.rows.length === 0) notFound();
    const row = res.rows[0];

    const itemsRes = await p.query("SELECT * FROM invoice_items WHERE invoice_id = $1", [id]);
    const items = itemsRes.rows.map((i: any) => ({
      id: i.id,
      itemName: i.item_name,
      hsnCode: i.hsn_code,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      gstPercentage: Number(i.gst_percentage),
      amount: Number(i.amount),
    }));

    const invoice = {
      id: row.id,
      invoiceNo: row.invoice_no,
      customerName: row.customer_name,
      description: row.description || "",
      subtotal: Number(row.subtotal),
      gstTotal: Number(row.gst_total),
      grandTotal: Number(row.grand_total),
      invoiceDate: row.invoice_date,
      dueDate: row.due_date || "",
      status: row.status,
      createdAt: row.created_at,
      customerId: row.customer_id,
      printedAt: row.printed_at,
      printCount: Number(row.print_count) || 0,
      items,
    };

    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
    const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    return <InvoiceDetail invoice={invoice} baseUrl={baseUrl} />;
  } catch (error) {
    console.error("[invoice-view] error:", error);
    notFound();
  }
}

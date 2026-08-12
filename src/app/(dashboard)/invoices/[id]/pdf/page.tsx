import { Pool } from "pg";
import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";

export const dynamic = "force-dynamic";

// Use a raw pg Pool directly — bypasses Prisma + safeWrap entirely.
// This is more reliable for server-rendered PDF pages on Vercel.
let pool: Pool | null = null;
function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  if (!connectionString) return null;
  pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
  return pool;
}

export default async function InvoicePdfPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const autoPrint = print === "true" || print === "1";

  const p = getPool();
  if (!p) {
    notFound();
  }

  try {
    // Fetch the invoice row directly via SQL
    const res = await p.query("SELECT * FROM invoices WHERE id = $1", [id]);
    if (!res.rows || res.rows.length === 0) {
      notFound();
    }
    const row = res.rows[0];

    // Fetch items
    const itemsRes = await p.query("SELECT * FROM invoice_items WHERE invoice_id = $1", [id]);
    const items = itemsRes.rows;

    const data: ProformaData = {
      docNo: row.invoice_no,
      date: row.invoice_date,
      dueDate: row.due_date || undefined,
      customerName: row.customer_name,
      systemDescription: row.description,
      status: row.status,
      items: items.map((i: any) => ({
        id: i.id,
        itemName: i.item_name,
        hsnCode: i.hsn_code,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        gstPercentage: i.gst_percentage,
        amount: i.amount,
      })),
      subtotal: Number(row.subtotal),
      gstTotal: Number(row.gst_total),
      grandTotal: Number(row.grand_total),
    };

    return (
      <ProformaView
        data={data}
        kind="tax-invoice"
        autoPrint={autoPrint}
        recordPrintUrl={`/api/invoices/${id}/print`}
      />
    );
  } catch (error) {
    console.error("[invoice-pdf] error:", error);
    notFound();
  }
}

import { Pool } from "pg";
import { notFound } from "next/navigation";
import { ProformaView, type ProformaData } from "@/components/ProformaView";
import { fiscalYearPrefix } from "@/lib/format";

export const dynamic = "force-dynamic";

// Use a raw pg Pool directly — bypasses Prisma + safeWrap entirely.
let pool: Pool | null = null;
function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
  if (!connectionString) return null;
  pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10000 });
  return pool;
}

export default async function QuotationPdfPage({ params, searchParams }: {
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
    // Fetch the quotation row directly via SQL
    const res = await p.query("SELECT * FROM quotations WHERE id = $1", [id]);
    if (!res.rows || res.rows.length === 0) {
      notFound();
    }
    const row = res.rows[0];

    // Fetch items
    const itemsRes = await p.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [id]);
    const items = itemsRes.rows;

    // Use fiscal-year numbering in the proforma (matches sample: 2026-27/210)
    const fyPrefix = fiscalYearPrefix(new Date(row.quote_date));
    const estimateNo = row.estimate_no;
    const docNo = /\d{4}-\d{2}\/\d+/.test(estimateNo) ? estimateNo : `${fyPrefix}/${estimateNo.split("-").pop()}`;

    const data: ProformaData = {
      docNo,
      date: row.quote_date,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerLocation: row.customer_location,
      systemDescription: row.system_description,
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
        kind="proforma"
        autoPrint={autoPrint}
        recordPrintUrl={`/api/quotations/${id}/print`}
      />
    );
  } catch (error) {
    console.error("[quotation-pdf] error:", error);
    notFound();
  }
}

import { notFound } from "next/navigation";
import { fetchOne, fetchBy, fetchAll, toCamel } from "@/lib/raw-db";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Use Supabase REST API (HTTPS) — no pg Pool, no connection limit
  const row = await fetchOne("customers", id);
  if (!row) notFound();

  const customer = toCamel(row);

  // Fetch relations via REST API
  const [enquiryRows, quotationRows, invoiceRows, installationRows] = await Promise.all([
    fetchBy("enquiries", "customer_id", id, "created_at.desc", 100),
    fetchBy("quotations", "customer_id", id, "created_at.desc", 100),
    fetchBy("invoices", "customer_id", id, "created_at.desc", 100),
    fetchBy("installations", "customer_id", id, "created_at.desc", 100),
  ]);

  const enquiries = enquiryRows.map(toCamel);
  const quotations = quotationRows.map(toCamel);
  const invoices = invoiceRows.map(toCamel);
  const installations = installationRows.map(toCamel);

  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);
  const totalDue = invoices.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);

  // Follow-up reminders
  const now = Date.now();
  const allDates = [
    ...enquiries.map((e: any) => new Date(e.createdAt).getTime()),
    ...quotations.map((q: any) => new Date(q.quoteDate).getTime()),
    ...invoices.map((i: any) => new Date(i.invoiceDate).getTime()),
    ...installations.map((i: any) => new Date(i.installDate).getTime()),
  ].filter((t: number) => !isNaN(t));
  const lastActivityAt = allDates.length > 0 ? Math.max(...allDates) : 0;
  const daysSince = lastActivityAt ? Math.floor((now - lastActivityAt) / 86400000) : null;
  const followUpStatus =
    daysSince === null ? { label: "No activity yet", color: "gray" }
    : daysSince < 30 ? { label: "Recent activity", color: "green" }
    : daysSince < 60 ? { label: `Follow up soon (${daysSince}d)`, color: "yellow" }
    : daysSince < 90 ? { label: `Follow up ASAP (${daysSince}d)`, color: "orange" }
    : { label: `URGENT follow-up (${daysSince}d)`, color: "red" };

  const waNumber = customer.phone?.replace(/[^0-9]/g, "") || "";
  const waText = `Hello ${customer.name}, this is Karshani Enterprises. How can we help you?`;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.length === 10 ? "91" + waNumber : waNumber}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const emailSubject = "Karshani Enterprises — Solar System Update";
  const emailBody = `Hello ${customer.name},\n\nThank you for choosing Karshani Enterprises.\n\n— Karshani Enterprises\nPhone: 9720669669`;
  const emailLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-sm text-[#787468] dark:text-[#a8a29e] hover:text-amber-700 dark:hover:text-amber-400">← Customers</Link>
          <h2 className="font-serif text-lg">{customer.name}</h2>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            followUpStatus.color === "green" ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900"
            : followUpStatus.color === "yellow" ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
            : followUpStatus.color === "orange" ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900"
            : followUpStatus.color === "red" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900"
            : "bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800"
          }`}>{followUpStatus.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {customer.phone && (
            <a href={waLink} target="_blank" rel="noreferrer" className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5">
              <span>💬</span> WhatsApp
            </a>
          )}
          <a href={emailLink} className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] text-[#1c1915] dark:text-[#f5efe5] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] dark:hover:bg-[#2a2620] flex items-center gap-1.5">
            <span>✉️</span> Email
          </a>
          <Link href={`/quotations/new?customerId=${customer.id}`} className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">
            + New Quotation
          </Link>
        </div>
      </div>

      <div className="grid gap-4 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">Contact</div>
          <div className="text-sm font-semibold">{customer.phone || "—"}</div>
          <div className="text-xs text-[#504d44] dark:text-[#d6cfc5]">{customer.city || "No city"}</div>
          {customer.gstin && <div className="text-[11px] font-mono text-[#504d44] dark:text-[#d6cfc5] mt-1">GSTIN: {customer.gstin}</div>}
        </div>
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">Total Invoiced</div>
          <div className="font-serif text-xl">{formatINR(totalInvoiced)}</div>
          <div className="text-[11px] text-green-700 dark:text-green-400 mt-1">Paid {formatINR(totalPaid)}</div>
        </div>
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">Outstanding</div>
          <div className="font-serif text-xl text-red-700 dark:text-red-400">{formatINR(totalDue)}</div>
          <div className="text-[11px] text-[#504d44] dark:text-[#d6cfc5] mt-1">{invoices.filter((i: any) => i.status !== "paid").length} unpaid</div>
        </div>
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">Pipeline</div>
          <div className="font-serif text-xl">{enquiries.filter((e: any) => ["new","quoted","negotiating"].includes(e.status)).length + quotations.filter((q: any) => q.status === "sent").length}</div>
        </div>
      </div>

      {quotations.length > 0 && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5 mb-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Quotations ({quotations.length})</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
              <th className="text-left py-2">Estimate No</th><th className="text-left py-2">Date</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Status</th>
            </tr></thead>
            <tbody>
              {quotations.map((q: any) => (
                <tr key={q.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                  <td className="py-2 font-mono text-xs"><Link href={`/quotations/${q.id}`} className="hover:underline">{q.estimateNo}</Link></td>
                  <td className="py-2 text-xs">{formatDate(q.quoteDate)}</td>
                  <td className="py-2 text-right font-medium">{formatINR(Number(q.grandTotal))}</td>
                  <td className="py-2"><StatusPill status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5 mb-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Invoices ({invoices.length})</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
              <th className="text-left py-2">Invoice No</th><th className="text-left py-2">Date</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Status</th>
            </tr></thead>
            <tbody>
              {invoices.map((i: any) => (
                <tr key={i.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                  <td className="py-2 font-mono text-xs"><Link href={`/invoices/${i.id}`} className="hover:underline">{i.invoiceNo}</Link></td>
                  <td className="py-2 text-xs">{formatDate(i.invoiceDate)}</td>
                  <td className="py-2 text-right font-medium">{formatINR(Number(i.grandTotal))}</td>
                  <td className="py-2"><StatusPill status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {installations.length > 0 && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5 mb-4 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Installations ({installations.length})</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
              <th className="text-left py-2">System</th><th className="text-left py-2">Date</th><th className="text-left py-2">Team</th><th className="text-left py-2">Stage</th>
            </tr></thead>
            <tbody>
              {installations.map((i: any) => (
                <tr key={i.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                  <td className="py-2 text-xs">{i.systemDescription}</td>
                  <td className="py-2 text-xs">{formatDate(i.installDate)}</td>
                  <td className="py-2 text-xs">{i.team || "—"}</td>
                  <td className="py-2"><StatusPill status={i.stage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

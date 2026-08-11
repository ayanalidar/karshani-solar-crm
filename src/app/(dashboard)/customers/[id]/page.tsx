import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatINR, formatDate, daysFromToday } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      enquiries: { orderBy: { createdAt: "desc" } },
      quotations: { orderBy: { createdAt: "desc" }, include: { items: true } },
      invoices: { orderBy: { createdAt: "desc" }, include: { items: true } },
      installations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const totalInvoiced = customer.invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalPaid = customer.invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.grandTotal, 0);
  const totalDue = customer.invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.grandTotal, 0);
  const openEnquiries = customer.enquiries.filter((e) => ["new", "quoted", "negotiating"].includes(e.status)).length;
  const pendingQuotes = customer.quotations.filter((q) => q.status === "sent").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-sm text-[#787468] hover:text-amber-700">← Customers</Link>
          <h2 className="font-serif text-lg">{customer.name}</h2>
        </div>
        <Link
          href={`/quotations/new?customerId=${customer.id}`}
          className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
        >
          + New Quotation
        </Link>
      </div>

      <div className="grid gap-4 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Contact</div>
          <div className="text-sm font-semibold">{customer.phone || "—"}</div>
          <div className="text-xs text-[#504d44]">{customer.city || "No city"}</div>
          {customer.gstin && <div className="text-[11px] font-mono text-[#504d44] mt-1">GSTIN: {customer.gstin}</div>}
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Total Invoiced</div>
          <div className="font-serif text-xl">{formatINR(totalInvoiced)}</div>
          <div className="text-[11px] text-green-700 mt-1">Paid {formatINR(totalPaid)}</div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Outstanding</div>
          <div className="font-serif text-xl text-red-700">{formatINR(totalDue)}</div>
          <div className="text-[11px] text-[#504d44] mt-1">{customer.invoices.filter((i) => i.status !== "paid").length} unpaid invoices</div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-4">
          <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Pipeline</div>
          <div className="font-serif text-xl">{openEnquiries + pendingQuotes}</div>
          <div className="text-[11px] text-[#504d44] mt-1">{openEnquiries} enquiries · {pendingQuotes} quotes</div>
        </div>
      </div>

      {/* Quotations */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Quotations ({customer.quotations.length})</h3>
        </div>
        {customer.quotations.length === 0 ? (
          <p className="text-sm text-[#787468]">No quotations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">Estimate No</th>
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.quotations.map((q) => (
                <tr key={q.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                  <td className="py-2 font-mono text-xs">
                    <Link href={`/quotations/${q.id}`} className="hover:underline">{q.estimateNo}</Link>
                  </td>
                  <td className="py-2 text-xs">{formatDate(q.quoteDate)}</td>
                  <td className="py-2 text-right font-medium">{formatINR(q.grandTotal)}</td>
                  <td className="py-2"><StatusPill status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Invoices ({customer.invoices.length})</h3>
        </div>
        {customer.invoices.length === 0 ? (
          <p className="text-sm text-[#787468]">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">Invoice No</th>
                <th className="text-left py-2">Date</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.invoices.map((i) => (
                <tr key={i.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                  <td className="py-2 font-mono text-xs">
                    <Link href={`/invoices/${i.id}`} className="hover:underline">{i.invoiceNo}</Link>
                  </td>
                  <td className="py-2 text-xs">{formatDate(i.invoiceDate)}</td>
                  <td className="py-2 text-right font-medium">{formatINR(i.grandTotal)}</td>
                  <td className="py-2"><StatusPill status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Installations */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Installations ({customer.installations.length})</h3>
        {customer.installations.length === 0 ? (
          <p className="text-sm text-[#787468]">No installations scheduled.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">System</th>
                <th className="text-left py-2">Install Date</th>
                <th className="text-left py-2">Team</th>
                <th className="text-left py-2">Stage</th>
              </tr>
            </thead>
            <tbody>
              {customer.installations.map((i) => (
                <tr key={i.id} className="border-b border-[#ede8dc]">
                  <td className="py-2 text-xs">{i.systemDescription || "—"}</td>
                  <td className="py-2 text-xs">{formatDate(i.installDate)}</td>
                  <td className="py-2 text-xs">{i.team || "—"}</td>
                  <td className="py-2"><StatusPill status={i.stage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enquiries */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-3">Enquiries ({customer.enquiries.length})</h3>
        {customer.enquiries.length === 0 ? (
          <p className="text-sm text-[#787468]">No enquiries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">System</th>
                <th className="text-right py-2">Est. Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {customer.enquiries.map((e) => (
                <tr key={e.id} className="border-b border-[#ede8dc]">
                  <td className="py-2 text-xs">{e.systemDescription || "—"}</td>
                  <td className="py-2 text-right">{formatINR(e.estimatedAmount)}</td>
                  <td className="py-2"><StatusPill status={e.status} /></td>
                  <td className="py-2 text-xs text-[#787468]">{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatINR, formatINRShort, formatDate, daysFromToday } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [products, customers, enquiries, quotations, invoices, installations, amcContracts] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true, category: true, unitPrice: true, stockQuantity: true } }),
    prisma.customer.findMany({ select: { id: true } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, systemDescription: true, status: true } }),
    prisma.quotation.findMany({ where: { status: "sent" }, select: { id: true, grandTotal: true } }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, invoiceNo: true, customerName: true, grandTotal: true, invoiceDate: true, status: true, createdAt: true },
    }),
    prisma.installation.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, systemDescription: true, installDate: true, team: true, stage: true } }),
    prisma.amcContract.findMany({ select: { id: true, customerName: true, system: true, expiryDate: true } }),
  ]);

  // Real analytics (D)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthlyRevenue = invoices
    .filter((i) => i.status === "paid" && i.invoiceDate >= monthStart)
    .reduce((s, i) => s + i.grandTotal, 0);
  const totalCustomers = customers.length;
  const pendingQuotationsAmt = quotations.reduce((s, q) => s + q.grandTotal, 0);
  const inventoryValue = products.reduce((s, p) => s + p.unitPrice * p.stockQuantity, 0);
  const inventoryUnits = products.reduce((s, p) => s + p.stockQuantity, 0);

  // Overdue invoices (invoice date > 15 days ago + status !== paid)
  const overdueInvoices = invoices.filter((i) => {
    if (i.status === "paid") return false;
    const days = daysFromToday(i.invoiceDate);
    return days < -15;
  });

  // Low stock (E)
  const lowStock = products.filter((p) => p.stockQuantity < 5);

  // AMC expiring in next 60 days (F)
  const amcExpiring = amcContracts
    .map((c) => ({ ...c, days: daysFromToday(c.expiryDate) }))
    .filter((c) => c.days >= 0 && c.days <= 60)
    .sort((a, b) => a.days - b.days);

  // Monthly revenue chart — last 6 months
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    const v = invoices
      .filter((inv) => inv.status === "paid" && inv.invoiceDate >= start && inv.invoiceDate < end)
      .reduce((s, inv) => s + inv.grandTotal, 0);
    months.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      value: v,
    });
  }
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid gap-4 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <KPICard label="Revenue This Month" value={formatINR(monthlyRevenue)} delta={`${formatINR(monthlyRevenue)} paid`} up />
        <KPICard label="Active Customers" value={totalCustomers.toString()} delta={`${totalCustomers} total`} up />
        <KPICard label="Pending Quotations" value={formatINRShort(pendingQuotationsAmt)} delta={`${quotations.length} open`} />
        <KPICard label="Inventory Value" value={formatINRShort(inventoryValue)} delta={`${inventoryUnits} units`} up />
      </div>

      {/* Alerts row */}
      {(overdueInvoices.length > 0 || lowStock.length > 0 || amcExpiring.length > 0) && (
        <div className="grid gap-2 mb-4 grid-cols-3 max-lg:grid-cols-1">
          {overdueInvoices.length > 0 && (
            <Link href="/invoices" className="bg-red-50 border border-red-200 rounded-lg p-3 flex justify-between items-center text-sm text-red-800 hover:bg-red-100 transition-colors">
              <span>⚠ {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? "s" : ""}</span>
              <span className="text-xs font-semibold bg-white border border-red-200 px-2 py-0.5 rounded">View →</span>
            </Link>
          )}
          {lowStock.length > 0 && (
            <Link href="/inventory" className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center text-sm text-amber-800 hover:bg-amber-100 transition-colors">
              <span>⚠ {lowStock.length} low-stock product{lowStock.length !== 1 ? "s" : ""}</span>
              <span className="text-xs font-semibold bg-white border border-amber-200 px-2 py-0.5 rounded">Restock →</span>
            </Link>
          )}
          {amcExpiring.length > 0 && (
            <Link href="/amc" className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex justify-between items-center text-sm text-purple-800 hover:bg-purple-100 transition-colors">
              <span>🛡 {amcExpiring.length} AMC expiring &lt;60d</span>
              <span className="text-xs font-semibold bg-white border border-purple-200 px-2 py-0.5 rounded">Renew →</span>
            </Link>
          )}
        </div>
      )}

      {/* Chart + Recent Enquiries */}
      <div className="grid gap-4 grid-cols-[2fr_1fr] max-lg:grid-cols-1 mb-4">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Revenue · Last 6 months (paid invoices)</h3>
            <span className="text-[11px] text-[#787468]">Total: {formatINR(months.reduce((s, m) => s + m.value, 0))}</span>
          </div>
          <div className="h-52">
            <svg viewBox="0 0 600 220" className="w-full h-full">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Gridlines */}
              {[0, 55, 110, 165, 220].map((y) => (
                <line key={y} x1="40" x2="590" y1={y} y2={y} stroke="#ede8dc" strokeWidth="0.5" />
              ))}
              {(() => {
                const points = months.map((m, i) => {
                  const x = 50 + (i * 540) / (months.length - 1);
                  const y = 200 - (m.value / maxMonth) * 180;
                  return { x, y, m };
                });
                const pathD = points.map((p) => `${p.x},${p.y}`).join(" L ");
                return (
                  <>
                    <path d={`M ${pathD.replace(/ L /, " L ").split(" L ").map((p) => p).join(" L ")}`} fill="none" stroke="#d97706" strokeWidth="2.2" />
                    <path d={`M ${points[0].x},200 L ${pathD} L ${points[points.length - 1].x},200 Z`} fill="url(#ag)" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3.5" fill="#d97706" />
                        <text x={p.x} y={215} textAnchor="middle" className="text-[10px] fill-[#787468]">
                          {p.m.label}
                        </text>
                        <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-[#504d44] font-semibold">
                          {p.m.value > 0 ? formatINRShort(p.m.value).replace("₹", "") : ""}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 min-w-0 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-4">Recent Enquiries</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">Customer</th>
                <th className="text-left py-2">System</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.length === 0 ? (
                <tr><td colSpan={3} className="py-6 text-center text-[#787468] text-xs">No enquiries yet.</td></tr>
              ) : (
                enquiries.map((e) => (
                  <tr key={e.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    <td className="py-2 font-medium text-xs">{e.customerName}</td>
                    <td className="py-2 text-xs text-[#504d44]">{e.systemDescription}</td>
                    <td className="py-2"><StatusPill status={e.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low stock + AMC expiry */}
      <div className="grid gap-4 grid-cols-2 max-lg:grid-cols-1 mb-4">
        {/* Low stock widget (E) */}
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Low Stock (&lt;5 units)</h3>
            <Link href="/inventory" className="text-[10px] text-amber-700 hover:underline">View all →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-green-700 py-4 text-center">✓ All products well-stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-[#787468]">{p.category}</div>
                  </div>
                  <span className={`font-semibold ${p.stockQuantity === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {p.stockQuantity} left
                  </span>
                </div>
              ))}
              {lowStock.length > 5 && <p className="text-[10px] text-[#787468] text-center pt-1">+ {lowStock.length - 5} more</p>}
            </div>
          )}
        </div>

        {/* AMC expiring widget (F) */}
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">AMC Expiring (next 60 days)</h3>
            <Link href="/amc" className="text-[10px] text-amber-700 hover:underline">View all →</Link>
          </div>
          {amcExpiring.length === 0 ? (
            <p className="text-xs text-green-700 py-4 text-center">✓ No AMC contracts expiring soon.</p>
          ) : (
            <div className="space-y-2">
              {amcExpiring.slice(0, 5).map((c) => (
                <div key={c.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.customerName}</div>
                    <div className="text-[10px] text-[#787468]">Expires: {formatDate(c.expiryDate)}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    c.days <= 7 ? "bg-red-100 text-red-700" : c.days <= 30 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {c.days === 0 ? "Today" : c.days === 1 ? "1 day" : `${c.days} days`}
                  </span>
                </div>
              ))}
              {amcExpiring.length > 5 && <p className="text-[10px] text-[#787468] text-center pt-1">+ {amcExpiring.length - 5} more</p>}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Recent Invoices</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
              <th className="text-left py-2">Invoice</th>
              <th className="text-left py-2">Customer</th>
              <th className="text-right py-2">Amount</th>
              <th className="text-left py-2">Date</th>
              <th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={5} className="py-6 text-center text-[#787468] text-xs">No invoices yet.</td></tr>
            ) : (
              invoices.slice(0, 8).map((i) => (
                <tr key={i.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                  <td className="py-2 font-mono text-xs">
                    <Link href={`/invoices/${i.id}`} className="hover:text-amber-700 hover:underline">{i.invoiceNo}</Link>
                  </td>
                  <td className="py-2 font-medium text-xs">{i.customerName}</td>
                  <td className="py-2 text-right font-medium">{formatINR(i.grandTotal)}</td>
                  <td className="py-2 text-xs">{formatDate(i.invoiceDate)}</td>
                  <td className="py-2"><StatusPill status={i.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KPICard({ label, value, delta, up }: { label: string; value: string; delta: string; up?: boolean }) {
  return (
    <div className="bg-white border border-[#e6e0d4] rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-2">{label}</div>
      <div className="font-serif text-2xl tracking-tight">{value}</div>
      <div className={`text-[11px] mt-1 font-medium ${up ? "text-green-700" : "text-amber-700"}`}>{delta}</div>
    </div>
  );
}

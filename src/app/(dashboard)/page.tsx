import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const [products, customers, enquiries, quotations, invoices] = await Promise.all([
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.quotation.findMany({ where: { status: "sent" } }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const revenue = invoices.reduce((s, i) => s + (i.status === "paid" ? 0 : i.grandTotal), 0);
  const invValue = products.reduce((s, p) => s + p.unitPrice * p.stockQuantity, 0);
  const invUnits = products.reduce((s, p) => s + p.stockQuantity, 0);
  const pendingAmt = quotations.reduce((s, q) => s + q.grandTotal, 0);

  return (
    <div>
      <div className="grid gap-4 mb-6 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <KPICard label="Revenue This Month" value={`₹${revenue.toLocaleString("en-IN")}`} delta="↑ 18.4%" up />
        <KPICard label="Active Customers" value={customers.length.toString()} delta="↑ 12 new" up />
        <KPICard label="Pending Quotations" value={`₹${pendingAmt.toLocaleString("en-IN")}`} delta="← 3 waiting" />
        <KPICard label="Inventory Value" value={`₹${invValue.toLocaleString("en-IN")}`} delta={`↑ ${invUnits} units`} up />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center text-sm text-amber-800 mb-4 flex-wrap gap-2">
        <span>⚠ {invoices.filter((i) => i.status === "overdue").length} payments overdue</span>
        <a href="/invoices" className="text-xs font-semibold bg-white border border-amber-200 px-3 py-1 rounded">View All</a>
      </div>

      <div className="grid gap-4 grid-cols-[2fr_1fr] max-lg:grid-cols-1">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Monthly Sales · Aug 2026</h3>
          <div className="h-52">
            <svg viewBox="0 0 600 220" className="w-full h-full">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d="M50,165L110,140L170,118L230,95L290,72L350,55L410,65L470,42L530,30L570,20" fill="url(#ag)" stroke="#d97706" strokeWidth="2.2" fill="none" />
            </svg>
          </div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Enquiries</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2">Customer</th><th className="text-left py-2">System</th><th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                  <td className="py-2 font-medium">{e.customerName}</td>
                  <td className="py-2 text-xs text-[#504d44]">{e.systemDescription}</td>
                  <td className="py-2"><StatusPill status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mt-4">
        <h3 className="text-sm font-semibold mb-4">Payments</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
              <th className="text-left py-2">Invoice</th><th className="text-left py-2">Customer</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((i) => (
              <tr key={i.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                <td className="py-2 font-mono text-xs">{i.invoiceNo}</td>
                <td className="py-2 font-medium">{i.customerName}</td>
                <td className="py-2 text-right font-medium">₹{i.grandTotal.toLocaleString("en-IN")}</td>
                <td className="py-2"><StatusPill status={i.status} /></td>
              </tr>
            ))}
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
      <div className={`text-[11px] mt-1 font-medium ${up ? "text-green-700" : "text-red-700"}`}>{delta}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-50 text-blue-600 border-blue-200",
    quoted: "bg-amber-50 text-amber-700 border-amber-200",
    negotiating: "bg-yellow-50 text-yellow-600 border-yellow-200",
    won: "bg-green-50 text-green-700 border-green-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    due: "bg-yellow-50 text-yellow-600 border-yellow-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    lost: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colors[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

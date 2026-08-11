import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-lg">Customers</h2>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">+ Add Customer</button>
      </div>
      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th><th className="text-left p-3">City</th><th className="text-left p-3">GSTIN</th><th className="text-right p-3">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 font-mono text-xs">{c.phone || "—"}</td>
                  <td className="p-3">{c.city || "—"}</td>
                  <td className="p-3 font-mono text-xs">{c.gstin || "—"}</td>
                  <td className="p-3 text-right font-medium">₹{c.totalPurchases.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

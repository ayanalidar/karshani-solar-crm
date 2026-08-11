import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h2 className="font-serif text-lg mb-4">Billing &amp; POS</h2>
      <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1 items-start">
        <div>
          <input type="search" placeholder="Search products…" className="w-full max-w-md px-3 py-2 border border-[#e6e0d4] rounded-md text-sm mb-3" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white border-2 border-[#ede8dc] rounded-lg p-3 text-center cursor-pointer hover:border-amber-600 hover:shadow-md transition-all">
                <div className="text-[9px] text-amber-600 uppercase tracking-wider font-bold">{p.category}</div>
                <div className="text-xs font-semibold mt-0.5">{p.name}</div>
                <div className="font-serif text-sm mt-0.5">₹{p.unitPrice.toLocaleString("en-IN")}</div>
                <div className="text-[10px] text-[#787468]">Stock: {p.stockQuantity}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 sticky top-20">
          <select className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm mb-3">
            <option value="">Walk-in Customer</option>
            {customers.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
          <div className="text-center py-8 text-sm text-[#787468]">Select products to begin</div>
          <div className="border-t-2 border-[#1c1915] pt-3 mt-3 hidden">
            <div className="flex justify-between text-sm text-[#504d44] py-0.5"><span>Subtotal</span><span>₹0</span></div>
            <div className="flex justify-between text-sm text-[#504d44] py-0.5"><span>GST</span><span>₹0</span></div>
            <div className="flex justify-between font-semibold text-base py-2 border-t border-[#e6e0d4] mt-1"><span>Total</span><span>₹0</span></div>
          </div>
          <button className="w-full mt-3 bg-amber-600 text-white py-2.5 rounded-md font-semibold text-sm hover:bg-amber-700 disabled:opacity-50" disabled>
            Complete Sale &amp; Deduct Stock
          </button>
        </div>
      </div>
    </div>
  );
}

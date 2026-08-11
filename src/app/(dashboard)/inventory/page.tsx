import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">Inventory</h2>
        <Link href="/inventory/new" className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">
          + Add Product
        </Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-[#e6e0d4] rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="text-[10px] text-amber-600 uppercase tracking-wider font-bold mb-1">{p.category}</div>
            <h4 className="font-semibold text-sm mb-1">{p.name}</h4>
            <div className="text-[11px] text-[#787468]">HSN {p.hsnCode}</div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#ede8dc]">
              <span className="font-serif text-base">₹{p.unitPrice.toLocaleString("en-IN")}/u</span>
              <span className={`text-xs font-semibold ${p.stockQuantity === 0 ? "text-red-600" : p.stockQuantity < 5 ? "text-amber-600" : "text-green-700"}`}>
                {p.stockQuantity === 0 ? "Out" : `${p.stockQuantity} in stock`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

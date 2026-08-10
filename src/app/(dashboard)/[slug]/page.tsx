import { prisma } from "@/lib/db";

const APP_PAGES: Record<string, { label: string; color: string }> = {
  enquiries: { label: "Enquiries", color: "blue" },
  quotations: { label: "Quotations", color: "amber" },
  invoices: { label: "Invoices", color: "green" },
  suppliers: { label: "Suppliers & PO", color: "slate" },
  expenses: { label: "Expenses", color: "red" },
  cashbook: { label: "Cash Book", color: "emerald" },
  installations: { label: "Installations", color: "purple" },
  amc: { label: "AMC & Warranty", color: "orange" },
  employees: { label: "Employees", color: "teal" },
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const info = APP_PAGES[slug] || { label: slug, color: "gray" };

  let data: { id: string; [key: string]: unknown }[] = [];
  try {
    const models: Record<string, string> = { enquiries: "enquiry", quotations: "quotation", invoices: "invoice", suppliers: "supplierOrder", expenses: "expense", cashbook: "cashBookEntry", installations: "installation", amc: "amcContract", employees: "employee" };
    const model = models[slug];
    if (model) {
      data = await (prisma as Record<string, { findMany: (opts?: Record<string, unknown>) => Promise<unknown[]> }>)[model].findMany({ orderBy: { createdAt: "desc" }, take: 20 }) as { id: string; [key: string]: unknown }[];
    }
  } catch {
    data = [];
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-serif text-lg">{info.label}</h2>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">
          + Add New
        </button>
      </div>
      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {data.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No records yet</h3>
              <p>Click "+ Add New" to create the first entry.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  {Object.keys(data[0] || {}).filter((k) => k !== "id" && k !== "createdAt").slice(0, 5).map((key) => (
                    <th key={key} className="text-left p-3">{key.replace(/([A-Z])/g, " $1").trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    {Object.entries(row).filter(([k]) => k !== "id" && k !== "createdAt").slice(0, 5).map(([key, val]) => (
                      <td key={key} className="p-3">{typeof val === "number" && key.toLowerCase().includes("amount") ? `₹${(val as number).toLocaleString("en-IN")}` : String(val ?? "—")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(APP_PAGES).map((slug) => ({ slug }));
}

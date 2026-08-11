"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { formatINR, formatDate } from "@/lib/format";

type Quotation = {
  id: string;
  estimateNo: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  systemDescription: string;
  grandTotal: number;
  status: string;
  quoteDate: string;
  createdAt: string | Date;
};

export function QuotationsList({ quotations }: { quotations: Quotation[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = search
    ? quotations.filter((q) =>
        [q.estimateNo, q.customerName, q.customerPhone, q.status, q.systemDescription]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : quotations;

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/quotations/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">Quotations</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search quotations…" />
          <Link
            href="/quotations/new"
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
          >
            + New Quotation
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No quotations yet</h3>
              <p>Click &quot;+ New Quotation&quot; to create one with line items.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  <th className="text-left p-3">Estimate No</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">System</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/quotations/${q.id}`} className="hover:text-amber-700 hover:underline">
                        {q.estimateNo}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold">
                      <Link href={`/quotations/${q.id}`} className="hover:text-amber-700 hover:underline">
                        {q.customerName}
                      </Link>
                      {q.customerPhone && <div className="text-[10px] text-[#787468] font-mono">{q.customerPhone}</div>}
                    </td>
                    <td className="p-3 text-xs text-[#504d44]">{q.systemDescription || "—"}</td>
                    <td className="p-3 text-xs">{formatDate(q.quoteDate)}</td>
                    <td className="p-3 text-right font-medium">{formatINR(q.grandTotal)}</td>
                    <td className="p-3"><StatusPill status={q.status} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link href={`/quotations/${q.id}`} className="text-xs text-amber-700 hover:underline mr-3">View</Link>
                      <button onClick={() => setDeleteId(q.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete quotation?"
        message="This permanently deletes the quotation and its line items."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

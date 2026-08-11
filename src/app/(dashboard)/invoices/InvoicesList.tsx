"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { formatINR, formatDate } from "@/lib/format";

type Invoice = {
  id: string;
  invoiceNo: string;
  customerName: string;
  description: string;
  grandTotal: number;
  status: string;
  invoiceDate: string;
  createdAt: string | Date;
};

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchesSearch = search
      ? [inv.invoiceNo, inv.customerName, inv.description, inv.status].join(" ").toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.grandTotal, 0);
  const totalDue = invoices.filter((i) => i.status === "due").reduce((s, i) => s + i.grandTotal, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.grandTotal, 0);

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/invoices/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const markPaid = async (id: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    router.refresh();
  };

  return (
    <div>
      <div className="grid gap-3 mb-4 grid-cols-3 max-lg:grid-cols-1">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-[10px] text-green-700 uppercase tracking-wider font-semibold">Paid</div>
          <div className="font-serif text-lg">{formatINR(totalPaid)}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-[10px] text-yellow-700 uppercase tracking-wider font-semibold">Due</div>
          <div className="font-serif text-lg">{formatINR(totalDue)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-[10px] text-red-700 uppercase tracking-wider font-semibold">Overdue</div>
          <div className="font-serif text-lg">{formatINR(totalOverdue)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">Invoices</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="due">Due</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoices…" />
          <Link href="/billing" className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">
            + New (POS)
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No invoices yet</h3>
              <p>Use the Billing POS or convert a quotation to create one.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  <th className="text-left p-3">Invoice No</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    <td className="p-3 font-mono text-xs">
                      <Link href={`/invoices/${inv.id}`} className="hover:text-amber-700 hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold">{inv.customerName}</td>
                    <td className="p-3 text-xs">{formatDate(inv.invoiceDate)}</td>
                    <td className="p-3 text-right font-medium">{formatINR(inv.grandTotal)}</td>
                    <td className="p-3"><StatusPill status={inv.status} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link href={`/invoices/${inv.id}`} className="text-xs text-amber-700 hover:underline mr-3">View</Link>
                      {inv.status !== "paid" && (
                        <button onClick={() => markPaid(inv.id)} className="text-xs text-green-700 hover:underline mr-3">
                          Mark Paid
                        </button>
                      )}
                      <button onClick={() => setDeleteId(inv.id)} className="text-xs text-red-600 hover:underline">Delete</button>
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
        title="Delete invoice?"
        message="This permanently deletes the invoice and its line items."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

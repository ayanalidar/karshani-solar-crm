"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { Modal } from "@/components/Modal";

type CustomerBalance = {
  id: string;
  name: string;
  phone: string;
  city: string;
  totalPurchases: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  unpaidCount: number;
  invoiceCount: number;
  lastTransactionDate: string | null;
};

type Summary = {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalExpenses: number;
  cashIn: number;
  cashOut: number;
  netCash: number;
  customerCount: number;
  customersWithDues: number;
};

type LedgerData = {
  summary: Summary;
  customers: CustomerBalance[];
  recentExpenses: any[];
  recentCashEntries: any[];
};

export function LedgerView() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({ type: "credit", description: "", amount: 0, entryDate: todayISO() });
  const [cashSaving, setCashSaving] = useState(false);
  const [cashError, setCashError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/ledger", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const saveCashEntry = async () => {
    setCashSaving(true);
    setCashError("");
    try {
      if (!cashForm.amount || Number(cashForm.amount) <= 0) {
        setCashError("Amount must be greater than 0");
        setCashSaving(false);
        return;
      }
      const res = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cashForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      setCashModalOpen(false);
      setCashForm({ type: "credit", description: "", amount: 0, entryDate: todayISO() });
      await refresh();
    } catch (e: any) {
      setCashError(e.message);
    } finally {
      setCashSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[#787468] dark:text-[#a8a29e]">Loading ledger…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-sm text-[#787468] dark:text-[#a8a29e]">
        <h3 className="font-serif text-lg text-[#504d44] dark:text-[#d6cfc5] mb-2">Unable to load ledger</h3>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  const { summary, customers, recentExpenses, recentCashEntries } = data;
  const filtered = search
    ? customers.filter((c) => [c.name, c.phone, c.city].join(" ").toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">Ledger</h2>
        <button
          onClick={() => setCashModalOpen(true)}
          className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
        >
          + Add Cash Entry
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <KPI label="Total Invoiced" value={formatINR(summary.totalInvoiced)} color="text-[#1c1915] dark:text-[#f5efe5]" />
        <KPI label="Total Collected" value={formatINR(summary.totalPaid)} color="text-green-700 dark:text-green-400" />
        <KPI label="Outstanding Dues" value={formatINR(summary.totalOutstanding)} color="text-red-700 dark:text-red-400" sub={`${summary.customersWithDues} customers with dues`} />
        <KPI label="Net Cash Flow" value={formatINR(summary.netCash)} color={summary.netCash >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"} sub={`In: ${formatINR(summary.cashIn)} · Out: ${formatINR(summary.cashOut)}`} />
      </div>

      {/* Cash flow + Expenses summary */}
      <div className="grid gap-4 grid-cols-2 max-lg:grid-cols-1 mb-4">
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Cash Flow</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase">Cash In</div>
              <div className="font-serif text-lg text-green-700 dark:text-green-400">{formatINR(summary.cashIn)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase">Cash Out</div>
              <div className="font-serif text-lg text-red-700 dark:text-red-400">{formatINR(summary.cashOut)}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase">Net</div>
              <div className={`font-serif text-lg ${summary.netCash >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{formatINR(summary.netCash)}</div>
            </div>
          </div>
          {recentCashEntries && recentCashEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#e6e0d4] dark:border-[#2e2a25]">
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase mb-2">Recent Entries</div>
              {recentCashEntries.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex justify-between text-xs py-1">
                  <span className="text-[#504d44] dark:text-[#d6cfc5] truncate flex-1 mr-2">{e.description || "—"}</span>
                  <span className={e.type === "credit" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                    {e.type === "credit" ? "+" : "−"}{formatINR(Number(e.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Total Expenses</h3>
            <Link href="/expenses" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View all →</Link>
          </div>
          <div className="font-serif text-2xl text-red-700 dark:text-red-400 mb-3">{formatINR(summary.totalExpenses)}</div>
          {recentExpenses && recentExpenses.length > 0 && (
            <div className="pt-3 border-t border-[#e6e0d4] dark:border-[#2e2a25]">
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase mb-2">Recent</div>
              {recentExpenses.slice(0, 5).map((e: any) => (
                <div key={e.id} className="flex justify-between text-xs py-1">
                  <span className="text-[#504d44] dark:text-[#d6cfc5] truncate flex-1 mr-2">{e.category}: {e.description || "—"}</span>
                  <span className="text-red-700 dark:text-red-400">−{formatINR(Number(e.amount))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Balances Table */}
      <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[#e6e0d4] dark:border-[#2e2a25] flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Customer Balances</h3>
          <input
            type="search"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5] max-w-xs"
          />
        </div>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">No customers found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Customer</th>
                  <th className="text-right p-3">Invoiced</th>
                  <th className="text-right p-3">Paid</th>
                  <th className="text-right p-3">Outstanding</th>
                  <th className="text-center p-3">Unpaid</th>
                  <th className="text-left p-3">Last Transaction</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                    <td className="p-3">
                      <Link href={`/customers/${c.id}`} className="font-semibold hover:text-amber-700 dark:hover:text-amber-400 hover:underline">{c.name}</Link>
                      {c.phone && <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] font-mono">{c.phone}</div>}
                    </td>
                    <td className="p-3 text-right">{formatINR(c.totalInvoiced)}</td>
                    <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(c.totalPaid)}</td>
                    <td className={`p-3 text-right font-semibold ${c.outstanding > 0 ? "text-red-700 dark:text-red-400" : "text-[#504d44] dark:text-[#d6cfc5]"}`}>{formatINR(c.outstanding)}</td>
                    <td className="p-3 text-center">
                      {c.unpaidCount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">{c.unpaidCount}</span>
                      ) : (
                        <span className="text-[10px] text-green-700 dark:text-green-400">✓</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-[#787468] dark:text-[#a8a29e]">{c.lastTransactionDate ? formatDate(c.lastTransactionDate) : "—"}</td>
                    <td className="p-3 text-right"><Link href={`/customers/${c.id}`} className="text-xs text-amber-700 dark:text-amber-400 hover:underline">View →</Link></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#1c1915] dark:border-[#f5efe5] font-bold">
                  <td className="p-3">TOTAL ({filtered.length})</td>
                  <td className="p-3 text-right">{formatINR(filtered.reduce((s, c) => s + c.totalInvoiced, 0))}</td>
                  <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(filtered.reduce((s, c) => s + c.totalPaid, 0))}</td>
                  <td className="p-3 text-right text-red-700 dark:text-red-400">{formatINR(filtered.reduce((s, c) => s + c.outstanding, 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Add Cash Entry Modal */}
      <Modal open={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Add Cash Entry">
        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#504d44] dark:text-[#d6cfc5] mb-1">Type</label>
            <select
              value={cashForm.type}
              onChange={(e) => setCashForm({ ...cashForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]"
            >
              <option value="credit">Credit (Cash In)</option>
              <option value="debit">Debit (Cash Out)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] dark:text-[#d6cfc5] mb-1">Description</label>
            <textarea
              value={cashForm.description}
              onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]"
            />
          </div>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#504d44] dark:text-[#d6cfc5] mb-1">Amount (₹) *</label>
              <input type="number" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#504d44] dark:text-[#d6cfc5] mb-1">Date</label>
              <input type="date" value={cashForm.entryDate} onChange={(e) => setCashForm({ ...cashForm, entryDate: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
          </div>
          {cashError && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 rounded">{cashError}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setCashModalOpen(false)} className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] dark:border-[#2e2a25] text-[#504d44] dark:text-[#d6cfc5] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]">Cancel</button>
            <button onClick={saveCashEntry} disabled={cashSaving} className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">{cashSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KPI({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-4">
      <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className={`font-serif text-xl ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] mt-1">{sub}</div>}
    </div>
  );
}

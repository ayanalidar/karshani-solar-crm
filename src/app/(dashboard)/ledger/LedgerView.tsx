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
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  unpaidCount: number;
  invoiceCount: number;
  lastTransactionDate: string | null;
};

type SupplierBalance = {
  name: string;
  totalOrders: number;
  pendingAmount: number;
  pendingCount: number;
  orderCount: number;
  totalPaid: number;
  outstanding: number;
};

type Transaction = {
  id: string;
  partyType: string;
  partyName: string;
  type: string;
  amount: number;
  description: string;
  transactionDate: string;
  referenceType: string;
};

type Summary = {
  totalCustomerInvoiced: number;
  totalCustomerPaid: number;
  totalCustomerOutstanding: number;
  customersWithDues: number;
  customerCount: number;
  totalSupplierOrders: number;
  totalSupplierPaid: number;
  totalSupplierOutstanding: number;
  suppliersWithDues: number;
  totalExpenses: number;
  cashIn: number;
  cashOut: number;
  netCash: number;
};

type LedgerData = {
  summary: Summary;
  customers: CustomerBalance[];
  suppliers: SupplierBalance[];
  transactions: Transaction[];
  recentExpenses: any[];
  recentCashEntries: any[];
};

export function LedgerView() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "suppliers" | "transactions">("customers");
  const [search, setSearch] = useState("");
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [txnForm, setTxnForm] = useState({ partyType: "customer", partyName: "", type: "debit", amount: 0, description: "", transactionDate: todayISO() });
  const [txnSaving, setTxnSaving] = useState(false);
  const [txnError, setTxnError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const refresh = useCallback(async () => {
    try {
      let url = "/api/ledger";
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (params.toString()) url += "?" + params.toString();

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveTxn = async () => {
    setTxnSaving(true);
    setTxnError("");
    try {
      if (!txnForm.partyName.trim()) { setTxnError("Name is required"); setTxnSaving(false); return; }
      if (!txnForm.amount || Number(txnForm.amount) <= 0) { setTxnError("Amount must be > 0"); setTxnSaving(false); return; }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnForm),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Failed (${res.status})`); }
      setTxnModalOpen(false);
      setTxnForm({ partyType: "customer", partyName: "", type: "debit", amount: 0, description: "", transactionDate: todayISO() });
      await refresh();
    } catch (e: any) { setTxnError(e.message); }
    finally { setTxnSaving(false); }
  };

  const sendWhatsAppReminder = (name: string, phone: string, outstanding: number) => {
    const num = phone.replace(/[^0-9]/g, "");
    const msg = `Hello ${name}, this is a reminder from Karshani Enterprises. Your outstanding balance is ₹${outstanding.toLocaleString("en-IN")}. Kindly arrange the payment at your earliest convenience. Thank you!`;
    const link = num ? `https://wa.me/${num.length === 10 ? "91" + num : num}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank");
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = tab === "customers" ? data.customers : tab === "suppliers" ? data.suppliers : data.transactions;
    if (!rows || rows.length === 0) return;

    let csv = "";
    if (tab === "customers") {
      csv = "Name,Phone,Invoiced,Paid,Outstanding,Unpaid Invoices\n";
      data.customers.forEach((c) => {
        csv += `"${c.name}","${c.phone}",${c.totalInvoiced},${c.totalPaid},${c.outstanding},${c.unpaidCount}\n`;
      });
    } else if (tab === "suppliers") {
      csv = "Supplier,Total Orders,Paid,Outstanding\n";
      data.suppliers.forEach((s) => {
        csv += `"${s.name}",${s.totalOrders},${s.totalPaid || 0},${s.outstanding || 0}\n`;
      });
    } else {
      csv = "Date,Party,Type,Amount,Description\n";
      data.transactions.forEach((t) => {
        csv += `"${formatDate(t.transactionDate)}","${t.partyName}","${t.type}",${t.amount},"${t.description}"\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${tab}-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-sm text-[#787468] dark:text-[#a8a29e]">Loading ledger…</div></div>;
  if (!data) return <div className="text-center py-16 text-sm text-[#787468] dark:text-[#a8a29e]"><h3 className="font-serif text-lg mb-2">Unable to load</h3><p>Run scripts/create-transactions-table.sql in Supabase SQL Editor</p></div>;

  const { summary } = data;

  const filteredCustomers = search ? data.customers.filter((c) => [c.name, c.phone, c.city].join(" ").toLowerCase().includes(search.toLowerCase())) : data.customers;
  const filteredSuppliers = search ? data.suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : data.suppliers;
  const filteredTxns = search ? data.transactions.filter((t) => [t.partyName, t.description].join(" ").toLowerCase().includes(search.toLowerCase())) : data.transactions;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">Ledger</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTxnModalOpen(true)} className="bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">+ Add Transaction</button>
          <button onClick={exportCSV} className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] text-[#1c1915] dark:text-[#f5efe5] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]">↓ CSV</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <KPI label="Customer Outstanding" value={formatINR(summary.totalCustomerOutstanding)} color="text-red-700 dark:text-red-400" sub={`${summary.customersWithDues} customers with dues`} />
        <KPI label="Supplier Payable" value={formatINR(summary.totalSupplierOutstanding)} color="text-orange-600 dark:text-orange-400" sub={`${summary.suppliersWithDues} suppliers pending`} />
        <KPI label="Cash In Hand" value={formatINR(summary.netCash)} color={summary.netCash >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"} sub={`In: ${formatINR(summary.cashIn)} · Out: ${formatINR(summary.cashOut)}`} />
        <KPI label="Total Expenses" value={formatINR(summary.totalExpenses)} color="text-red-700 dark:text-red-400" />
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-[#787468] dark:text-[#a8a29e]">Filter by date:</span>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
        <span className="text-xs text-[#787468]">to</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
        {(fromDate || toDate) && <button onClick={() => { setFromDate(""); setToDate(""); }} className="text-xs text-red-600 hover:underline">Clear</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-[#e6e0d4] dark:border-[#2e2a25]">
        {[["customers", `Customers (${data.customers.length})`], ["suppliers", `Suppliers (${data.suppliers.length})`], ["transactions", `Transactions (${data.transactions.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-amber-600 text-amber-700 dark:text-amber-400" : "border-transparent text-[#787468] dark:text-[#a8a29e] hover:text-[#1c1915] dark:hover:text-[#f5efe5]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input type="search" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs px-3 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5] mb-3" />

      {/* Customer Ledger */}
      {tab === "customers" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">No customers found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Customer</th><th className="text-right p-3">Invoiced</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Outstanding</th><th className="text-center p-3">Unpaid</th><th className="text-right p-3">Reminder</th>
                </tr></thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3"><Link href={`/customers/${c.id}`} className="font-semibold hover:text-amber-700 dark:hover:text-amber-400 hover:underline">{c.name}</Link>{c.phone && <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] font-mono">{c.phone}</div>}</td>
                      <td className="p-3 text-right">{formatINR(c.totalInvoiced)}</td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(c.totalPaid)}</td>
                      <td className={`p-3 text-right font-semibold ${c.outstanding > 0 ? "text-red-700 dark:text-red-400" : ""}`}>{formatINR(c.outstanding)}</td>
                      <td className="p-3 text-center">{c.unpaidCount > 0 ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">{c.unpaidCount}</span> : <span className="text-[10px] text-green-700 dark:text-green-400">✓</span>}</td>
                      <td className="p-3 text-right">{c.outstanding > 0 && c.phone && <button onClick={() => sendWhatsAppReminder(c.name, c.phone, c.outstanding)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">💬 Remind</button>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-[#1c1915] dark:border-[#f5efe5] font-bold">
                  <td className="p-3">TOTAL</td><td className="p-3 text-right">{formatINR(filteredCustomers.reduce((s, c) => s + c.totalInvoiced, 0))}</td>
                  <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(filteredCustomers.reduce((s, c) => s + c.totalPaid, 0))}</td>
                  <td className="p-3 text-right text-red-700 dark:text-red-400">{formatINR(filteredCustomers.reduce((s, c) => s + c.outstanding, 0))}</td><td colSpan={2}></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Supplier Ledger */}
      {tab === "suppliers" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">No suppliers found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Supplier</th><th className="text-right p-3">Total Orders</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Payable</th><th className="text-center p-3">Pending POs</th>
                </tr></thead>
                <tbody>
                  {filteredSuppliers.map((s, i) => (
                    <tr key={i} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3 text-right">{formatINR(s.totalOrders)}</td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(s.totalPaid || 0)}</td>
                      <td className={`p-3 text-right font-semibold ${(s.outstanding || 0) > 0 ? "text-orange-600 dark:text-orange-400" : ""}`}>{formatINR(s.outstanding || 0)}</td>
                      <td className="p-3 text-center">{s.pendingCount > 0 ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900">{s.pendingCount}</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 border-[#1c1915] dark:border-[#f5efe5] font-bold">
                  <td className="p-3">TOTAL</td><td className="p-3 text-right">{formatINR(filteredSuppliers.reduce((s, c) => s + c.totalOrders, 0))}</td>
                  <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(filteredSuppliers.reduce((s, c) => s + (c.totalPaid || 0), 0))}</td>
                  <td className="p-3 text-right text-orange-600 dark:text-orange-400">{formatINR(filteredSuppliers.reduce((s, c) => s + (c.outstanding || 0), 0))}</td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transactions Log */}
      {tab === "transactions" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTxns.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">
                <h3 className="font-serif text-lg mb-2">No transactions logged</h3>
                <p>Click &quot;+ Add Transaction&quot; to record a payment or credit.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Date</th><th className="text-left p-3">Party</th><th className="text-left p-3">Type</th><th className="text-left p-3">Description</th><th className="text-right p-3">Amount</th>
                </tr></thead>
                <tbody>
                  {filteredTxns.map((t) => (
                    <tr key={t.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3 text-xs">{formatDate(t.transactionDate)}</td>
                      <td className="p-3"><span className="font-semibold">{t.partyName}</span><span className="text-[10px] text-[#787468] dark:text-[#a8a29e] ml-1">({t.partyType})</span></td>
                      <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type === "credit" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900"}`}>{t.type === "credit" ? "CREDIT (Udhaar)" : "DEBIT (Payment)"}</span></td>
                      <td className="p-3 text-xs text-[#504d44] dark:text-[#d6cfc5]">{t.description || "—"}</td>
                      <td className={`p-3 text-right font-semibold ${t.type === "credit" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>{t.type === "credit" ? "+" : "−"}{formatINR(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal open={txnModalOpen} onClose={() => setTxnModalOpen(false)} title="Add Transaction">
        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Party Type</label>
            <select value={txnForm.partyType} onChange={(e) => setTxnForm({ ...txnForm, partyType: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
              <option value="customer">Customer</option><option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">{txnForm.partyType === "customer" ? "Customer" : "Supplier"} Name *</label>
            <input type="text" value={txnForm.partyName} onChange={(e) => setTxnForm({ ...txnForm, partyName: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
          </div>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Type</label>
              <select value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
                <option value="debit">Debit (Payment Received)</option><option value="credit">Credit (Udhaar / Owes More)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
              <input type="number" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea value={txnForm.description} onChange={(e) => setTxnForm({ ...txnForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Date</label>
            <input type="date" value={txnForm.transactionDate} onChange={(e) => setTxnForm({ ...txnForm, transactionDate: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
          </div>
          {txnError && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 rounded">{txnError}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setTxnModalOpen(false)} className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] dark:border-[#2e2a25] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]">Cancel</button>
            <button onClick={saveTxn} disabled={txnSaving} className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">{txnSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KPI({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-3">
      <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-1">{label}</div>
      <div className={`font-serif text-lg ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] mt-0.5">{sub}</div>}
    </div>
  );
}

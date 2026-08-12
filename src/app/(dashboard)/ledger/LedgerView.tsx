"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatINR, formatDate, todayISO } from "@/lib/format";
import { Modal } from "@/components/Modal";

type CustomerBalance = {
  id: string; name: string; phone: string; city: string;
  totalInvoiced: number; totalPaid: number; outstanding: number;
  unpaidCount: number; invoiceCount: number; lastTransactionDate: string | null;
};

type SupplierBalance = {
  name: string; totalOrders: number; pendingAmount: number;
  pendingCount: number; orderCount: number; totalPaid: number; outstanding: number;
};

type Transaction = {
  id: string; partyType: string; partyName: string; type: string;
  amount: number; description: string; transactionDate: string;
  referenceType: string; paymentMethod?: string;
};

type LedgerData = {
  summary: any; customers: CustomerBalance[]; suppliers: SupplierBalance[];
  transactions: Transaction[]; recentExpenses: any[]; recentCashEntries: any[];
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "dbt", label: "DBT (Bank Transfer)" },
  { value: "bank_finance", label: "Bank Finance" },
  { value: "cheque", label: "Cheque" },
];

export function LedgerView() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "suppliers" | "transactions">("customers");
  const [search, setSearch] = useState("");
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [txnForm, setTxnForm] = useState({
    partyType: "customer", partyId: "", partyName: "",
    type: "debit", amount: 0, description: "", transactionDate: todayISO(),
    paymentMethod: "cash",
  });
  const [cashForm, setCashForm] = useState({ type: "credit", description: "", amount: 0, entryDate: todayISO() });
  const [txnSaving, setTxnSaving] = useState(false);
  const [cashSaving, setCashSaving] = useState(false);
  const [txnError, setTxnError] = useState("");
  const [cashError, setCashError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Customer payment drawer
  const [drawerCustomer, setDrawerCustomer] = useState<CustomerBalance | null>(null);
  const [drawerTxns, setDrawerTxns] = useState<Transaction[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("cash");
  const [payDesc, setPayDesc] = useState("");
  const [paySaving, setPaySaving] = useState(false);
  const [payError, setPayError] = useState("");

  const openDrawer = async (customer: CustomerBalance) => {
    setDrawerCustomer(customer);
    setDrawerLoading(true);
    setPayAmount(customer.outstanding);
    setPayMethod("cash");
    setPayDesc("");
    setPayError("");
    try {
      const res = await fetch(`/api/transactions?partyType=customer&partyId=${customer.id}`, { cache: "no-store" });
      if (res.ok) setDrawerTxns(await res.json());
    } catch {}
    setDrawerLoading(false);
  };

  const submitPayment = async () => {
    if (!drawerCustomer) return;
    setPaySaving(true);
    setPayError("");
    try {
      if (!payAmount || payAmount <= 0) { setPayError("Amount must be > 0"); setPaySaving(false); return; }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyType: "customer",
          partyId: drawerCustomer.id,
          partyName: drawerCustomer.name,
          type: "debit",
          amount: payAmount,
          description: payDesc || `Payment received (${payMethod})`,
          transactionDate: todayISO(),
          paymentMethod: payMethod,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      setPayAmount(0);
      setPayDesc("");
      await refresh();
      // Re-open drawer with updated data
      if (drawerCustomer) {
        const updated = data?.customers.find((c) => c.id === drawerCustomer.id);
        if (updated) {
          setDrawerCustomer(updated);
          const tRes = await fetch(`/api/transactions?partyType=customer&partyId=${updated.id}`, { cache: "no-store" });
          if (tRes.ok) setDrawerTxns(await tRes.json());
        }
      }
    } catch (e: any) { setPayError(e.message); }
    finally { setPaySaving(false); }
  };

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

  // Fetch customers + suppliers for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch("/api/customers", { cache: "no-store" }),
          fetch("/api/suppliers", { cache: "no-store" }),
        ]);
        if (cRes.ok) setCustomers(await cRes.json());
        if (sRes.ok) setSuppliers(await sRes.json());
      } catch {}
    })();
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openTxnModal = (defaultType: "credit" | "debit") => {
    setTxnForm({ ...txnForm, type: defaultType, partyId: "", partyName: "", amount: 0, description: "", transactionDate: todayISO(), paymentMethod: "cash" });
    setTxnError("");
    setTxnModalOpen(true);
  };

  const onPartySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) { setTxnForm({ ...txnForm, partyId: "", partyName: "" }); return; }
    // Format: "id|name" for customers, just "name" for suppliers
    if (val.includes("|")) {
      const [id, name] = val.split("|");
      setTxnForm({ ...txnForm, partyId: id, partyName: name });
    } else {
      setTxnForm({ ...txnForm, partyId: "", partyName: val });
    }
  };

  const saveTxn = async () => {
    setTxnSaving(true);
    setTxnError("");
    try {
      if (!txnForm.partyName.trim()) { setTxnError("Select a customer/supplier"); setTxnSaving(false); return; }
      if (!txnForm.amount || Number(txnForm.amount) <= 0) { setTxnError("Amount must be > 0"); setTxnSaving(false); return; }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnForm),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Failed (${res.status})`); }
      setTxnModalOpen(false);
      await refresh();
    } catch (e: any) { setTxnError(e.message); }
    finally { setTxnSaving(false); }
  };

  const saveCashEntry = async () => {
    setCashSaving(true);
    setCashError("");
    try {
      if (!cashForm.amount || Number(cashForm.amount) <= 0) { setCashError("Amount must be > 0"); setCashSaving(false); return; }
      const res = await fetch("/api/cashbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cashForm),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Failed (${res.status})`); }
      setCashModalOpen(false);
      setCashForm({ type: "credit", description: "", amount: 0, entryDate: todayISO() });
      await refresh();
    } catch (e: any) { setCashError(e.message); }
    finally { setCashSaving(false); }
  };

  const sendWhatsAppReminder = (name: string, phone: string, outstanding: number) => {
    const num = phone.replace(/[^0-9]/g, "");
    const msg = `Hello ${name}, this is a reminder from Karshani Enterprises. Your outstanding balance is ₹${outstanding.toLocaleString("en-IN")}. Kindly arrange the payment at your earliest convenience. Thank you!`;
    const link = num ? `https://wa.me/${num.length === 10 ? "91" + num : num}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank");
  };

  const exportCSV = () => {
    if (!data) return;
    let csv = "";
    if (tab === "customers") {
      csv = "Name,Phone,Invoiced,Paid,Outstanding,Unpaid\n";
      data.customers.forEach((c) => { csv += `"${c.name}","${c.phone}",${c.totalInvoiced},${c.totalPaid},${c.outstanding},${c.unpaidCount}\n`; });
    } else if (tab === "suppliers") {
      csv = "Supplier,Orders,Paid,Payable\n";
      data.suppliers.forEach((s) => { csv += `"${s.name}",${s.totalOrders},${s.totalPaid||0},${s.outstanding||0}\n`; });
    } else {
      csv = "Date,Party,Type,Method,Amount,Description\n";
      data.transactions.forEach((t) => { csv += `"${formatDate(t.transactionDate)}","${t.partyName}","${t.type}","${t.paymentMethod||"cash"}",${t.amount},"${t.description}"\n`; });
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ledger-${tab}-${todayISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-sm text-[#787468] dark:text-[#a8a29e]">Loading ledger…</div></div>;
  if (!data) return <div className="text-center py-16 text-sm text-[#787468] dark:text-[#a8a29e]"><h3 className="font-serif text-lg mb-2">Unable to load</h3><p>Run scripts/create-transactions-table.sql in Supabase</p></div>;

  const { summary } = data;
  const filteredCustomers = search ? data.customers.filter((c) => [c.name, c.phone, c.city].join(" ").toLowerCase().includes(search.toLowerCase())) : data.customers;
  const filteredSuppliers = search ? data.suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : data.suppliers;
  const filteredTxns = search ? data.transactions.filter((t) => [t.partyName, t.description].join(" ").toLowerCase().includes(search.toLowerCase())) : data.transactions;

  const partyOptions = txnForm.partyType === "customer"
    ? customers.map((c) => ({ value: `${c.id}|${c.name}`, label: `${c.name}${c.phone ? " · " + c.phone : ""}` }))
    : Array.from(new Set(suppliers.map((s) => s.supplierName))).map((name) => ({ value: name, label: name }));

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">Ledger</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => openTxnModal("debit")} className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700">+ Payment Received</button>
          <button onClick={() => openTxnModal("credit")} className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-700">+ Give Credit</button>
          <button onClick={() => setCashModalOpen(true)} className="bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-amber-700">+ Cash Entry</button>
          <button onClick={exportCSV} className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] text-[#1c1915] dark:text-[#f5efe5] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]">↓ CSV</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <KPI label="Customer Outstanding" value={formatINR(summary.totalCustomerOutstanding)} color="text-red-700 dark:text-red-400" sub={`${summary.customersWithDues} with dues`} />
        <KPI label="Supplier Payable" value={formatINR(summary.totalSupplierOutstanding)} color="text-orange-600 dark:text-orange-400" sub={`${summary.suppliersWithDues} pending`} />
        <KPI label="Cash In Hand" value={formatINR(summary.netCash)} color={summary.netCash >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"} sub={`In: ${formatINR(summary.cashIn)} · Out: ${formatINR(summary.cashOut)}`} />
        <KPI label="Total Expenses" value={formatINR(summary.totalExpenses)} color="text-red-700 dark:text-red-400" />
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-[#787468] dark:text-[#a8a29e]">Filter:</span>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-2 py-1 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
        <span className="text-xs text-[#787468]">to</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-2 py-1 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
        {(fromDate || toDate) && <button onClick={() => { setFromDate(""); setToDate(""); }} className="text-xs text-red-600 hover:underline">Clear</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b border-[#e6e0d4] dark:border-[#2e2a25]">
        {[["customers", `Customers (${data.customers.length})`], ["suppliers", `Suppliers (${data.suppliers.length})`], ["transactions", `Transactions (${data.transactions.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-amber-600 text-amber-700 dark:text-amber-400" : "border-transparent text-[#787468] dark:text-[#a8a29e] hover:text-[#1c1915] dark:hover:text-[#f5efe5]"}`}>{label}</button>
        ))}
      </div>

      <input type="search" placeholder={`Search ${tab}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs px-3 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5] mb-3" />

      {/* Customer Tab */}
      {tab === "customers" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">No customers.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Customer</th><th className="text-right p-3">Invoiced</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Outstanding</th><th className="text-right p-3">Action</th>
                </tr></thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3"><Link href={`/customers/${c.id}`} className="font-semibold hover:text-amber-700 dark:hover:text-amber-400 hover:underline">{c.name}</Link>{c.phone && <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] font-mono">{c.phone}</div>}</td>
                      <td className="p-3 text-right">{formatINR(c.totalInvoiced)}</td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(c.totalPaid)}</td>
                      <td className={`p-3 text-right font-semibold ${c.outstanding > 0 ? "text-red-700 dark:text-red-400" : ""}`}>{formatINR(c.outstanding)}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {c.outstanding > 0 && (
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => openDrawer(c)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Pay</button>
                            {c.phone && <button onClick={() => sendWhatsAppReminder(c.name, c.phone, c.outstanding)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">💬</button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 font-bold">
                  <td className="p-3">TOTAL</td><td className="p-3 text-right">{formatINR(filteredCustomers.reduce((s, c) => s + c.totalInvoiced, 0))}</td>
                  <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(filteredCustomers.reduce((s, c) => s + c.totalPaid, 0))}</td>
                  <td className="p-3 text-right text-red-700 dark:text-red-400">{formatINR(filteredCustomers.reduce((s, c) => s + c.outstanding, 0))}</td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Supplier Tab */}
      {tab === "suppliers" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredSuppliers.length === 0 ? <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]">No suppliers.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Supplier</th><th className="text-right p-3">Orders</th><th className="text-right p-3">Paid</th><th className="text-right p-3">Payable</th><th className="text-right p-3">Action</th>
                </tr></thead>
                <tbody>
                  {filteredSuppliers.map((s, i) => (
                    <tr key={i} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3 font-semibold">{s.name}</td>
                      <td className="p-3 text-right">{formatINR(s.totalOrders)}</td>
                      <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(s.totalPaid || 0)}</td>
                      <td className={`p-3 text-right font-semibold ${(s.outstanding || 0) > 0 ? "text-orange-600 dark:text-orange-400" : ""}`}>{formatINR(s.outstanding || 0)}</td>
                      <td className="p-3 text-right">
                        {(s.outstanding || 0) > 0 && <button onClick={() => { setTxnForm({ ...txnForm, partyType: "supplier", partyId: "", partyName: s.name, type: "debit", amount: s.outstanding, description: "Supplier payment", transactionDate: todayISO(), paymentMethod: "bank_finance" }); setTxnModalOpen(true); }} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Pay</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t-2 font-bold">
                  <td className="p-3">TOTAL</td><td className="p-3 text-right">{formatINR(filteredSuppliers.reduce((s, c) => s + c.totalOrders, 0))}</td>
                  <td className="p-3 text-right text-green-700 dark:text-green-400">{formatINR(filteredSuppliers.reduce((s, c) => s + (c.totalPaid || 0), 0))}</td>
                  <td className="p-3 text-right text-orange-600 dark:text-orange-400">{formatINR(filteredSuppliers.reduce((s, c) => s + (c.outstanding || 0), 0))}</td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredTxns.length === 0 ? <div className="text-center py-12 text-sm text-[#787468] dark:text-[#a8a29e]"><h3 className="font-serif text-lg mb-2">No transactions</h3><p>Use &quot;+ Payment Received&quot; or &quot;+ Give Credit&quot; above.</p></div> : (
              <table className="w-full text-sm">
                <thead><tr className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                  <th className="text-left p-3">Date</th><th className="text-left p-3">Party</th><th className="text-left p-3">Type</th><th className="text-left p-3">Method</th><th className="text-left p-3">Description</th><th className="text-right p-3">Amount</th>
                </tr></thead>
                <tbody>
                  {filteredTxns.map((t) => (
                    <tr key={t.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25] hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                      <td className="p-3 text-xs">{formatDate(t.transactionDate)}</td>
                      <td className="p-3"><span className="font-semibold">{t.partyName}</span><span className="text-[10px] text-[#787468] dark:text-[#a8a29e] ml-1">({t.partyType})</span></td>
                      <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.type === "credit" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900" : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900"}`}>{t.type === "credit" ? "CREDIT" : "PAYMENT"}</span></td>
                      <td className="p-3 text-xs">{(PAYMENT_METHODS.find(m => m.value === (t.paymentMethod || "cash"))?.label) || t.paymentMethod || "Cash"}</td>
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
      <Modal open={txnModalOpen} onClose={() => setTxnModalOpen(false)} title={txnForm.type === "debit" ? "Record Payment Received" : "Give Credit (Udhaar)"}>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Party Type</label>
            <select value={txnForm.partyType} onChange={(e) => setTxnForm({ ...txnForm, partyType: e.target.value, partyId: "", partyName: "" })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
              <option value="customer">Customer</option><option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">{txnForm.partyType === "customer" ? "Customer" : "Supplier"} *</label>
            <select value={txnForm.partyId ? `${txnForm.partyId}|${txnForm.partyName}` : txnForm.partyName} onChange={onPartySelect} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
              <option value="">— Select {txnForm.partyType} —</option>
              {txnForm.partyType === "customer"
                ? customers.map((c) => <option key={c.id} value={`${c.id}|${c.name}`}>{c.name}{c.phone ? " · " + c.phone : ""}</option>)
                : Array.from(new Set(suppliers.map((s) => s.supplierName))).map((name) => <option key={name} value={name}>{name}</option>)
              }
            </select>
          </div>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Type</label>
              <select value={txnForm.type} onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
                <option value="debit">Payment Received</option><option value="credit">Credit (Udhaar)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
              <input type="number" value={txnForm.amount} onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Payment Method</label>
            <select value={txnForm.paymentMethod} onChange={(e) => setTxnForm({ ...txnForm, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
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

      {/* Cash Entry Modal */}
      <Modal open={cashModalOpen} onClose={() => setCashModalOpen(false)} title="Add Cash Entry">
        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Type</label>
            <select value={cashForm.type} onChange={(e) => setCashForm({ ...cashForm, type: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
              <option value="credit">Credit (Cash In)</option><option value="debit">Debit (Cash Out)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea value={cashForm.description} onChange={(e) => setCashForm({ ...cashForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
          </div>
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (₹) *</label>
              <input type="number" value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Date</label>
              <input type="date" value={cashForm.entryDate} onChange={(e) => setCashForm({ ...cashForm, entryDate: e.target.value })} className="w-full px-3 py-2 border border-[#e6e0d4] dark:border-[#2e2a25] rounded-md text-sm bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
            </div>
          </div>
          {cashError && <div className="text-red-600 text-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 rounded">{cashError}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setCashModalOpen(false)} className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] dark:border-[#2e2a25] hover:bg-[#faf6f0] dark:hover:bg-[#2a2620]">Cancel</button>
            <button onClick={saveCashEntry} disabled={cashSaving} className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">{cashSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </Modal>

      {/* Customer Payment Drawer — shows full transaction history + payment form */}
      <Modal open={!!drawerCustomer} onClose={() => setDrawerCustomer(null)} title={drawerCustomer ? `${drawerCustomer.name} — Payment History` : ""} size="lg">
        {drawerCustomer && (
          <div className="space-y-4">
            {/* Customer summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#faf6f0] dark:bg-[#0c0a09] rounded-lg p-2 text-center">
                <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase">Total Billed</div>
                <div className="font-serif text-base">{formatINR(drawerCustomer.totalInvoiced)}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 text-center">
                <div className="text-[10px] text-green-700 dark:text-green-400 uppercase">Total Paid</div>
                <div className="font-serif text-base text-green-700 dark:text-green-400">{formatINR(drawerCustomer.totalPaid)}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2 text-center">
                <div className="text-[10px] text-red-700 dark:text-red-400 uppercase">Outstanding</div>
                <div className="font-serif text-base text-red-700 dark:text-red-400">{formatINR(drawerCustomer.outstanding)}</div>
              </div>
            </div>

            {/* Transaction history */}
            <div className="border border-[#e6e0d4] dark:border-[#2e2a25] rounded-lg overflow-hidden">
              <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase font-semibold px-3 py-2 border-b border-[#e6e0d4] dark:border-[#2e2a25]">Transaction History</div>
              <div className="max-h-48 overflow-y-auto">
                {drawerLoading ? (
                  <div className="text-center py-4 text-xs text-[#787468]">Loading…</div>
                ) : drawerTxns.length === 0 ? (
                  <div className="text-center py-4 text-xs text-[#787468]">No transactions yet.</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="text-[9px] text-[#787468] uppercase border-b border-[#e6e0d4] dark:border-[#2e2a25]">
                      <th className="text-left p-2">Date</th><th className="text-left p-2">Type</th><th className="text-left p-2">Method</th><th className="text-left p-2">Description</th><th className="text-right p-2">Amount</th>
                    </tr></thead>
                    <tbody>
                      {drawerTxns.map((t) => (
                        <tr key={t.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                          <td className="p-2 text-[10px]">{formatDate(t.transactionDate)}</td>
                          <td className="p-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.type === "credit" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"}`}>{t.type === "credit" ? "CREDIT" : "PAID"}</span></td>
                          <td className="p-2 text-[10px]">{t.paymentMethod || "cash"}</td>
                          <td className="p-2 text-[10px] text-[#504d44] dark:text-[#d6cfc5]">{t.description || "—"}</td>
                          <td className={`p-2 text-right font-semibold text-[10px] ${t.type === "credit" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>{t.type === "credit" ? "+" : "−"}{formatINR(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Payment form (for EMI / partial payments) */}
            {drawerCustomer.outstanding > 0 ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-2">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Record Payment (EMI / Partial / Full)</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787468] mb-0.5">Amount (₹)</label>
                    <input type="number" value={payAmount || ""} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787468] mb-0.5">Method</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
                      <option value="cash">Cash</option><option value="upi">UPI</option><option value="dbt">DBT</option><option value="bank_finance">Bank Finance</option><option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#787468] mb-0.5">Note (optional)</label>
                    <input type="text" value={payDesc} onChange={(e) => setPayDesc(e.target.value)} placeholder="EMI / Partial…" className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
                  </div>
                </div>
                <button onClick={() => setPayAmount(drawerCustomer.outstanding)} className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">Set full outstanding ({formatINR(drawerCustomer.outstanding)})</button>
                {payError && <div className="text-red-600 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-2 py-1 rounded">{payError}</div>}
                <button onClick={submitPayment} disabled={paySaving} className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{paySaving ? "Saving…" : "Record Payment"}</button>
              </div>
            ) : (
              <div className="text-center text-sm text-green-700 dark:text-green-400 font-semibold py-2">✓ Balance cleared — no outstanding dues</div>
            )}
          </div>
        )}
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

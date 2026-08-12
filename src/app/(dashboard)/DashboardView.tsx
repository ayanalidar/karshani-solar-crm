"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatINRShort, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

type Summary = {
  monthlyRevenue: number;
  totalOutstanding: number;
  customerCount: number;
  pendingQuotationsAmt: number;
  pendingQuotationsCount: number;
  inventoryValue: number;
  inventoryUnits: number;
  totalExpenses: number;
  cashIn: number;
  cashOut: number;
  netCash: number;
  overdueCount: number;
  lowStockCount: number;
  amcExpiringCount: number;
};

type DashboardData = {
  summary: Summary;
  months: { label: string; value: number }[];
  lowStock: any[];
  amcExpiring: any[];
  customerBalances: any[];
  recentTransactions: any[];
  enquiries: any[];
  invoices: any[];
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-sm text-[#787468] dark:text-[#a8a29e]">Loading dashboard…</div></div>;
  if (!data) return <div className="text-center py-16 text-sm text-[#787468] dark:text-[#a8a29e]">Unable to load dashboard.</div>;

  const { summary: s, months, lowStock, amcExpiring, customerBalances, recentTransactions, enquiries, invoices } = data;
  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  return (
    <div>
      {/* KPI Cards — futuristic gradient cards */}
      <div className="grid gap-3 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <GradientCard label="Revenue This Month" value={formatINR(s.monthlyRevenue)} sub="Collected" gradient="from-green-500 to-emerald-600" icon="₹" />
        <GradientCard label="Credit (Unpaid)" value={formatINR(s.totalOutstanding)} sub={`${customerBalances.length} customers with dues`} gradient="from-red-500 to-rose-600" icon="⚠" />
        <GradientCard label="Pending Quotations" value={formatINRShort(s.pendingQuotationsAmt)} sub={`${s.pendingQuotationsCount} open quotes`} gradient="from-amber-500 to-orange-600" icon="📄" />
        <GradientCard label="Inventory Value" value={formatINRShort(s.inventoryValue)} sub={`${s.inventoryUnits} units in stock`} gradient="from-blue-500 to-indigo-600" icon="⊞" />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-3 mb-4 grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <MiniStat label="Active Customers" value={s.customerCount.toString()} color="text-blue-600 dark:text-blue-400" />
        <MiniStat label="Cash In Hand" value={formatINR(s.netCash)} color={s.netCash >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} />
        <MiniStat label="Total Expenses" value={formatINR(s.totalExpenses)} color="text-red-600 dark:text-red-400" />
        <MiniStat label="Low Stock Items" value={s.lowStockCount.toString()} color={s.lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"} />
      </div>

      {/* Alerts row */}
      {(s.overdueCount > 0 || s.lowStockCount > 0 || s.amcExpiringCount > 0 || s.totalOutstanding > 0) && (
        <div className="grid gap-2 mb-4 grid-cols-3 max-lg:grid-cols-1">
          {s.totalOutstanding > 0 && (
            <Link href="/ledger" className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg p-3 flex justify-between items-center hover:opacity-90 transition-opacity">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-90">Credit Outstanding</div>
                <div className="font-serif text-lg">{formatINR(s.totalOutstanding)}</div>
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">View →</span>
            </Link>
          )}
          {s.lowStockCount > 0 && (
            <Link href="/inventory" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg p-3 flex justify-between items-center hover:opacity-90 transition-opacity">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-90">Low Stock</div>
                <div className="font-serif text-lg">{s.lowStockCount} items</div>
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Restock →</span>
            </Link>
          )}
          {s.amcExpiringCount > 0 && (
            <Link href="/amc" className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg p-3 flex justify-between items-center hover:opacity-90 transition-opacity">
              <div>
                <div className="text-[10px] uppercase tracking-wider opacity-90">AMC Expiring</div>
                <div className="font-serif text-lg">{s.amcExpiringCount} contracts</div>
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Renew →</span>
            </Link>
          )}
        </div>
      )}

      {/* Chart + Recent Enquiries */}
      <div className="grid gap-4 grid-cols-[2fr_1fr] max-lg:grid-cols-1 mb-4">
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold">Revenue · Last 6 months</h3>
            <span className="text-[11px] text-[#787468] dark:text-[#a8a29e]">Total: {formatINR(months.reduce((s, m) => s + m.value, 0))}</span>
          </div>
          <div className="h-52 flex items-end gap-2">
            {months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[9px] text-[#78768] dark:text-[#a8a29e] font-semibold">
                  {m.value > 0 ? formatINRShort(m.value).replace("₹", "") : ""}
                </div>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 dark:from-amber-700 dark:to-amber-500 transition-all hover:opacity-80"
                  style={{ height: `${(m.value / maxMonth) * 160}px`, minHeight: m.value > 0 ? "8px" : "2px" }}
                />
                <div className="text-[10px] text-[#787468] dark:text-[#a8a29e]">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Recent Enquiries</h3>
          <table className="w-full text-sm">
            <tbody>
              {enquiries.length === 0 ? (
                <tr><td className="py-6 text-center text-[#787468] text-xs">No enquiries yet.</td></tr>
              ) : (
                enquiries.map((e: any) => (
                  <tr key={e.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                    <td className="py-2 font-medium text-xs">{e.customerName}</td>
                    <td className="py-2 text-xs text-[#504d44] dark:text-[#d6cfc5]">{e.systemDescription}</td>
                    <td className="py-2"><StatusPill status={e.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Outstanding + Low Stock + AMC */}
      <div className="grid gap-4 grid-cols-3 max-lg:grid-cols-1 mb-4">
        {/* Credit Outstanding card */}
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Credit Outstanding</h3>
            <Link href="/ledger" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View all →</Link>
          </div>
          {customerBalances.length === 0 ? (
            <p className="text-xs text-green-700 dark:text-green-400 py-4 text-center">✓ No outstanding dues</p>
          ) : (
            <div className="space-y-2">
              {customerBalances.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    <div className="text-[10px] text-[#787468] dark:text-[#a8a29e]">Billed {formatINR(c.totalBilled)} · Paid {formatINR(c.totalPaid)}</div>
                  </div>
                  <div className="font-semibold text-red-700 dark:text-red-400 ml-2">{formatINR(c.outstanding)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Low Stock (&lt;5)</h3>
            <Link href="/inventory" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-green-700 dark:text-green-400 py-4 text-center">✓ All products well-stocked.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-[#787468] dark:text-[#a8a29e]">{p.category}</div>
                  </div>
                  <span className={`font-semibold ${p.stockQuantity === 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {p.stockQuantity} left
                  </span>
                </div>
              ))}
              {lowStock.length > 5 && <p className="text-[10px] text-[#787468] text-center pt-1">+ {lowStock.length - 5} more</p>}
            </div>
          )}
        </div>

        {/* AMC Expiring */}
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">AMC Expiring (60d)</h3>
            <Link href="/amc" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View →</Link>
          </div>
          {amcExpiring.length === 0 ? (
            <p className="text-xs text-green-700 dark:text-green-400 py-4 text-center">✓ No AMC expiring soon.</p>
          ) : (
            <div className="space-y-2">
              {amcExpiring.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.customerName}</div>
                    <div className="text-[10px] text-[#787468] dark:text-[#a8a29e]">Expires: {formatDate(c.expiryDate)}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.days <= 7 ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" : c.days <= 30 ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"}`}>
                    {c.days === 0 ? "Today" : `${c.days}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions + Recent Invoices */}
      <div className="grid gap-4 grid-cols-[1fr_1fr] max-lg:grid-cols-1">
        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Recent Transactions</h3>
            <Link href="/ledger" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr><td className="py-6 text-center text-[#787468] text-xs">No transactions yet.</td></tr>
              ) : (
                recentTransactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                    <td className="py-2 text-xs">{formatDate(t.transactionDate)}</td>
                    <td className="py-2 font-medium text-xs truncate max-w-[120px]">{t.partyName}</td>
                    <td className="py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.type === "credit" ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"}`}>{t.type === "credit" ? "DUE" : "PAID"}</span></td>
                    <td className={`py-2 text-right font-semibold text-xs ${t.type === "credit" ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>{t.type === "credit" ? "+" : "−"}{formatINR(t.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">Recent Invoices</h3>
            <Link href="/invoices" className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {invoices.length === 0 ? (
                <tr><td className="py-6 text-center text-[#787468] text-xs">No invoices yet.</td></tr>
              ) : (
                invoices.slice(0, 8).map((i: any) => (
                  <tr key={i.id} className="border-b border-[#ede8dc] dark:border-[#2e2a25]">
                    <td className="py-2 font-mono text-xs">
                      <Link href={`/invoices/${i.id}`} className="hover:text-amber-700 dark:hover:text-amber-400 hover:underline">{i.invoiceNo}</Link>
                    </td>
                    <td className="py-2 font-medium text-xs truncate max-w-[100px]">{i.customerName}</td>
                    <td className="py-2 text-right font-medium text-xs">{formatINR(i.grandTotal)}</td>
                    <td className="py-2"><StatusPill status={i.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GradientCard({ label, value, sub, gradient, icon }: { label: string; value: string; sub: string; gradient: string; icon: string }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden`}>
      <div className="absolute top-2 right-3 text-3xl opacity-20">{icon}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90 mb-1">{label}</div>
      <div className="font-serif text-2xl tracking-tight">{value}</div>
      <div className="text-[11px] mt-1 opacity-80">{sub}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1c1917] border border-[#e6e0d4] dark:border-[#2e2a25] rounded-xl p-3">
      <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] uppercase tracking-wider font-semibold mb-0.5">{label}</div>
      <div className={`font-serif text-lg ${color}`}>{value}</div>
    </div>
  );
}

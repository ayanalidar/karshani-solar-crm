import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { fetchAll, toCamelArray, toCamel } from "@/lib/raw-db";

// Dashboard data endpoint — returns all data needed for the dashboard.
// Uses Supabase REST API (HTTPS) for reliability.
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const [products, customers, enquiries, quotations, invoices, installations, amcContracts, transactions, expenses, cashEntries] = await Promise.all([
    fetchAll("products", "category.asc", 100),
    fetchAll("customers", "name.asc", 100),
    fetchAll("enquiries", "created_at.desc", 5),
    fetchAll("quotations", "created_at.desc", 20),
    fetchAll("invoices", "created_at.desc", 50),
    fetchAll("installations", "created_at.desc", 5),
    fetchAll("amc_contracts", "expiry_date.asc", 50),
    fetchAll("transactions", "transaction_date.desc", 200),
    fetchAll("expenses", "expense_date.desc", 50),
    fetchAll("cash_book", "entry_date.desc", 50),
  ]);

  // Calculate real analytics from transactions
  const customerTxns = (transactions || []).filter((t: any) => t.party_type === "customer");
  const totalCredit = customerTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const totalDebit = customerTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const totalOutstanding = Math.max(0, totalCredit - totalDebit);

  // Monthly revenue from transactions (debit = payment received)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthlyRevenue = customerTxns
    .filter((t: any) => t.type === "debit" && t.transaction_date >= monthStart)
    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

  // 6-month revenue chart
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
    const v = customerTxns
      .filter((t: any) => t.type === "debit" && t.transaction_date >= start && t.transaction_date < end)
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    months.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), value: v });
  }

  // Pending quotations
  const pendingQuotations = (quotations || []).filter((q: any) => q.status === "sent");
  const pendingAmt = pendingQuotations.reduce((s: number, q: any) => s + Number(q.grand_total || 0), 0);

  // Inventory
  const invValue = (products || []).reduce((s: number, p: any) => s + Number(p.unit_price || 0) * Number(p.stock_quantity || 0), 0);
  const invUnits = (products || []).reduce((s: number, p: any) => s + Number(p.stock_quantity || 0), 0);
  const lowStock = (products || []).filter((p: any) => Number(p.stock_quantity) < 5);

  // Overdue invoices
  const overdueInvoices = (invoices || []).filter((i: any) => {
    if (i.status === "paid") return false;
    const days = Math.floor((Date.now() - new Date(i.invoice_date).getTime()) / 86400000);
    return days < -15;
  });

  // AMC expiring
  const amcExpiring = (amcContracts || []).map((c: any) => ({
    ...toCamel(c),
    days: Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000),
  })).filter((c: any) => c.days >= 0 && c.days <= 60).sort((a: any, b: any) => a.days - b.days);

  // Top customers by outstanding
  const customerBalances = (customers || []).map((c: any) => {
    const custTxns = customerTxns.filter((t: any) => t.party_id === c.id || t.party_name === c.name);
    const credit = custTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const debit = custTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    return { ...toCamel(c), outstanding: Math.max(0, credit - debit), totalBilled: credit, totalPaid: debit };
  }).filter((c: any) => c.outstanding > 0).sort((a: any, b: any) => b.outstanding - a.outstanding).slice(0, 5);

  // Expenses
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashIn = (cashEntries || []).filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashOut = (cashEntries || []).filter((e: any) => e.type === "debit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  return NextResponse.json({
    products: toCamelArray(products || []),
    customers: toCamelArray(customers || []),
    enquiries: toCamelArray(enquiries || []),
    quotations: toCamelArray(quotations || []),
    invoices: toCamelArray(invoices || []),
    installations: toCamelArray(installations || []),
    amcContracts: toCamelArray(amcContracts || []),
    transactions: toCamelArray(transactions || []),
    summary: {
      monthlyRevenue,
      totalOutstanding,
      customerCount: (customers || []).length,
      pendingQuotationsAmt: pendingAmt,
      pendingQuotationsCount: pendingQuotations.length,
      inventoryValue: invValue,
      inventoryUnits: invUnits,
      totalExpenses,
      cashIn,
      cashOut,
      netCash: cashIn - cashOut,
      overdueCount: overdueInvoices.length,
      lowStockCount: lowStock.length,
      amcExpiringCount: amcExpiring.length,
    },
    months,
    lowStock: toCamelArray(lowStock),
    amcExpiring,
    customerBalances,
    recentTransactions: toCamelArray((transactions || []).slice(0, 8)),
  });
}

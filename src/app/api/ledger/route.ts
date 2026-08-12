import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { fetchAll, toCamel, toCamelArray } from "@/lib/raw-db";

// GET /api/ledger
// Returns: customer balances, supplier balances, recent transactions, summary
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  // Fetch all data via REST API (HTTPS, no pool limit)
  const [customers, invoices, suppliers, transactions, expenses, cashEntries] = await Promise.all([
    fetchAll("customers", "name.asc", 100),
    fetchAll("invoices", "created_at.desc", 200),
    fetchAll("supplier_orders", "created_at.desc", 100),
    fetchAll("transactions", "transaction_date.desc", 500),
    fetchAll("expenses", "expense_date.desc", 100),
    fetchAll("cash_book", "entry_date.desc", 100),
  ]);

  // Filter transactions by date if provided
  let filteredTxns = transactions;
  if (fromDate) filteredTxns = filteredTxns.filter((t: any) => t.transaction_date >= fromDate);
  if (toDate) filteredTxns = filteredTxns.filter((t: any) => t.transaction_date <= toDate);

  // === CUSTOMER LEDGER ===
  const customerBalances = (customers || []).map((c: any) => {
    const custInvoices = (invoices || []).filter((i: any) => i.customer_id === c.id || i.customer_name === c.name);
    const totalInvoiced = custInvoices.reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);
    const totalPaid = custInvoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + Number(i.grand_total || 0), 0);

    // Also include manual transactions (credit = more debt, debit = payment)
    const custTxns = (filteredTxns || []).filter((t: any) => t.party_type === "customer" && (t.party_id === c.id || t.party_name === c.name));
    const manualCredit = custTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const manualDebit = custTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);

    const outstanding = totalInvoiced - totalPaid + manualCredit - manualDebit;
    const unpaidCount = custInvoices.filter((i: any) => i.status !== "paid").length;
    const lastDate = custInvoices.length > 0
      ? custInvoices.map((i: any) => i.invoice_date).sort().reverse()[0]
      : (custTxns.length > 0 ? custTxns[0].transaction_date : null);

    return {
      ...toCamel(c),
      totalInvoiced,
      totalPaid,
      manualCredit,
      manualDebit,
      outstanding,
      unpaidCount,
      invoiceCount: custInvoices.length,
      lastTransactionDate: lastDate,
    };
  }).sort((a: any, b: any) => b.outstanding - a.outstanding);

  // === SUPPLIER LEDGER ===
  const supplierBalances = (suppliers || []).reduce((acc: any[], s: any) => {
    const supplierName = s.supplier_name;
    const existing = acc.find((a) => a.name === supplierName);
    if (existing) {
      existing.totalOrders += Number(s.amount || 0);
      if (s.status === "pending") existing.pendingAmount += Number(s.amount || 0);
    } else {
      acc.push({
        name: supplierName,
        totalOrders: Number(s.amount || 0),
        pendingAmount: s.status === "pending" ? Number(s.amount || 0) : 0,
        pendingCount: s.status === "pending" ? 1 : 0,
        orderCount: 1,
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => b.pendingAmount - a.pendingAmount);

  // Add supplier transactions (payments made to suppliers)
  supplierBalances.forEach((sup: any) => {
    const supTxns = (filteredTxns || []).filter((t: any) => t.party_type === "supplier" && t.party_name === sup.name);
    sup.totalPaid = supTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    sup.outstanding = sup.totalOrders - sup.totalPaid;
  });

  // === SUMMARY ===
  const totalCustomerInvoiced = customerBalances.reduce((s: number, c: any) => s + c.totalInvoiced, 0);
  const totalCustomerPaid = customerBalances.reduce((s: number, c: any) => s + c.totalPaid, 0);
  const totalCustomerOutstanding = customerBalances.reduce((s: number, c: any) => s + c.outstanding, 0);
  const totalSupplierOrders = supplierBalances.reduce((s: number, c: any) => s + c.totalOrders, 0);
  const totalSupplierPaid = supplierBalances.reduce((s: number, c: any) => s + (c.totalPaid || 0), 0);
  const totalSupplierOutstanding = supplierBalances.reduce((s: number, c: any) => s + (c.outstanding || 0), 0);
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashIn = (cashEntries || []).filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashOut = (cashEntries || []).filter((e: any) => e.type === "debit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  const summary = {
    totalCustomerInvoiced,
    totalCustomerPaid,
    totalCustomerOutstanding,
    customersWithDues: customerBalances.filter((c: any) => c.outstanding > 0).length,
    customerCount: (customers || []).length,
    totalSupplierOrders,
    totalSupplierPaid,
    totalSupplierOutstanding,
    suppliersWithDues: supplierBalances.filter((s: any) => s.outstanding > 0).length,
    totalExpenses,
    cashIn,
    cashOut,
    netCash: cashIn - cashOut,
  };

  return NextResponse.json({
    summary,
    customers: customerBalances,
    suppliers: supplierBalances,
    transactions: toCamelArray(filteredTxns || []),
    recentExpenses: (expenses || []).slice(0, 5),
    recentCashEntries: (cashEntries || []).slice(0, 5),
  });
}

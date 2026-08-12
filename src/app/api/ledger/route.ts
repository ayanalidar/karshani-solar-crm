import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { fetchAll, fetchBy, toCamel, toCamelArray } from "@/lib/raw-db";

// GET /api/ledger
// Returns: customer balances, supplier balances, recent transactions, summary
export async function GET(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  const [customers, suppliers, transactions, expenses, cashEntries] = await Promise.all([
    fetchAll("customers", "name.asc", 100),
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
  // Outstanding = sum of all credit transactions - sum of all debit transactions
  // Credit = customer owes more (invoice generated, udhaar given)
  // Debit = customer paid (payment received)
  // We DON'T count invoices separately — the billing checkout already creates
  // a credit transaction for the full invoice amount. Counting both would
  // double-count.
  const customerBalances = (customers || []).map((c: any) => {
    const custTxns = (filteredTxns || []).filter((t: any) =>
      t.party_type === "customer" && (t.party_id === c.id || t.party_name === c.name)
    );
    const totalCredit = custTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const totalDebit = custTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const outstanding = totalCredit - totalDebit;

    const lastDate = custTxns.length > 0
      ? custTxns.map((t: any) => t.transaction_date).sort().reverse()[0]
      : null;

    return {
      ...toCamel(c),
      totalInvoiced: totalCredit,  // total credit = total billed
      totalPaid: totalDebit,      // total debit = total paid
      outstanding: Math.max(0, outstanding), // never show negative
      invoiceCount: custTxns.filter((t: any) => t.reference_type === "invoice").length,
      txnCount: custTxns.length,
      lastTransactionDate: lastDate,
    };
  }).sort((a: any, b: any) => b.outstanding - a.outstanding);

  // === SUPPLIER LEDGER ===
  const supplierMap: Record<string, { name: string; totalOrders: number; orderCount: number }> = {};
  (suppliers || []).forEach((s: any) => {
    const name = s.supplier_name;
    if (!supplierMap[name]) supplierMap[name] = { name, totalOrders: 0, orderCount: 0 };
    supplierMap[name].totalOrders += Number(s.amount || 0);
    supplierMap[name].orderCount++;
  });

  const supplierBalances = Object.values(supplierMap).map((sup: any) => {
    const supTxns = (filteredTxns || []).filter((t: any) => t.party_type === "supplier" && t.party_name === sup.name);
    const totalCredit = supTxns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const totalDebit = supTxns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    // Supplier: credit = we owe them more (they gave us stock), debit = we paid them
    const outstanding = sup.totalOrders + totalCredit - totalDebit;
    return {
      ...sup,
      totalPaid: totalDebit,
      outstanding: Math.max(0, outstanding),
    };
  }).sort((a: any, b: any) => b.outstanding - a.outstanding);

  // === SUMMARY ===
  const totalCustomerOutstanding = customerBalances.reduce((s: number, c: any) => s + c.outstanding, 0);
  const totalSupplierOutstanding = supplierBalances.reduce((s: number, c: any) => s + c.outstanding, 0);
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashIn = (cashEntries || []).filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const cashOut = (cashEntries || []).filter((e: any) => e.type === "debit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

  const summary = {
    totalCustomerInvoiced: customerBalances.reduce((s: number, c: any) => s + c.totalInvoiced, 0),
    totalCustomerPaid: customerBalances.reduce((s: number, c: any) => s + c.totalPaid, 0),
    totalCustomerOutstanding,
    customersWithDues: customerBalances.filter((c: any) => c.outstanding > 0).length,
    customerCount: (customers || []).length,
    totalSupplierOrders: supplierBalances.reduce((s: number, c: any) => s + c.totalOrders, 0),
    totalSupplierPaid: supplierBalances.reduce((s: number, c: any) => s + (c.totalPaid || 0), 0),
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

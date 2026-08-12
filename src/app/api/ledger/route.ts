import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { rawSelect, toCamelArray } from "@/lib/raw-db";

// GET /api/ledger
// Returns customer balances + transaction summaries.
// For each customer: totalInvoiced, totalPaid, outstanding, invoiceCount,
// lastTransactionDate.
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  // Fetch customers + invoices
  let customers = await prisma.customer.findMany({
    select: { id: true, name: true, phone: true, city: true, totalPurchases: true },
    take: 100,
  });
  let invoices = await prisma.invoice.findMany({
    select: { id: true, customerId: true, customerName: true, grandTotal: true, status: true, invoiceDate: true, invoiceNo: true },
    take: 200,
  });
  let expenses = await prisma.expense.findMany({
    select: { id: true, amount: true, expenseDate: true, category: true, description: true },
    take: 100,
  });
  let cashEntries = await prisma.cashBookEntry.findMany({
    select: { id: true, type: true, amount: true, entryDate: true, description: true },
    take: 100,
  });

  // REST API fallback if Prisma returned empty (pool exhausted)
  if ((!customers || customers.length === 0)) {
    const rows = await rawSelect("customers", "name.asc", 100);
    if (rows) customers = toCamelArray(rows) as any;
  }
  if ((!invoices || invoices.length === 0)) {
    const rows = await rawSelect("invoices", "created_at.desc", 200);
    if (rows) invoices = toCamelArray(rows) as any;
  }
  if ((!expenses || expenses.length === 0)) {
    const rows = await rawSelect("expenses", "expense_date.desc", 100);
    if (rows) expenses = toCamelArray(rows) as any;
  }
  if ((!cashEntries || cashEntries.length === 0)) {
    const rows = await rawSelect("cash_book", "entry_date.desc", 100);
    if (rows) cashEntries = toCamelArray(rows) as any;
  }

  // Build customer balances
  const customerBalances = (customers || []).map((c: any) => {
    const custInvoices = (invoices || []).filter((i: any) => i.customerId === c.id || i.customerName === c.name);
    const totalInvoiced = custInvoices.reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);
    const totalPaid = custInvoices
      .filter((i: any) => i.status === "paid")
      .reduce((s: number, i: any) => s + Number(i.grandTotal || 0), 0);
    const outstanding = totalInvoiced - totalPaid;
    const unpaidCount = custInvoices.filter((i: any) => i.status !== "paid").length;
    const lastInvoiceDate = custInvoices.length > 0
      ? custInvoices.map((i: any) => i.invoiceDate).sort().reverse()[0]
      : null;

    return {
      ...c,
      totalInvoiced,
      totalPaid,
      outstanding,
      unpaidCount,
      invoiceCount: custInvoices.length,
      lastTransactionDate: lastInvoiceDate,
    };
  });

  // Sort by outstanding (highest first)
  customerBalances.sort((a: any, b: any) => b.outstanding - a.outstanding);

  // Summary totals
  const summary = {
    totalInvoiced: customerBalances.reduce((s: number, c: any) => s + c.totalInvoiced, 0),
    totalPaid: customerBalances.reduce((s: number, c: any) => s + c.totalPaid, 0),
    totalOutstanding: customerBalances.reduce((s: number, c: any) => s + c.outstanding, 0),
    totalExpenses: (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
    cashIn: (cashEntries || []).filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
    cashOut: (cashEntries || []).filter((e: any) => e.type === "debit").reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
    netCash: 0,
    customerCount: (customers || []).length,
    customersWithDues: customerBalances.filter((c: any) => c.outstanding > 0).length,
  };
  summary.netCash = summary.cashIn - summary.cashOut;

  return NextResponse.json({
    summary,
    customers: customerBalances,
    recentExpenses: (expenses || []).slice(0, 5),
    recentCashEntries: (cashEntries || []).slice(0, 5),
  });
}

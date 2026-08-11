import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

// Export all CRM data as JSON for offline backup.
// GET /api/backup returns a downloadable JSON file.
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  // Fetch all tables in parallel
  const [
    users,
    products,
    customers,
    enquiries,
    quotations,
    quotationItems,
    invoices,
    invoiceItems,
    installations,
    supplierOrders,
    expenses,
    cashBook,
    amcContracts,
    employees,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.enquiry.findMany(),
    prisma.quotation.findMany({ include: { items: true } }),
    prisma.quotationItem.findMany(),
    prisma.invoice.findMany({ include: { items: true } }),
    prisma.invoiceItem.findMany(),
    prisma.installation.findMany(),
    prisma.supplierOrder.findMany(),
    prisma.expense.findMany(),
    prisma.cashBookEntry.findMany(),
    prisma.amcContract.findMany(),
    prisma.employee.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    counts: {
      users: (users as any[]).length,
      products: (products as any[]).length,
      customers: (customers as any[]).length,
      enquiries: (enquiries as any[]).length,
      quotations: (quotations as any[]).length,
      quotationItems: (quotationItems as any[]).length,
      invoices: (invoices as any[]).length,
      invoiceItems: (invoiceItems as any[]).length,
      installations: (installations as any[]).length,
      supplierOrders: (supplierOrders as any[]).length,
      expenses: (expenses as any[]).length,
      cashBook: (cashBook as any[]).length,
      amcContracts: (amcContracts as any[]).length,
      employees: (employees as any[]).length,
    },
    data: {
      // Strip PINs from users for security
      users: (users as any[]).map((u) => ({ id: u.id, name: u.name, role: u.role, createdAt: u.createdAt })),
      products,
      customers,
      enquiries,
      quotations,
      quotationItems,
      invoices,
      invoiceItems,
      installations,
      supplierOrders,
      expenses,
      cashBook,
      amcContracts,
      employees,
    },
  };

  const filename = `karshani-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

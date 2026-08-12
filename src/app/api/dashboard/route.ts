import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";

// Dashboard data endpoint — returns all data needed for the dashboard
// in a single API call. Used by the dashboard page (which fetches via
// this API instead of using Prisma directly — more reliable on Vercel).
export async function GET() {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  const [products, customers, enquiries, quotations, invoices, installations, amcContracts] = await Promise.all([
    prisma.product.findMany({ select: { id: true, name: true, category: true, unitPrice: true, stockQuantity: true } }),
    prisma.customer.findMany({ select: { id: true } }),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, systemDescription: true, status: true } }),
    prisma.quotation.findMany({ where: { status: "sent" }, select: { id: true, grandTotal: true } }),
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, invoiceNo: true, customerName: true, grandTotal: true, invoiceDate: true, status: true, createdAt: true },
    }),
    prisma.installation.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, systemDescription: true, installDate: true, team: true, stage: true } }),
    prisma.amcContract.findMany({ select: { id: true, customerName: true, system: true, expiryDate: true } }),
  ]);

  return NextResponse.json({
    products: products || [],
    customers: customers || [],
    enquiries: enquiries || [],
    quotations: quotations || [],
    invoices: invoices || [],
    installations: installations || [],
    amcContracts: amcContracts || [],
  });
}

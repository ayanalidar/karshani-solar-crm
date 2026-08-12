import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-check";
import { NextResponse } from "next/server";
import { fetchOne, fetchBy, toCamel } from "@/lib/raw-db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;

  // Use REST API for reliability
  const invRow = await fetchOne("invoices", id);
  if (!invRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const itemRows = await fetchBy("invoice_items", "invoice_id", id, "created_at.asc", 100);

  // Fetch linked transactions to calculate balance
  const txns = await fetchBy("transactions", "reference_id", id, "transaction_date.desc", 50);
  const totalCredit = txns.filter((t: any) => t.type === "credit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const totalDebit = txns.filter((t: any) => t.type === "debit").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const balanceDue = Math.max(0, totalCredit - totalDebit);

  const invoice = {
    ...toCamel(invRow),
    items: itemRows.map((i: any) => toCamel(i)),
    balanceDue,
    totalPaid: totalDebit,
    transactions: txns.map((t: any) => toCamel(t)),
  };

  return NextResponse.json(invoice);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  const data = await request.json();

  // Use rawUpdate for reliability
  const updateData: Record<string, any> = {};
  if (data.status !== undefined) updateData.status = String(data.status).trim();
  if (data.dueDate !== undefined) updateData.due_date = String(data.dueDate);
  if (data.customerName !== undefined) updateData.customer_name = String(data.customerName).trim();

  // Try Prisma first
  let invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: String(data.status).trim() }),
      ...(data.dueDate !== undefined && { dueDate: String(data.dueDate) }),
    },
  }).catch(() => null);

  // Fallback to REST API
  if (!invoice) {
    const { rawUpdate } = await import("@/lib/raw-db");
    const row = await rawUpdate("invoices", id, updateData);
    if (!row) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    invoice = toCamel(row) as any;
  }

  return NextResponse.json(invoice);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.invoice.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

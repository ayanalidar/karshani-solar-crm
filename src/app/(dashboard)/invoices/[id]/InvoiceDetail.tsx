"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { formatINR, formatDate, todayISO } from "@/lib/format";

type Invoice = {
  id: string;
  invoiceNo: string;
  customerName: string;
  description: string;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  invoiceDate: string;
  dueDate: string;
  status: string;
  printedAt?: string | Date | null;
  printCount?: number;
  balanceDue?: number;
  totalPaid?: number;
  items: Array<{
    id: string;
    itemName: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    gstPercentage: number;
    amount: number;
  }>;
};

export function InvoiceDetail({ invoice, baseUrl }: { invoice: Invoice; baseUrl: string }) {
  const router = useRouter();
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(invoice.status);
  const [dueDate, setDueDate] = useState(invoice.dueDate || todayISO());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const shareUrl = `${baseUrl}/invoices/${invoice.id}/pdf`;
  const waText = `Hello ${invoice.customerName}, here is invoice ${invoice.invoiceNo} for ${formatINR(invoice.grandTotal)}. View: ${shareUrl}`;
  const waNumber = invoice.customerName?.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  // Print tracking
  const isPrinted = (invoice.printCount || 0) > 0;
  const printLabel = isPrinted ? "🖨 Reprint" : "🖨 Print";
  const printUrl = `/invoices/${invoice.id}/pdf?print=true`;

  // Email integration
  const emailSubject = `Invoice ${invoice.invoiceNo} from Karshani Enterprises — ${formatINR(invoice.grandTotal)}`;
  const emailBody = `Hello ${invoice.customerName},\n\nPlease find your invoice below:\n\nInvoice No: ${invoice.invoiceNo}\nDate: ${formatDate(invoice.invoiceDate)}\nAmount: ${formatINR(invoice.grandTotal)}\nStatus: ${invoice.status.toUpperCase()}\n\nView online: ${shareUrl}\n\n— Karshani Enterprises\nPhone: 9720669669\nEmail: enterpriseskarshani@gmail.com`;
  const emailLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const updateStatus = async () => {
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, dueDate }),
    });
    setStatusModal(false);
    router.refresh();
  };

  const markPaid = async () => {
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-sm text-[#787468] hover:text-amber-700">← Invoices</Link>
          <h2 className="font-serif text-lg">
            {invoice.invoiceNo}{" "}
            <span className="ml-2"><StatusPill status={invoice.status} /></span>
            {/* Balance due badge — shows outstanding amount */}
            {(invoice.balanceDue ?? 0) > 0 ? (
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900">
                Due {formatINR(invoice.balanceDue || 0)}
              </span>
            ) : (invoice.totalPaid ?? 0) > 0 ? (
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900">
                Paid {formatINR(invoice.totalPaid || 0)} · Balance ₹0
              </span>
            ) : null}
            {/* Print status badge */}
            {isPrinted ? (
              <span
                className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200"
                title={`Last printed: ${invoice.printedAt ? formatDate(String(invoice.printedAt)) : "unknown"}`}
              >
                🖨 Printed {invoice.printCount}× · {invoice.printedAt ? formatDate(String(invoice.printedAt)) : ""}
              </span>
            ) : (
              <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                Not printed yet
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / Reprint button — opens /pdf?print=true in new tab */}
          <a
            href={printUrl}
            target="_blank"
            rel="noreferrer"
            className={`px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-1.5 ${
              isPrinted
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
            title={isPrinted ? `Reprint — already printed ${invoice.printCount} time(s)` : "Print this invoice"}
          >
            {printLabel}
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5"
          >
            <span>💬</span> WhatsApp
          </a>
          <a
            href={emailLink}
            className="bg-white border border-[#e6e0d4] text-[#1c1915] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] flex items-center gap-1.5"
          >
            <span>✉️</span> Email
          </a>
          <Link
            href={`/invoices/${invoice.id}/pdf`}
            className="bg-white border border-[#e6e0d4] text-[#1c1915] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] flex items-center gap-1.5"
          >
            <span>📄</span> View PDF
          </Link>
          {invoice.status !== "paid" && (
            <button
              onClick={markPaid}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700"
            >
              Mark Paid
            </button>
          )}
          <button
            onClick={() => setStatusModal(true)}
            className="bg-white border border-[#e6e0d4] text-[#1c1915] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0]"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="bg-white border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[2fr_1fr] max-lg:grid-cols-1">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 min-w-0 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Items</h3>
          {invoice.items.length === 0 ? (
            <p className="text-sm text-[#787468] py-4 text-center">
              No line items. {invoice.description && `Description: ${invoice.description}`}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">HSN</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Unit ₹</th>
                  <th className="text-right py-2">GST</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((i) => (
                  <tr key={i.id} className="border-b border-[#ede8dc]">
                    <td className="py-2 font-medium">{i.itemName}</td>
                    <td className="py-2 text-xs font-mono">{i.hsnCode || "—"}</td>
                    <td className="py-2 text-right">{i.quantity}</td>
                    <td className="py-2 text-right">{formatINR(i.unitPrice)}</td>
                    <td className="py-2 text-right text-xs">{i.gstPercentage}%</td>
                    <td className="py-2 text-right font-medium">{formatINR(i.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t-2 border-[#1c1915] mt-2 pt-3">
            <div className="flex justify-between text-sm py-0.5"><span>Subtotal</span><span>{formatINR(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm py-0.5 text-[#504d44]"><span>GST</span><span>{formatINR(invoice.gstTotal)}</span></div>
            <div className="flex justify-between font-serif text-base py-2 border-t border-[#e6e0d4] mt-1"><span>Grand Total</span><span>{formatINR(invoice.grandTotal)}</span></div>
            {(invoice.totalPaid ?? 0) > 0 && (
              <>
                <div className="flex justify-between text-sm py-0.5 text-green-700 dark:text-green-400"><span>Paid</span><span>{formatINR(invoice.totalPaid || 0)}</span></div>
                <div className="flex justify-between font-semibold text-sm py-1 border-t border-[#e6e0d4] mt-1">
                  <span className={invoice.balanceDue ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}>
                    {invoice.balanceDue ? "Balance Due" : "Fully Paid"}
                  </span>
                  <span className={invoice.balanceDue ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}>
                    {formatINR(invoice.balanceDue || 0)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 space-y-2 text-sm">
          <h3 className="text-sm font-semibold mb-3">Customer</h3>
          <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">Name</span><div className="font-semibold">{invoice.customerName}</div></div>
          {invoice.description && (
            <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">Description</span><div className="text-xs">{invoice.description}</div></div>
          )}
          <div className="pt-2 border-t border-[#ede8dc]">
            <span className="text-[10px] uppercase text-[#787468] tracking-wider">Invoice Date</span>
            <div>{formatDate(invoice.invoiceDate)}</div>
          </div>
          {invoice.dueDate && (
            <div>
              <span className="text-[10px] uppercase text-[#787468] tracking-wider">Due Date</span>
              <div>{formatDate(invoice.dueDate)}</div>
            </div>
          )}
        </div>
      </div>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Edit Invoice">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            >
              <option value="due">Due</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setStatusModal(false)} className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] text-[#504d44] hover:bg-[#faf6f0]">Cancel</button>
            <button onClick={updateStatus} className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700">Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
          router.push("/invoices");
        }}
        title="Delete invoice?"
        message="This permanently deletes the invoice and its line items. Stock was already deducted at sale time and will NOT be restored."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

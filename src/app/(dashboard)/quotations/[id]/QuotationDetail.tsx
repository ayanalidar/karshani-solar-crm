"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusPill } from "@/components/StatusPill";
import { formatINR, formatDate } from "@/lib/format";

type Quotation = {
  id: string;
  estimateNo: string;
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  systemDescription: string;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  quoteDate: string;
  status: string;
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

export function QuotationDetail({ quotation, baseUrl }: { quotation: Quotation; baseUrl: string }) {
  const router = useRouter();
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState(quotation.status);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const pdfUrl = `${baseUrl}/quotations/${quotation.id}/pdf`;
  const shareUrl = `${baseUrl}/quotations/${quotation.id}/pdf`;

  const waText = `Hello ${quotation.customerName}, here is your quotation ${quotation.estimateNo} for ${formatINR(quotation.grandTotal)}. View: ${shareUrl}`;
  const waNumber = quotation.customerPhone.replace(/[^0-9]/g, "");
  const waLink = waNumber
    ? `https://wa.me/${waNumber.length === 10 ? "91" + waNumber : waNumber}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const updateStatus = async () => {
    await fetch(`/api/quotations/${quotation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatusModal(false);
    router.refresh();
  };

  const convertToInvoice = async () => {
    setConverting(true);
    setConvertError("");
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/convert`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      const inv = await res.json();
      setCreatedInvoiceId(inv.id);
      router.refresh();
    } catch (e: any) {
      setConvertError(e.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-sm text-[#787468] hover:text-amber-700">← Quotations</Link>
          <h2 className="font-serif text-lg">
            {quotation.estimateNo}{" "}
            <span className="ml-2"><StatusPill status={quotation.status} /></span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700 flex items-center gap-1.5"
          >
            <span>💬</span> WhatsApp
          </a>
          <Link
            href={`/quotations/${quotation.id}/pdf`}
            className="bg-white border border-[#e6e0d4] text-[#1c1915] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0] flex items-center gap-1.5"
          >
            <span>📄</span> PDF
          </Link>
          <button
            onClick={() => setStatusModal(true)}
            className="bg-white border border-[#e6e0d4] text-[#1c1915] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[#faf6f0]"
          >
            Change Status
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="bg-white border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {createdInvoiceId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-2">
          <div className="text-sm text-green-800">
            ✓ Converted to invoice. Stock will be deducted at invoice time.
          </div>
          <Link
            href={`/invoices/${createdInvoiceId}`}
            className="text-xs font-semibold bg-green-600 text-white border border-green-600 px-3 py-1 rounded hover:bg-green-700"
          >
            View Invoice →
          </Link>
        </div>
      )}

      {(quotation.status === "sent" || quotation.status === "negotiating") && !createdInvoiceId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-2">
          <div className="text-sm text-amber-800">
            <strong>Customer accepted?</strong> Convert this quotation into an invoice with one click.
          </div>
          <button
            onClick={convertToInvoice}
            disabled={converting}
            className="text-xs font-semibold bg-amber-600 text-white border border-amber-600 px-3 py-1.5 rounded hover:bg-amber-700 disabled:opacity-50"
          >
            {converting ? "Converting…" : "Convert to Invoice →"}
          </button>
        </div>
      )}

      {convertError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">{convertError}</div>
      )}

      <div className="grid gap-4 grid-cols-[2fr_1fr] max-lg:grid-cols-1">
        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 min-w-0 overflow-x-auto">
          <h3 className="text-sm font-semibold mb-3">Items</h3>
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
              {quotation.items.map((i) => (
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
          <div className="border-t-2 border-[#1c1915] mt-2 pt-3">
            <div className="flex justify-between text-sm py-0.5"><span>Subtotal</span><span>{formatINR(quotation.subtotal)}</span></div>
            <div className="flex justify-between text-sm py-0.5 text-[#504d44]"><span>GST</span><span>{formatINR(quotation.gstTotal)}</span></div>
            <div className="flex justify-between font-serif text-base py-2 border-t border-[#e6e0d4] mt-1"><span>Grand Total</span><span>{formatINR(quotation.grandTotal)}</span></div>
          </div>
        </div>

        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 space-y-2 text-sm">
          <h3 className="text-sm font-semibold mb-3">Customer</h3>
          <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">Name</span><div className="font-semibold">{quotation.customerName}</div></div>
          {quotation.customerPhone && <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">Phone</span><div className="font-mono text-xs">{quotation.customerPhone}</div></div>}
          {quotation.customerLocation && <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">Location</span><div>{quotation.customerLocation}</div></div>}
          {quotation.systemDescription && <div><span className="text-[10px] uppercase text-[#787468] tracking-wider">System</span><div className="text-xs">{quotation.systemDescription}</div></div>}
          <div className="pt-2 border-t border-[#ede8dc]">
            <span className="text-[10px] uppercase text-[#787468] tracking-wider">Quote Date</span>
            <div>{formatDate(quotation.quoteDate)}</div>
          </div>
        </div>
      </div>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Change Status">
        <div className="space-y-3">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
          >
            <option value="sent">Sent</option>
            <option value="negotiating">Negotiating</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
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
          await fetch(`/api/quotations/${quotation.id}`, { method: "DELETE" });
          router.push("/quotations");
        }}
        title="Delete quotation?"
        message="This permanently deletes the quotation and all its line items."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

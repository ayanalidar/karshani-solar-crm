import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatINR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuotationPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!q) notFound();

  return (
    <div className="print-container bg-white text-black p-8 max-w-[800px] mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @page { margin: 12mm; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-amber-600 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="Karshani" className="w-14 h-14 rounded-full object-cover border-2 border-amber-200" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">KARSHANI ENTERPRISES</h1>
            <p className="text-xs text-gray-600">Solar Energy Solutions · Mathura, UP</p>
            <p className="text-xs text-gray-600">GSTIN: 09XXXXX0000X1Z5 · Phone: +91 98765 43210</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-700">QUOTATION</div>
          <div className="text-xs text-gray-700 font-mono">{q.estimateNo}</div>
          <div className="text-xs text-gray-700 mt-1">Date: {formatDate(q.quoteDate)}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Bill To</div>
          <div className="font-semibold">{q.customerName}</div>
          {q.customerPhone && <div className="text-xs text-gray-700 font-mono">{q.customerPhone}</div>}
          {q.customerLocation && <div className="text-xs text-gray-700">{q.customerLocation}</div>}
        </div>
        <div className="text-right">
          {q.systemDescription && (
            <>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">System</div>
              <div className="text-xs">{q.systemDescription}</div>
            </>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="w-full text-sm border border-gray-300 mb-4" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr className="bg-gray-100 border-b border-gray-300 text-[10px] uppercase tracking-wider">
            <th className="text-left p-2 border-r border-gray-300">#</th>
            <th className="text-left p-2 border-r border-gray-300">Item</th>
            <th className="text-left p-2 border-r border-gray-300">HSN</th>
            <th className="text-right p-2 border-r border-gray-300">Qty</th>
            <th className="text-right p-2 border-r border-gray-300">Unit ₹</th>
            <th className="text-right p-2">Amount ₹</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((i, idx) => (
            <tr key={i.id} className="border-b border-gray-200">
              <td className="p-2 border-r border-gray-200 text-xs text-gray-600">{idx + 1}</td>
              <td className="p-2 border-r border-gray-200">{i.itemName}</td>
              <td className="p-2 border-r border-gray-200 text-xs font-mono text-gray-700">{i.hsnCode || "—"}</td>
              <td className="p-2 border-r border-gray-200 text-right">{i.quantity}</td>
              <td className="p-2 border-r border-gray-200 text-right">{i.unitPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
              <td className="p-2 text-right font-medium">{i.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 text-sm">
          <div className="flex justify-between py-1"><span>Subtotal</span><span>{formatINR(q.subtotal)}</span></div>
          <div className="flex justify-between py-1 text-gray-700"><span>GST</span><span>{formatINR(q.gstTotal)}</span></div>
          <div className="flex justify-between py-2 border-t-2 border-black font-bold text-base"><span>Grand Total</span><span>{formatINR(q.grandTotal)}</span></div>
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-600 mb-8">
        <div className="font-semibold mb-1">Terms &amp; Conditions:</div>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Prices are valid for 30 days from quotation date.</li>
          <li>GST included as per applicable rates.</li>
          <li>Installation charges extra if not mentioned in scope.</li>
          <li>Warranty: 25 years on panels, 5 years on inverters, 3-5 years on batteries (manufacturer terms apply).</li>
          <li>Payment terms: 50% advance, 50% on installation.</li>
        </ol>
      </div>

      {/* Sign-off */}
      <div className="flex justify-between items-end mt-12">
        <div className="text-xs text-gray-600">
          <div>For any queries, contact: +91 98765 43210</div>
          <div>Email: contact@karshani.example</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-1 w-48 text-xs text-gray-700">Authorized Signatory</div>
        </div>
      </div>

      <div className="no-print mt-8 text-center">
        <button
          onClick={() => window.print()}
          className="bg-amber-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
        >
          🖨 Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

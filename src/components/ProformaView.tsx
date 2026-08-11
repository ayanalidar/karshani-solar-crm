import { COMPANY } from "@/lib/company";
import { formatINRNumber, formatDate, numberToWords, fiscalYearPrefix } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";
import { renderUpiQrDataUrl } from "@/lib/upi";

export type ProformaItem = {
  id: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  amount: number;
};

export type ProformaData = {
  // Doc identity
  docNo: string; // e.g. "2026-27/210" (proforma) or "INV-2026-0001" (invoice)
  date: string; // ISO date
  dueDate?: string;

  // Customer
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  customerGstin?: string;
  customerState?: string;

  // Line items + totals
  items: ProformaItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;

  // Optional system description shown as the first "system" line
  systemDescription?: string;

  // Status (shown on invoice, not proforma)
  status?: string;
};

// Shared layout used for both proforma invoice (quotation) and tax invoice.
// Matches the Karshani Enterprises sample layout pixel-for-pixel.
// NOTE: This component is async because it renders the UPI QR code server-side.
export async function ProformaView({
  data,
  kind,
}: {
  data: ProformaData;
  kind: "proforma" | "tax-invoice";
}) {
  const titleText = kind === "proforma" ? "proforma invoice" : "tax invoice";
  const docLabel = kind === "proforma" ? "Estimate Nos." : "Invoice No.";
  const dateLabel = kind === "proforma" ? "Date" : "Invoice Date";
  const customerHeader = kind === "proforma" ? "Estimate For:" : "Bill To:";
  const metaHeader = kind === "proforma" ? "Estimate Details:" : "Invoice Details:";
  const amountWordsLabel = kind === "proforma" ? "Estimate Amount in Words:" : "Invoice Amount in Words:";

  // Build tax summary grouped by HSN
  const hsnGroups: Record<string, { hsn: string; taxable: number; gstRate: number; gstAmt: number }> = {};
  for (const item of data.items) {
    const hsn = item.hsnCode || "—";
    if (!hsnGroups[hsn]) hsnGroups[hsn] = { hsn, taxable: 0, gstRate: 0, gstAmt: 0 };
    hsnGroups[hsn].taxable += item.amount;
    hsnGroups[hsn].gstRate = Math.max(hsnGroups[hsn].gstRate, item.gstPercentage);
    hsnGroups[hsn].gstAmt += (item.amount * item.gstPercentage) / 100;
  }
  const hsnList = Object.values(hsnGroups);
  const totalTaxable = hsnList.reduce((s, h) => s + h.taxable, 0);
  const totalCgst = data.gstTotal / 2;
  const totalSgst = data.gstTotal / 2;

  const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
  const words = numberToWords(Math.round(data.grandTotal));

  // UPI QR is only shown on proforma invoices, encoded with the bill amount.
  // Tax invoices don't show the QR (per product requirement).
  const upiQrDataUrl =
    kind === "proforma"
      ? await renderUpiQrDataUrl(data.grandTotal, `${data.docNo} ${data.customerName}`.slice(0, 80))
      : null;

  return (
    <div
      className="print-container bg-white text-[#1a1a1a]"
      style={{
        fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        fontSize: "12px",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px 28px",
      }}
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 16mm 14mm; }
          .no-print { display: none !important; }
        }
        @page { margin: 10mm; }
        .pi-table { border-collapse: collapse; width: 100%; }
        .pi-table th, .pi-table td { border: 1px solid #444; padding: 6px 8px; }
        .pi-table thead th { background: #f5f5f5; font-weight: bold; text-align: center; font-size: 11px; }
        .pi-table tfoot td { background: #ececec; font-weight: bold; }
        .pi-meta-box { border: 1px solid #444; padding: 6px 10px; }
        .pi-meta-head { background: #f0f0f0; font-weight: bold; padding: 4px 10px; margin: -6px -10px 6px; border-bottom: 1px solid #444; font-size: 11px; }
        .section-label { font-weight: bold; font-size: 13px; margin: 14px 0 6px; }
        .muted { color: #555; }
        .right { text-align: right; }
        .center { text-align: center; }
        .logo-row { display: flex; align-items: center; gap: 12px; }
        .logo-row img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; }
        .company-name { font-size: 20px; font-weight: bold; letter-spacing: 0.5px; }
        .title-row { text-align: center; margin: 14px 0 8px; }
        .title-row h1 { font-size: 24px; font-weight: bold; text-transform: lowercase; letter-spacing: 1px; margin: 0; }
        .bank-block { display: grid; grid-template-columns: 100px 1fr; gap: 12px; align-items: start; }
        .qr-placeholder { width: 90px; height: 90px; border: 1px dashed #888; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #666; text-align: center; background: #fafafa; }
        .sign-block { text-align: center; width: 200px; }
        .sign-line { border-top: 1px solid #333; margin-top: 36px; padding-top: 4px; font-size: 11px; }
      `}</style>

      {/* Title */}
      <div className="title-row">
        <h1>{titleText}</h1>
      </div>

      {/* Company letterhead */}
      <div
        className="logo-row"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div className="logo-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="Karshani Enterprises" />
          <div>
            <div className="company-name">{COMPANY.name}</div>
            <div className="muted" style={{ fontSize: "11px", marginTop: "2px" }}>
              {COMPANY.addressLine1}
            </div>
            <div className="muted" style={{ fontSize: "11px" }}>
              {COMPANY.addressLine2}
            </div>
            <div className="muted" style={{ fontSize: "11px" }}>
              Phone: {COMPANY.phone}
            </div>
            <div className="muted" style={{ fontSize: "11px" }}>
              GSTIN: {COMPANY.gstin}
            </div>
          </div>
        </div>
        <div className="muted" style={{ textAlign: "right", fontSize: "11px" }}>
          <div>Email: {COMPANY.email}</div>
          <div>State: {COMPANY.state}</div>
        </div>
      </div>

      {/* Estimate For / Estimate Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "16px" }}>
        <div className="pi-meta-box">
          <div className="pi-meta-head">{customerHeader}</div>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>{data.customerName}</div>
          {data.customerLocation && <div className="muted">{data.customerLocation}</div>}
          {data.customerPhone && <div className="muted" style={{ fontSize: "11px" }}>Phone: {data.customerPhone}</div>}
          {data.customerGstin && <div className="muted" style={{ fontSize: "11px" }}>GSTIN: {data.customerGstin}</div>}
          {data.customerState && <div className="muted" style={{ fontSize: "11px" }}>State: {data.customerState}</div>}
        </div>
        <div className="pi-meta-box">
          <div className="pi-meta-head">{metaHeader}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span>{docLabel}:</span>
            <span style={{ fontFamily: "monospace" }}>{data.docNo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span>{dateLabel}:</span>
            <span>{formatDate(data.date)}</span>
          </div>
          {data.dueDate && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>Due Date:</span>
              <span>{formatDate(data.dueDate)}</span>
            </div>
          )}
          {kind === "tax-invoice" && data.status && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
              <span>Status:</span>
              <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>{data.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <table className="pi-table" style={{ marginTop: "14px" }}>
        <thead>
          <tr>
            <th style={{ width: "4%" }}>#</th>
            <th style={{ width: "32%", textAlign: "left" }}>Item name</th>
            <th style={{ width: "10%" }}>HSN / SAC</th>
            <th style={{ width: "7%" }}>Quantity</th>
            <th style={{ width: "6%" }}>Unit</th>
            <th style={{ width: "13%" }}>Price/ Unit (₹)</th>
            <th style={{ width: "14%" }}>GST (₹)</th>
            <th style={{ width: "14%" }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", fontStyle: "italic", color: "#888" }}>
                No line items
              </td>
            </tr>
          ) : (
            data.items.map((item, idx) => {
              const gstAmt = (item.amount * item.gstPercentage) / 100;
              return (
                <tr key={item.id}>
                  <td className="center">{idx + 1}</td>
                  <td>{item.itemName}</td>
                  <td className="center" style={{ fontFamily: "monospace", fontSize: "11px" }}>
                    {item.hsnCode || "—"}
                  </td>
                  <td className="center">{item.quantity}</td>
                  <td className="center">Pcs</td>
                  <td className="right">{formatINRNumber(item.unitPrice)}</td>
                  <td className="right">
                    {formatINRNumber(gstAmt)}
                    <div className="muted" style={{ fontSize: "9px" }}>({item.gstPercentage}%)</div>
                  </td>
                  <td className="right">{formatINRNumber(item.amount)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ textAlign: "left" }}>Total</td>
            <td className="center">{totalQty}</td>
            <td></td>
            <td></td>
            <td className="right">{formatINRNumber(data.gstTotal)}</td>
            <td className="right">{formatINRNumber(data.subtotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Tax Summary */}
      <div className="section-label">Tax Summary:</div>
      <table className="pi-table">
        <thead>
          <tr>
            <th rowSpan={1} style={{ width: "16%" }}>HSN/SAC</th>
            <th style={{ width: "20%" }}>Taxable amount (₹)</th>
            <th colSpan={2}>CGST</th>
            <th colSpan={2}>SGST</th>
            <th style={{ width: "16%" }}>Total Tax (₹)</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th style={{ width: "8%" }}>Rate (%)</th>
            <th style={{ width: "12%" }}>Amt (₹)</th>
            <th style={{ width: "8%" }}>Rate (%)</th>
            <th style={{ width: "12%" }}>Amt (₹)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {hsnList.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", fontStyle: "italic", color: "#888" }}>—</td>
            </tr>
          ) : (
            hsnList.map((h) => {
              const cgstRate = h.gstRate / 2;
              const cgstAmt = h.gstAmt / 2;
              const sgstRate = h.gstRate / 2;
              const sgstAmt = h.gstAmt / 2;
              return (
                <tr key={hsnList.indexOf(h)}>
                  <td className="center" style={{ fontFamily: "monospace" }}>{h.hsn}</td>
                  <td className="right">{formatINRNumber(h.taxable)}</td>
                  <td className="center">{cgstRate}</td>
                  <td className="right">{formatINRNumber(cgstAmt)}</td>
                  <td className="center">{sgstRate}</td>
                  <td className="right">{formatINRNumber(sgstAmt)}</td>
                  <td className="right">{formatINRNumber(h.gstAmt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ textAlign: "left" }}>TOTAL</td>
            <td className="right">{formatINRNumber(totalTaxable)}</td>
            <td></td>
            <td className="right">{formatINRNumber(totalCgst)}</td>
            <td></td>
            <td className="right">{formatINRNumber(totalSgst)}</td>
            <td className="right">{formatINRNumber(data.gstTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Totals + Amount in words */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "12px", marginTop: "14px" }}>
        <div>
          <div className="section-label">{amountWordsLabel}</div>
          <div style={{ fontStyle: "italic" }}>
            {words} Rupees only
          </div>
        </div>
        <div>
          <table className="pi-table">
            <tbody>
              <tr>
                <td style={{ textAlign: "left" }}>Sub Total</td>
                <td className="right">{formatINRNumber(data.subtotal)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "left" }}>GST Total</td>
                <td className="right">{formatINRNumber(data.gstTotal)}</td>
              </tr>
              <tr>
                <td style={{ textAlign: "left", fontWeight: "bold", fontSize: "13px" }}>Total</td>
                <td className="right" style={{ fontWeight: "bold", fontSize: "13px" }}>
                  {formatINRNumber(data.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms */}
      <div style={{ marginTop: "18px" }}>
        <div className="section-label">Terms &amp; Conditions:</div>
        <div className="muted" style={{ fontSize: "11px" }}>
          Thanks for doing business with us!
        </div>
        <ol className="muted" style={{ fontSize: "11px", margin: "6px 0 0 16px", padding: 0 }}>
          <li>Prices are valid for 30 days from the date of this {kind === "proforma" ? "estimate" : "invoice"}.</li>
          <li>GST included as per applicable rates. CGST + SGST split shown in tax summary.</li>
          <li>Warranty: 25 years on panels, 5 years on inverters, 3-5 years on batteries (manufacturer terms apply).</li>
          <li>Payment terms: 50% advance with order, 50% on installation.</li>
          <li>Subject to Mathura jurisdiction only.</li>
        </ol>
      </div>

      {/* Bank Details + Signature */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", marginTop: "20px" }}>
        <div>
          <div className="section-label">Bank Details:</div>
          <div className="bank-block" style={{ marginTop: "6px" }}>
            {upiQrDataUrl ? (
              // Real UPI QR code (proforma only) — encodes the bill amount
              <div style={{ textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upiQrDataUrl}
                  alt="UPI QR"
                  style={{ width: "120px", height: "120px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <div className="muted" style={{ fontSize: "9px", marginTop: "4px" }}>
                  Pay ₹{formatINRNumber(data.grandTotal)} via UPI
                </div>
                <div className="muted" style={{ fontSize: "8px" }}>
                  {COMPANY.bankDetails.upiId}
                </div>
              </div>
            ) : (
              // No QR for tax invoices — show "Pay via bank transfer" note
              <div
                className="qr-placeholder"
                style={{ width: "120px", height: "120px" }}
              >
                Bank transfer only
              </div>
            )}
            <div style={{ fontSize: "11px" }}>
              <div><span className="muted">Name:</span> {COMPANY.bankDetails.bankName}</div>
              <div><span className="muted">Account No.:</span> {COMPANY.bankDetails.accountNumber}</div>
              <div><span className="muted">IFSC code:</span> {COMPANY.bankDetails.ifsc}</div>
              <div><span className="muted">Account holder&apos;s name:</span> {COMPANY.bankDetails.accountHolder}</div>
            </div>
          </div>
        </div>
        <div className="sign-block">
          <div className="section-label">For {COMPANY.name}:</div>
          <div className="sign-line">Authorized Signatory</div>
        </div>
      </div>

      {/* Print button (hidden when actually printing) */}
      <PrintButton />
    </div>
  );
}

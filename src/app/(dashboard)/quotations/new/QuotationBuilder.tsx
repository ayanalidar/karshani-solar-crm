"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatINR, todayISO } from "@/lib/format";
import { TemplatePicker } from "@/components/TemplatePicker";
import type { QuotationTemplate } from "@/lib/quotation-templates";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  unitPrice: number;
  gstPercentage: number;
  hsnCode: string;
  stockQuantity: number;
};

type Customer = { id: string; name: string; phone: string; city: string };

type Line = {
  key: string;
  productId?: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
};

export function QuotationBuilder({ products: initialProducts, customers: initialCustomers }: { products: Product[]; customers: Customer[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [customers, setCustomers] = useState(initialCustomers);

  // Always fetch fresh data on mount — fixes "no products showing"
  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/customers", { cache: "no-store" }),
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (cRes.ok) setCustomers(await cRes.json());
      } catch {}
    })();
  }, []);

  const initialCustomer = params.get("customerId") || "";
  const [customerId, setCustomerId] = useState(initialCustomer);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [systemDescription, setSystemDescription] = useState("");
  const [quoteDate, setQuoteDate] = useState(todayISO());
  const [status, setStatus] = useState("sent");
  const [lines, setLines] = useState<Line[]>([
    { key: crypto.randomUUID(), itemName: "", hsnCode: "", quantity: 1, unitPrice: 0, gstPercentage: 5 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [templateOpen, setTemplateOpen] = useState(false);

  // Auto-fill from selected customer
  useEffect(() => {
    if (!customerId) return;
    const c = customers.find((c) => c.id === customerId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerLocation(c.city);
    }
  }, [customerId, customers]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), [lines]);
  const gstTotal = useMemo(
    () => lines.reduce((s, l) => s + (l.unitPrice * l.quantity * l.gstPercentage) / 100, 0),
    [lines]
  );
  const grandTotal = subtotal + gstTotal;

  const updateLine = (key: string, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const pickProduct = (key: string, productId: string) => {
    if (!productId) {
      updateLine(key, { productId: undefined, itemName: "", hsnCode: "", unitPrice: 0, gstPercentage: 5 });
      return;
    }
    const p = products.find((p) => p.id === productId);
    if (!p) return;
    updateLine(key, {
      productId: p.id,
      itemName: p.name,
      hsnCode: p.hsnCode,
      unitPrice: p.unitPrice,
      gstPercentage: p.gstPercentage,
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { key: crypto.randomUUID(), itemName: "", hsnCode: "", quantity: 1, unitPrice: 0, gstPercentage: 5 },
    ]);
  };

  // Apply a template — replaces all current line items with the template's
  // items + fills system description. Customer fields are preserved.
  const applyTemplate = (tpl: QuotationTemplate) => {
    setLines(
      tpl.items.map((i) => ({
        key: crypto.randomUUID(),
        itemName: i.itemName,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        gstPercentage: i.gstPercentage,
      }))
    );
    setSystemDescription(tpl.systemDescription);
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (!customerName.trim()) {
        setError("Customer name is required");
        setSaving(false);
        return;
      }
      if (lines.length === 0 || lines.every((l) => !l.itemName.trim())) {
        setError("Add at least one line item");
        setSaving(false);
        return;
      }
      const validLines = lines.filter((l) => l.itemName.trim());
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          customerName,
          customerPhone,
          customerLocation,
          systemDescription,
          quoteDate,
          status,
          items: validLines.map((l) => ({
            itemName: l.itemName,
            hsnCode: l.hsnCode,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            gstPercentage: Number(l.gstPercentage),
            amount: Number(l.quantity) * Number(l.unitPrice),
          })),
          subtotal,
          gstTotal,
          grandTotal,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      const q = await res.json();
      router.push(`/quotations/${q.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/quotations" className="text-sm text-[#787468] hover:text-amber-700">← Quotations</Link>
          <h2 className="font-serif text-lg">New Quotation</h2>
        </div>
        <button
          onClick={() => setTemplateOpen(true)}
          className="bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-50 flex items-center gap-1.5"
        >
          <span>📋</span> Use Template
        </button>
      </div>

      <TemplatePicker
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onPick={applyTemplate}
      />

      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold mb-3">Customer Details</h3>
        <div className="grid gap-3 grid-cols-2 max-sm:grid-cols-1">
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Select Existing Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            >
              <option value="">— Or enter new customer below —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone && ` · ${c.phone}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Customer Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Phone</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Location</label>
            <input
              type="text"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-[#504d44] mb-1">System Description</label>
            <input
              type="text"
              placeholder="e.g. 3kW On-Grid Solar System with 6 panels"
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Quote Date</label>
            <input
              type="date"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            >
              <option value="sent">Sent</option>
              <option value="negotiating">Negotiating</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Line Items</h3>
          <button onClick={addLine} className="text-xs font-semibold text-amber-700 hover:underline">
            + Add Line
          </button>
        </div>
        <div className="overflow-x-auto max-w-full overscroll-contain">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                <th className="text-left py-2 min-w-[280px]">Item (or pick product)</th>
                <th className="text-left py-2">HSN</th>
                <th className="text-right py-2 w-16">Qty</th>
                <th className="text-right py-2 w-24">Unit ₹</th>
                <th className="text-right py-2 w-20">GST %</th>
                <th className="text-right py-2 w-24">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.key} className="border-b border-[#ede8dc]">
                  <td className="py-2">
                    <input
                      type="text"
                      placeholder="Type item name or pick from products ↓"
                      value={l.itemName}
                      onChange={(e) => updateLine(l.key, { itemName: e.target.value })}
                      className="w-full px-2 py-1 border border-[#e6e0d4] rounded text-sm"
                    />
                    <select
                      value={l.productId || ""}
                      onChange={(e) => pickProduct(l.key, e.target.value)}
                      className="w-full mt-1 px-2 py-1 border border-[#e6e0d4] rounded text-xs text-[#787468]"
                    >
                      <option value="">— Pick from inventory —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatINR(p.unitPrice)}, {p.stockQuantity} in stock)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={l.hsnCode}
                      onChange={(e) => updateLine(l.key, { hsnCode: e.target.value })}
                      className="w-20 px-2 py-1 border border-[#e6e0d4] rounded text-xs font-mono"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: Number(e.target.value) })}
                      className="w-16 px-2 py-1 border border-[#e6e0d4] rounded text-sm text-right"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={l.unitPrice}
                      onChange={(e) => updateLine(l.key, { unitPrice: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-[#e6e0d4] rounded text-sm text-right"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.5"
                      value={l.gstPercentage}
                      onChange={(e) => updateLine(l.key, { gstPercentage: Number(e.target.value) })}
                      className="w-20 px-2 py-1 border border-[#e6e0d4] rounded text-sm text-right"
                    />
                  </td>
                  <td className="py-2 text-right font-medium">{formatINR(l.quantity * l.unitPrice)}</td>
                  <td className="py-2 pl-2">
                    <button
                      onClick={() => removeLine(l.key)}
                      disabled={lines.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:opacity-30 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#1c1915]">
                <td colSpan={5} className="py-3 text-right font-semibold text-sm">Subtotal</td>
                <td className="py-3 text-right font-medium">{formatINR(subtotal)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={5} className="pb-2 text-right text-sm text-[#504d44]">GST Total</td>
                <td className="pb-2 text-right text-sm">{formatINR(gstTotal)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={5} className="pb-2 text-right font-serif text-base">Grand Total</td>
                <td className="pb-2 text-right font-serif text-base font-bold">{formatINR(grandTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      <div className="flex justify-end gap-2">
        <Link
          href="/quotations"
          className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] text-[#504d44] hover:bg-[#faf6f0]"
        >
          Cancel
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Quotation"}
        </button>
      </div>
    </div>
  );
}

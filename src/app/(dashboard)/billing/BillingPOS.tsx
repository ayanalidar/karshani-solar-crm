"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  unitPrice: number;
  gstPercentage: number;
  stockQuantity: number;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export function BillingPOS({ products: initialProducts, customers: initialCustomers }: { products: Product[]; customers: Customer[] }) {
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ invoiceNo: string; invoiceId: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [financeAmount, setFinanceAmount] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => [p.name, p.category, p.brand, p.spec].join(" ").toLowerCase().includes(q));
  }, [products, search]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stockQuantity) return prev;
        return prev.map((i) => (i.product.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== id) return i;
        const capped = Math.max(1, Math.min(qty, i.product.stockQuantity));
        return { ...i, quantity: capped };
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const subtotal = cart.reduce((s, i) => s + i.product.unitPrice * i.quantity, 0);
  const gstTotal = cart.reduce((s, i) => s + (i.product.unitPrice * i.quantity * i.product.gstPercentage) / 100, 0);
  const grandTotal = subtotal + gstTotal;

  const customerName = customerId
    ? customers.find((c) => c.id === customerId)?.name || ""
    : walkInName.trim() || "Walk-in Customer";

  const checkout = async () => {
    setCheckingOut(true);
    setError("");
    setSuccess(null);
    try {
      if (cart.length === 0) {
        setError("Cart is empty");
        setCheckingOut(false);
        return;
      }
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          customerName,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod,
          paidAmount: paidAmount || undefined,
          financeAmount: financeAmount || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      const inv = await res.json();
      setSuccess({ invoiceNo: inv.invoiceNo, invoiceId: inv.id });
      setCart([]);
      setWalkInName("");
      setCustomerId("");
      setPaidAmount(0);
      setFinanceAmount(0);
      setShowPaymentOptions(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-serif text-lg">Billing &amp; POS</h2>
        <Link href="/invoices" className="text-sm text-amber-700 hover:underline">
          View all invoices →
        </Link>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex justify-between items-center flex-wrap gap-2">
          <div className="text-sm text-green-800">
            ✓ Sale complete — Invoice <span className="font-mono font-semibold">{success.invoiceNo}</span> created and stock deducted.
          </div>
          <div className="flex gap-2">
            <Link
              href={`/invoices/${success.invoiceId}/pdf`}
              className="text-xs font-semibold bg-white border border-green-200 px-3 py-1 rounded hover:bg-green-50"
            >
              Print / PDF
            </Link>
            <Link
              href={`/invoices/${success.invoiceId}`}
              className="text-xs font-semibold bg-white border border-green-200 px-3 py-1 rounded hover:bg-green-50"
            >
              View
            </Link>
            <button
              onClick={() => setSuccess(null)}
              className="text-xs font-semibold bg-green-600 text-white border border-green-600 px-3 py-1 rounded hover:bg-green-700"
            >
              New Sale
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[1fr_360px] gap-5 max-xl:grid-cols-1 items-start">
        <div className="min-w-0">
          <input
            type="search"
            placeholder="Search products by name, category, brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-[#e6e0d4] rounded-md text-sm mb-3 focus:outline-none focus:border-amber-600"
          />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {filteredProducts.map((p) => {
              const out = p.stockQuantity === 0;
              return (
                <button
                  key={p.id}
                  disabled={out}
                  onClick={() => addToCart(p)}
                  className={`bg-white border-2 rounded-lg p-3 text-left transition-all ${
                    out
                      ? "border-red-200 opacity-60 cursor-not-allowed"
                      : "border-[#ede8dc] hover:border-amber-600 hover:shadow-md"
                  }`}
                >
                  <div className="text-[9px] text-amber-600 uppercase tracking-wider font-bold">{p.category}</div>
                  <div className="text-xs font-semibold mt-0.5 line-clamp-2">{p.name}</div>
                  <div className="font-serif text-sm mt-0.5">{formatINR(p.unitPrice)}</div>
                  <div className={`text-[10px] ${out ? "text-red-600" : "text-[#787468]"}`}>
                    {out ? "Out of stock" : `Stock: ${p.stockQuantity}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 sticky top-20">
          <h3 className="text-sm font-semibold mb-3">Current Sale</h3>

          <div className="mb-3">
            <label className="block text-[10px] text-[#787468] uppercase tracking-wider font-semibold mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm mb-2"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone && `· ${c.phone}`}
                </option>
              ))}
            </select>
            {!customerId && (
              <input
                type="text"
                placeholder="Walk-in customer name (optional)"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
              />
            )}
          </div>

          <div className="border-t border-[#ede8dc] pt-3 mb-3 max-h-72 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#787468]">Click products to add to cart</div>
            ) : (
              <div className="space-y-2">
                {cart.map((i) => (
                  <div key={i.product.id} className="flex items-start gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{i.product.name}</div>
                      <div className="text-xs text-[#787468]">
                        {formatINR(i.product.unitPrice)} × {i.quantity} = {formatINR(i.product.unitPrice * i.quantity)}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={i.product.stockQuantity}
                      value={i.quantity}
                      onChange={(e) => updateQty(i.product.id, Number(e.target.value))}
                      className="w-14 px-2 py-1 border border-[#e6e0d4] rounded text-xs text-center"
                    />
                    <button onClick={() => removeFromCart(i.product.id)} className="text-red-500 hover:text-red-700 text-xs">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#1c1915] pt-3">
            <div className="flex justify-between text-sm text-[#504d44] py-0.5">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#504d44] py-0.5">
              <span>GST</span>
              <span>{formatINR(gstTotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base py-2 border-t border-[#e6e0d4] mt-1">
              <span>Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
          </div>

          {error && <div className="text-red-600 text-xs bg-red-50 border border-red-200 px-2 py-1.5 rounded mt-2">{error}</div>}

          {/* Payment options */}
          <button
            onClick={() => setShowPaymentOptions(!showPaymentOptions)}
            className="w-full mt-2 text-xs text-amber-700 dark:text-amber-400 hover:underline text-left"
          >
            {showPaymentOptions ? "▼ Hide payment options" : "▶ Payment & Finance options"}
          </button>
          {showPaymentOptions && (
            <div className="mt-2 p-3 bg-[#faf6f0] dark:bg-[#0c0a09] rounded-md space-y-2">
              <div>
                <label className="block text-[10px] font-semibold text-[#787468] dark:text-[#a8a29e] mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="dbt">DBT (Bank Transfer)</option>
                  <option value="bank_finance">Bank Finance</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#787468] dark:text-[#a8a29e] mb-1">Amount Paid Now (₹)</label>
                <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} placeholder="0" className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
                <button onClick={() => setPaidAmount(grandTotal)} className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline mt-0.5">Set full amount</button>
              </div>
              {paymentMethod === "bank_finance" && (
                <div>
                  <label className="block text-[10px] font-semibold text-[#787468] dark:text-[#a8a29e] mb-1">Bank Finance Amount (₹)</label>
                  <input type="number" value={financeAmount} onChange={(e) => setFinanceAmount(Number(e.target.value))} placeholder="0" className="w-full px-2 py-1.5 border border-[#e6e0d4] dark:border-[#2e2a25] rounded text-xs bg-white dark:bg-[#1c1917] text-[#1c1915] dark:text-[#f5efe5]" />
                  <div className="text-[10px] text-[#787468] dark:text-[#a8a29e] mt-0.5">
                    Balance after finance: {formatINR(grandTotal - paidAmount - financeAmount)}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={checkout}
            disabled={checkingOut || cart.length === 0}
            className="w-full mt-3 bg-amber-600 text-white py-2.5 rounded-md font-semibold text-sm hover:bg-amber-700 disabled:opacity-50"
          >
            {checkingOut ? "Processing…" : "Complete Sale & Deduct Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

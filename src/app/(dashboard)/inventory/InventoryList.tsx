"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { formatINR } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  spec: string;
  hsnCode: string;
  unitPrice: number;
  gstPercentage: number;
  stockQuantity: number;
};

const EMPTY = {
  name: "",
  category: "",
  brand: "",
  spec: "",
  hsnCode: "",
  unitPrice: 0,
  gstPercentage: 5,
  stockQuantity: 0,
};

export function InventoryList({ products }: { products: Product[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = search
    ? products.filter((p) =>
        [p.name, p.category, p.brand, p.spec, p.hsnCode].join(" ").toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      brand: p.brand,
      spec: p.spec,
      hsnCode: p.hsnCode,
      unitPrice: p.unitPrice,
      gstPercentage: p.gstPercentage,
      stockQuantity: p.stockQuantity,
    });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (!form.name.trim()) {
        setError("Name is required");
        setSaving(false);
        return;
      }
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      setModalOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const lowStockCount = products.filter((p) => p.stockQuantity < 5).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">Inventory</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} products</span>
          {lowStockCount > 0 && (
            <span className="text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              ⚠ {lowStockCount} low-stock
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products…" />
          <Link
            href="/inventory/new"
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-[#e6e0d4] rounded-xl p-8 text-center text-sm text-[#787468]">
            No products found. Click &quot;+ Add Product&quot; to create one.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${
                p.stockQuantity === 0
                  ? "border-red-200"
                  : p.stockQuantity < 5
                  ? "border-amber-200"
                  : "border-[#e6e0d4]"
              }`}
            >
              <div className="text-[10px] text-amber-600 uppercase tracking-wider font-bold mb-1">{p.category || "Uncategorized"}</div>
              <h4 className="font-semibold text-sm mb-1">{p.name}</h4>
              {p.brand && <div className="text-[11px] text-[#787468]">{p.brand}</div>}
              {p.spec && <div className="text-[11px] text-[#787468]">{p.spec}</div>}
              <div className="text-[11px] text-[#787468] font-mono">HSN {p.hsnCode || "—"}</div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#ede8dc]">
                <span className="font-serif text-base">{formatINR(p.unitPrice)}/u</span>
                <span
                  className={`text-xs font-semibold ${
                    p.stockQuantity === 0
                      ? "text-red-600"
                      : p.stockQuantity < 5
                      ? "text-amber-600"
                      : "text-green-700"
                  }`}
                >
                  {p.stockQuantity === 0 ? "Out of stock" : `${p.stockQuantity} in stock`}
                </span>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#ede8dc]">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 text-xs text-amber-700 border border-amber-200 hover:bg-amber-50 py-1.5 rounded-md font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="flex-1 text-xs text-red-600 border border-red-200 hover:bg-red-50 py-1.5 rounded-md font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Product" : "Edit Product"}>
        <ProductForm form={form} setForm={setForm} error={error} saving={saving} onSave={save} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        message="This permanently deletes the product from inventory. Past invoices that reference it are not affected."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

export function ProductForm({
  form,
  setForm,
  error,
  saving,
  onSave,
  onCancel,
}: {
  form: any;
  setForm: (f: any) => void;
  error: string;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputCls =
    "w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200";
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  // Default categories + any custom ones from existing products
  const defaultCategories = ["Solar Panel", "Inverter", "Battery", "Mounting", "Accessories", "Cable", "Service"];
  const existingCategories = Array.from(new Set([...defaultCategories]));

  return (
    <div className="grid gap-3">
      <div>
        <label className="block text-xs font-semibold text-[#504d44] mb-1">Name *</label>
        <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">Category</label>
          <CategorySelect value={form.category} onChange={(v) => set("category", v)} inputCls={inputCls} existingCategories={existingCategories} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">Brand</label>
          <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#504d44] mb-1">Spec</label>
        <input type="text" value={form.spec} onChange={(e) => set("spec", e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">HSN Code</label>
          <input type="text" value={form.hsnCode} onChange={(e) => set("hsnCode", e.target.value)} className={inputCls + " font-mono"} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">GST %</label>
          <input
            type="number"
            step="0.5"
            value={form.gstPercentage}
            onChange={(e) => set("gstPercentage", Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">Unit Price (₹)</label>
          <input
            type="number"
            step="0.01"
            value={form.unitPrice}
            onChange={(e) => set("unitPrice", Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#504d44] mb-1">Stock Qty</label>
          <input
            type="number"
            value={form.stockQuantity}
            onChange={(e) => set("stockQuantity", Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] text-[#504d44] hover:bg-[#faf6f0]"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// Editable category select — shows a dropdown of existing categories
// plus a "+ Add new..." option that reveals a text input.
function CategorySelect({
  value,
  onChange,
  inputCls,
  existingCategories,
}: {
  value: string;
  onChange: (v: string) => void;
  inputCls: string;
  existingCategories: string[];
}) {
  const isCustom = value && !existingCategories.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  if (showCustom || isCustom) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type new category…"
          className={inputCls}
          autoFocus
        />
        <button
          type="button"
          onClick={() => { setShowCustom(false); onChange(""); }}
          className="px-2 text-xs border border-[#e6e0d4] rounded-md text-[#787468] hover:bg-[#faf6f0] shrink-0"
          title="Back to list"
        >
          ▾
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__custom__") {
          setShowCustom(true);
          onChange("");
        } else {
          onChange(e.target.value);
        }
      }}
      className={inputCls}
    >
      <option value="">— Select category —</option>
      {existingCategories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
      <option value="__custom__">+ Add new category…</option>
    </select>
  );
}

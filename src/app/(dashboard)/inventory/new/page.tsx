"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductForm } from "../InventoryList";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    spec: "",
    hsnCode: "",
    unitPrice: 0,
    gstPercentage: 5,
    stockQuantity: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (!form.name.trim()) {
        setError("Name is required");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed (${res.status})`);
      }
      router.push("/inventory");
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg">Add New Product</h2>
        <Link href="/inventory" className="text-sm text-[#787468] hover:text-amber-700">
          ← Back to Inventory
        </Link>
      </div>
      <div className="bg-white border border-[#e6e0d4] rounded-xl p-5 max-w-2xl">
        <ProductForm
          form={form}
          setForm={setForm}
          error={error}
          saving={saving}
          onSave={save}
          onCancel={() => router.push("/inventory")}
        />
      </div>
    </div>
  );
}

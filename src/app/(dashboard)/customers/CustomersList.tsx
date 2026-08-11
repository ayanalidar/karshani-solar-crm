"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { formatINR } from "@/lib/format";

type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string;
  gstin: string;
  totalPurchases: number;
};

export function CustomersList({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", gstin: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = search
    ? customers.filter((c) =>
        [c.name, c.phone, c.city, c.gstin]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : customers;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", city: "", gstin: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, city: c.city, gstin: c.gstin });
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
      const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
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
      await fetch(`/api/customers/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">Customers</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search customers…" />
          <button
            onClick={openAdd}
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
          >
            + Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No customers yet</h3>
              <p>Click &quot;+ Add Customer&quot; to create the first one.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">City</th>
                  <th className="text-left p-3">GSTIN</th>
                  <th className="text-right p-3">Purchases</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    <td className="p-3 font-semibold">
                      <Link href={`/customers/${c.id}`} className="hover:text-amber-700 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-3 font-mono text-xs">{c.phone || "—"}</td>
                    <td className="p-3">{c.city || "—"}</td>
                    <td className="p-3 font-mono text-xs">{c.gstin || "—"}</td>
                    <td className="p-3 text-right font-medium">{formatINR(c.totalPurchases)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(c)} className="text-xs text-amber-700 hover:underline mr-3">
                        Edit
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="text-xs text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "Add Customer"}>
        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">GSTIN</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600 font-mono"
            />
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-md text-sm border border-[#e6e0d4] text-[#504d44] hover:bg-[#faf6f0]"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete customer?"
        message="This permanently deletes the customer. Their past invoices/enquiries will remain but lose the customer link."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

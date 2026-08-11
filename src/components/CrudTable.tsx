"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { formatINR, formatDate } from "@/lib/format";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  required?: boolean;
};

export type ColumnDef = {
  key: string;
  label: string;
  format?: (val: any, row: any) => React.ReactNode;
  className?: string;
};

export type ModuleConfig = {
  slug: string;
  apiPath: string;
  label: string;
  columns: ColumnDef[];
  fields: FieldDef[];
};

function defaultEmptyValues(fields: FieldDef[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    if (f.type === "number") out[f.name] = 0;
    else if (f.type === "select") out[f.name] = f.options?.[0] || "";
    else out[f.name] = "";
  }
  return out;
}

function FormField({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  const inputCls =
    "w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-200";
  return (
    <div>
      <label className="block text-xs font-semibold text-[#504d44] mb-1">
        {field.label}
        {field.required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {field.type === "select" ? (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          className={inputCls}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={field.type}
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function CrudTable({ config, rows }: { config: ModuleConfig; rows: Record<string, any>[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>(defaultEmptyValues(config.fields));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = search
    ? rows.filter((r) =>
        Object.values(r)
          .filter((v) => v !== null && typeof v !== "object")
          .some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : rows;

  const openAdd = () => {
    setEditing(null);
    setForm(defaultEmptyValues(config.fields));
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, any>) => {
    setEditing(row);
    const init: Record<string, any> = {};
    for (const f of config.fields) init[f.name] = row[f.name] ?? defaultEmptyValues(config.fields)[f.name];
    setForm(init);
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const requiredMissing = config.fields.filter((f) => f.required && !form[f.name]);
      if (requiredMissing.length > 0) {
        setError(`Required: ${requiredMissing.map((f) => f.label).join(", ")}`);
        setSaving(false);
        return;
      }
      const url = editing ? `${config.apiPath}/${editing.id}` : config.apiPath;
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
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${config.apiPath}/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">{config.label}</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder={`Search ${config.label.toLowerCase()}…`} />
          <button
            onClick={openAdd}
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700 whitespace-nowrap"
          >
            + Add New
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No records yet</h3>
              <p>Click &quot;+ Add New&quot; to create the first entry.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  {config.columns.map((col) => (
                    <th key={col.key} className={`text-left p-3 ${col.className || ""}`}>
                      {col.label}
                    </th>
                  ))}
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    {config.columns.map((col) => (
                      <td key={col.key} className={`p-3 ${col.className || ""}`}>
                        {col.format ? col.format(row[col.key], row) : String(row[col.key] ?? "—")}
                      </td>
                    ))}
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-xs text-amber-700 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(row.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${config.label}` : `Add ${config.label}`}>
        <div className="grid gap-3">
          {config.fields.map((f) => (
            <FormField
              key={f.name}
              field={f}
              value={form[f.name]}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
            />
          ))}
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
        title="Delete record?"
        message="This will permanently delete the record. This action cannot be undone."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

export { formatINR, formatDate };

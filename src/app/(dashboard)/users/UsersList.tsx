"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SearchInput } from "@/components/SearchInput";
import { StatusPill } from "@/components/StatusPill";
import { formatDate } from "@/lib/format";

type User = {
  id: string;
  name: string;
  role: string;
  createdAt: string | Date;
};

export function UsersList({ users, currentUserId = "admin-001" }: { users: User[]; currentUserId?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", pin: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = search
    ? users.filter((u) => [u.name, u.role].join(" ").toLowerCase().includes(search.toLowerCase()))
    : users;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", pin: "", role: "staff" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, pin: "", role: u.role });
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
      // PIN required on create, optional on edit (leave blank to keep current)
      if (!editing && !/^\d{4}$/.test(form.pin)) {
        setError("PIN must be exactly 4 digits");
        setSaving(false);
        return;
      }
      if (editing && form.pin && !/^\d{4}$/.test(form.pin)) {
        setError("PIN must be exactly 4 digits");
        setSaving(false);
        return;
      }

      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const body = editing
        ? { name: form.name, role: form.role, ...(form.pin && { pin: form.pin }) }
        : form;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-serif text-lg">Users</h2>
          <span className="text-xs text-[#787468] bg-[#f5efe5] px-2 py-0.5 rounded-full">{filtered.length} users</span>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
          <button
            onClick={openAdd}
            className="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700"
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e6e0d4] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-[#787468]">
              <h3 className="font-serif text-lg text-[#504d44] mb-2">No users yet</h3>
              <p>Click &quot;+ Add User&quot; to create a staff account.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#787468] uppercase tracking-wider border-b border-[#e6e0d4]">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Added</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[#ede8dc] hover:bg-amber-50/50">
                    <td className="p-3 font-semibold">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-3"><StatusPill status={u.role} /></td>
                    <td className="p-3 text-xs text-[#787468]">{formatDate(String(u.createdAt))}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(u)} className="text-xs text-amber-700 hover:underline mr-3">
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(u.id)}
                        disabled={u.id === currentUserId || u.id === "admin-001"}
                        className="text-xs text-red-600 hover:underline disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
                        title={u.id === currentUserId ? "Can't delete yourself" : ""}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Add User"}>
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
            <label className="block text-xs font-semibold text-[#504d44] mb-1">
              PIN (4 digits) {editing && <span className="text-[#787468] font-normal">— leave blank to keep current</span>}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={form.pin}
              onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="••••"
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm focus:outline-none focus:border-amber-600 font-mono tracking-widest"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#504d44] mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-[#e6e0d4] rounded-md text-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
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
        title="Delete user?"
        message="This permanently deletes the user account. They will no longer be able to log in."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

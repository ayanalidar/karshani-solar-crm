// Currency + date helpers shared across server + client

export function formatINR(amount: number): string {
  return `₹${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatINRShort(amount: number): string {
  const v = amount || 0;
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(2)} L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toFixed(0)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysFromToday(iso: string): number {
  if (!iso) return Infinity;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return Infinity;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Generate sequential doc numbers like INV-2026-001
export function generateDocNo(prefix: string, count: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

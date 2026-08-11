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

// Indian financial year format used in estimates: 2026-27/210
export function fiscalYearPrefix(date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed; April = 3
  // Indian FY: April 1 of year Y → March 31 of year Y+1
  const startYear = m >= 3 ? y : y - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

// Convert a number to Indian English words (Lakh/Crore system).
// Used in "Amount in words: ___ Rupees only" on invoices.
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + numberToWords(-num);

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const twoDigits = (n: number): string => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  };
  const threeDigits = (n: number): string => {
    if (n < 100) return twoDigits(n);
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
  };

  let str = "";
  let remaining = Math.floor(num);
  const crore = Math.floor(remaining / 10000000);
  remaining = remaining % 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining = remaining % 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining = remaining % 1000;
  const hundred = remaining;

  if (crore > 0) str += twoDigits(crore) + " Crore ";
  if (lakh > 0) str += twoDigits(lakh) + " Lakh ";
  if (thousand > 0) str += twoDigits(thousand) + " Thousand ";
  if (hundred > 0) str += threeDigits(hundred);

  return str.trim();
}

// Format number in Indian numbering system with 2 decimals: 185000 → "1,85,000.00"
export function formatINRNumber(amount: number): string {
  return (amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

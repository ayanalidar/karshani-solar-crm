// Input sanitization helpers — VAPT fix for XSS + injection prevention.
// Strips HTML tags, SQL injection chars, and enforces max length.

export function sanitizeText(input: any, maxLength = 200): string {
  return String(input || "")
    .replace(/<[^>]*>/g, "") // strip HTML tags (XSS prevention)
    .replace(/['";\\]/g, "") // strip SQL injection chars
    .replace(/javascript:/gi, "") // strip javascript: protocol
    .replace(/on\w+=/gi, "") // strip on* event handlers
    .trim()
    .slice(0, maxLength);
}

export function sanitizeNumber(input: any): number {
  const n = Number(input);
  return isNaN(n) ? 0 : n;
}

export function sanitizePhone(input: any): string {
  return String(input || "")
    .replace(/[^0-9+\-\s()]/g, "") // only allow digits, +, -, spaces, parens
    .trim()
    .slice(0, 20);
}

export function sanitizeGSTIN(input: any): string {
  return String(input || "")
    .replace(/[^A-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 15);
}

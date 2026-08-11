import QRCode from "qrcode";
import { COMPANY } from "@/lib/company";

/**
 * Build a UPI deep-link string following the NPCI UPI Linking Spec.
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTES
 *
 * @param amount  Amount in INR (number). Will be formatted to 2 decimals.
 * @param note    Short note shown in the payer's UPI app (max 80 chars, no &).
 */
export function buildUpiString(amount: number, note?: string): string {
  const params = new URLSearchParams();
  params.set("pa", COMPANY.bankDetails.upiId);
  params.set("pn", COMPANY.name);
  if (amount > 0) {
    params.set("am", amount.toFixed(2));
    params.set("cu", "INR");
  }
  if (note) {
    // UPI notes can't contain & — strip it
    params.set("tn", note.replace(/&/g, "and").slice(0, 80));
  }
  return `upi://pay?${params.toString()}`;
}

/**
 * Render a UPI QR code as a data-URL PNG (base64).
 * Returns null on failure (caller should fall back to placeholder).
 */
export async function renderUpiQrDataUrl(amount: number, note?: string): Promise<string | null> {
  try {
    const upiString = buildUpiString(amount, note);
    // 240x240 px PNG, high error correction so logo overlay is safe.
    const dataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("[upi-qr] render failed:", err);
    return null;
  }
}

// Company-wide constants used in PDFs, headers, footers.
// Source: Screenshot sample (Karshani Enterprises proforma invoice).

export const COMPANY = {
  name: "KARSHANI ENTERPRISES",
  tagline: "Solar Power · Energy Solutions",
  addressLine1: "SHYAM SUNDAR COLONY, BADH PURA ROAD, SADAR",
  addressLine2: "Mathura, Uttar Pradesh — 281001",
  phone: "9720669669",
  email: "enterpriseskarshani@gmail.com",
  gstin: "09IBVPS5826N1Z9",
  state: "09-Uttar Pradesh",
  // For PDF letterhead
  bankDetails: {
    bankName: "KOTAK MAHINDRA BANK LIMITED, MATHURA",
    accountNumber: "9720669669",
    ifsc: "KKBK0000149",
    accountHolder: "KARSHANI ENTERPRISES",
    // UPI ID shown in the QR area
    upiId: "karshani@kotak",
  },
} as const;

// State code 09 = Uttar Pradesh (intra-state supply → CGST + SGST split)
export const STATE_CODE = "09";

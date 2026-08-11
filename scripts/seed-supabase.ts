// Seed existing Supabase tables via REST API (PostgREST).
// Used because direct Postgres connection (port 5432) is blocked from this sandbox.
// Sandbox can reach HTTPS port 443 only, so we use the REST endpoint.

const SUPABASE_URL = "https://ayiwltqmxbvurxoqyvbw.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aXdsdHFteGJ2dXJ4b3F5dmJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ3NTY4NCwiZXhwIjoyMTAyMDUxNjg0fQ.llkUKBSu8ueY7Bcev4lojqjsUNSDYasl_Bp5cA48L0Q";

const headers = {
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

async function upsert(table: string, rows: any[]) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`✗ ${table}: ${res.status} ${txt.slice(0, 200)}`);
  } else {
    console.log(`✓ ${table}: ${rows.length} rows upserted`);
  }
}

async function main() {
  // Admin user
  await upsert("users", [
    { id: "admin-001", name: "Admin", pin: "0000", role: "admin" },
  ]);

  // Products
  await upsert("products", [
    { id: "p1", name: "WAAREE 580WP TOPCON BIFACIAL", category: "Solar Panel", brand: "WAAREE", spec: "580W · Mono Bifacial", hsn_code: "854143", unit_price: 11200, gst_percentage: 5, stock_quantity: 42 },
    { id: "p2", name: "Tata Power Solar 540WP Mono", category: "Solar Panel", brand: "Tata", spec: "540W · Half-Cut", hsn_code: "854143", unit_price: 10500, gst_percentage: 5, stock_quantity: 28 },
    { id: "p3", name: "POLYCAB Solar Inv On-Grid 3 kWh", category: "Inverter", brand: "Polycab", spec: "3kW · Single Phase", hsn_code: "85044090", unit_price: 32800, gst_percentage: 12, stock_quantity: 15 },
    { id: "p4", name: "POLYCAB Solar Inv On-Grid 5 kWh", category: "Inverter", brand: "Polycab", spec: "5kW · Three Phase", hsn_code: "85044090", unit_price: 48500, gst_percentage: 12, stock_quantity: 8 },
    { id: "p5", name: "Exide Solar Tubular 150Ah", category: "Battery", brand: "Exide", spec: "150Ah · C10", hsn_code: "85072000", unit_price: 14200, gst_percentage: 12, stock_quantity: 3 },
    { id: "p6", name: "Luminous Solar 200Ah Tall Tubular", category: "Battery", brand: "Luminous", spec: "200Ah · 5yr", hsn_code: "85072000", unit_price: 18900, gst_percentage: 12, stock_quantity: 11 },
    { id: "p7", name: "Tata Mounting Structure 3kW Kit", category: "Mounting", brand: "Tata", spec: "GI · 6-panel", hsn_code: "73089090", unit_price: 8500, gst_percentage: 18, stock_quantity: 20 },
    { id: "p8", name: "DC Cable 6mm² Copper (meter)", category: "Accessories", brand: "", spec: "UV Protected", hsn_code: "85446090", unit_price: 65, gst_percentage: 18, stock_quantity: 500 },
    { id: "p9", name: "Luminous 445WP Mono PERC", category: "Solar Panel", brand: "Luminous", spec: "445W", hsn_code: "854143", unit_price: 8750, gst_percentage: 5, stock_quantity: 5 },
    { id: "p10", name: "ACDB Box 3kW with SPD", category: "Accessories", brand: "", spec: "IP65", hsn_code: "85371000", unit_price: 4500, gst_percentage: 18, stock_quantity: 12 },
    { id: "p11", name: "MC4 Connector Pair", category: "Accessories", brand: "", spec: "IP68", hsn_code: "85369090", unit_price: 180, gst_percentage: 18, stock_quantity: 200 },
    { id: "p12", name: "Amaron Solar 100Ah Tubular", category: "Battery", brand: "Amaron", spec: "100Ah", hsn_code: "85072000", unit_price: 9800, gst_percentage: 12, stock_quantity: 7 },
  ]);

  // Customers
  await upsert("customers", [
    { id: "c1", name: "Murarilal Ji", phone: "+91 98765 43210", city: "Mathura", gstin: "", total_purchases: 185000 },
    { id: "c2", name: "Rajesh Kumar", phone: "+91 98112 34567", city: "Vrindavan", gstin: "09ABCDE1234F1Z5", total_purchases: 246000 },
    { id: "c3", name: "Priya Singh", phone: "+91 98734 56789", city: "Kosi Kalan", gstin: "09FGHIJ5678K2Z6", total_purchases: 112000 },
    { id: "c4", name: "Amit Sharma", phone: "+91 98109 87654", city: "Govardhan", gstin: "", total_purchases: 62400 },
    { id: "c5", name: "Suresh Patel", phone: "+91 98991 23456", city: "Mathura", gstin: "09KLMNO9012P3Z7", total_purchases: 78500 },
    { id: "c6", name: "Anita Devi", phone: "+91 70172 34567", city: "Chhata", gstin: "", total_purchases: 54000 },
    { id: "c7", name: "Vikram Singh", phone: "+91 94127 65432", city: "Barsana", gstin: "", total_purchases: 32000 },
    { id: "c8", name: "Ramesh Yadav", phone: "+91 98371 23456", city: "Mathura", gstin: "09PQRST3456U4Z8", total_purchases: 94500 },
  ]);

  // Sample enquiry
  await upsert("enquiries", [
    { id: "e1", customer_name: "Murarilal Ji", phone: "+91 98765 43210", source: "walk-in", system_description: "3kW Solar System", estimated_amount: 185000, status: "quoted", notes: "", customer_id: "c1" },
    { id: "e2", customer_name: "Rajesh Kumar", phone: "+91 98112 34567", source: "phone", system_description: "5kW On-Grid", estimated_amount: 250000, status: "new", notes: "Wants finance option", customer_id: "c2" },
  ]);

  // Sample AMC contract (so the AMC expiry widget has data)
  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const in55 = new Date(today.getTime() + 55 * 86400000).toISOString().slice(0, 10);
  const lastYear = new Date(today.getTime() - 365 * 86400000).toISOString().slice(0, 10);
  await upsert("amc_contracts", [
    { id: "a1", customer_name: "Murarilal Ji", system: "3kW Solar System", contract_type: "AMC", start_date: lastYear, expiry_date: in30 },
    { id: "a2", customer_name: "Priya Singh", system: "5kW Solar System", contract_type: "warranty", start_date: lastYear, expiry_date: in55 },
  ]);

  // Sample invoice (so dashboard shows data) — note: invoice_items table doesn't exist yet
  await upsert("invoices", [
    { id: "i1", invoice_no: "INV-2026-0001", customer_name: "Murarilal Ji", description: "3kW Solar System", subtotal: 176190.48, gst_total: 8809.52, grand_total: 185000, invoice_date: "2026-08-10", due_date: "", status: "paid", customer_id: "c1" },
    { id: "i2", invoice_no: "INV-2026-0002", customer_name: "Rajesh Kumar", description: "5kW Solar System", subtotal: 250000, gst_total: 30000, grand_total: 280000, invoice_date: "2026-08-09", due_date: "", status: "due", customer_id: "c2" },
  ]);

  // Sample quotation
  await upsert("quotations", [
    { id: "q1", estimate_no: "2026-27/001", customer_name: "Murarilal Ji", customer_phone: "+91 98765 43210", customer_location: "Mathura", system_description: "3kW Solar System", subtotal: 176190.48, gst_total: 8809.52, grand_total: 185000, quote_date: "2026-08-10", status: "sent", customer_id: "c1" },
    { id: "q2", estimate_no: "2026-27/002", customer_name: "Amit Sharma", customer_phone: "+91 98109 87654", customer_location: "Govardhan", system_description: "2kW Solar System", subtotal: 95000, gst_total: 4750, grand_total: 99750, quote_date: "2026-08-11", status: "sent", customer_id: "c4" },
  ]);

  // Sample quotation items
  await upsert("quotation_items", [
    { id: "qi1", quotation_id: "q1", item_name: "SOLAR POWER GENERATING SYSTEM 3 KW", hsn_code: "8541", quantity: 1, unit_price: 176190.48, gst_percentage: 5, amount: 176190.48 },
    { id: "qi2", quotation_id: "q1", item_name: "WAAREE 580WP TOPCON BIFACIAL", hsn_code: "854143", quantity: 6, unit_price: 0, gst_percentage: 0, amount: 0 },
    { id: "qi3", quotation_id: "q1", item_name: "POLYCAB SOLAR INV ON GRID 3 KW", hsn_code: "85044090", quantity: 1, unit_price: 0, gst_percentage: 0, amount: 0 },
    { id: "qi4", quotation_id: "q1", item_name: "STRUCTURE, ACCESSORIES & INSTALLATION OF PLANT 3 KWH TATA", hsn_code: "", quantity: 1, unit_price: 0, gst_percentage: 0, amount: 0 },
  ]);

  // Sample employee
  await upsert("employees", [
    { id: "emp1", name: "Ravi Kumar", role: "Installation Lead", phone: "+91 98765 11111", salary: 25000, join_date: "2024-01-15", active: true },
    { id: "emp2", name: "Sunil Singh", role: "Sales Executive", phone: "+91 98765 22222", salary: 22000, join_date: "2024-03-01", active: true },
  ]);

  // Sample installation
  await upsert("installations", [
    { id: "in1", customer_name: "Murarilal Ji", system_description: "3kW Solar System", install_date: "2026-08-15", stage: "scheduled", team: "Ravi Kumar", notes: "Customer available post 11am", customer_id: "c1" },
  ]);

  console.log("Seed complete");
}

main().catch((e) => { console.error(e); process.exit(1); });

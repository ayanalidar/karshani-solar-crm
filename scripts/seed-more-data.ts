// Add substantial sample data to all tables via Supabase REST API.
// Idempotent: uses deterministic IDs so reruns are safe.

const SUPABASE_URL = "https://jmxbqvzxzezjqyoqfzdz.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpteGJxdnp4emV6anF5b3FmemR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM4NDEwNywiZXhwIjoyMTAxOTYwMTA3fQ.nCCOXGiRfpIpAMRws7rz6k-m7NRNXJZbqsweCRA1iOM";

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

const today = new Date();
const iso = (daysFromToday: number) => {
  const d = new Date(today.getTime() + daysFromToday * 86400000);
  return d.toISOString().slice(0, 10);
};

async function main() {
  // ---- More customers (10 more, total 18) ----
  await upsert("customers", [
    { id: "c9",  name: "Mahesh Agarwal",   phone: "+91 99100 12345", city: "Mathura",     gstin: "09AAAA0000A1Z1", total_purchases: 145000 },
    { id: "c10", name: "Sunita Devi",      phone: "+91 99100 22345", city: "Vrindavan",   gstin: "",               total_purchases: 38000 },
    { id: "c11", name: "Krishna Bansal",    phone: "+91 99100 32345", city: "Agra",        gstin: "09BBBB1111B2Z2", total_purchases: 410000 },
    { id: "c12", name: "Om Prakash",        phone: "+91 99100 42345", city: "Mathura",     gstin: "",               total_purchases: 75000 },
    { id: "c13", name: "Geeta Sharma",     phone: "+91 99100 52345", city: "Kosi Kalan",  gstin: "",               total_purchases: 92000 },
    { id: "c14", name: "Arjun Singh",       phone: "+91 99100 62345", city: "Govardhan",   gstin: "",               total_purchases: 56000 },
    { id: "c15", name: "Meena Yadav",      phone: "+91 99100 72345", city: "Barsana",     gstin: "",               total_purchases: 47000 },
    { id: "c16", name: "Vinod Tyagi",      phone: "+91 99100 82345", city: "Chhata",      gstin: "09CCCC2222C3Z3", total_purchases: 215000 },
    { id: "c17", name: "Prem Sharma",      phone: "+91 99100 92345", city: "Mathura",     gstin: "",               total_purchases: 65000 },
    { id: "c18", name: "Lakshmi Traders",  phone: "+91 99100 03456", city: "Mathura",     gstin: "09DDDD3333D4Z4", total_purchases: 525000 },
  ]);

  // ---- More products (5 more, total 17) ----
  await upsert("products", [
    { id: "p13", name: "WAAREE 440WP Bifacial",          category: "Solar Panel", brand: "WAAREE",  spec: "440W · Bifacial",       hsn_code: "854143", unit_price: 8900,  gst_percentage: 5,  stock_quantity: 18 },
    { id: "p14", name: "Tata Solar Inv Off-Grid 5kVA",   category: "Inverter",     brand: "Tata",    spec: "5kVA · Off-Grid",       hsn_code: "85044090", unit_price: 62000, gst_percentage: 12, stock_quantity: 4 },
    { id: "p15", name: "Luminous 150Ah Tall Tubular",    category: "Battery",     brand: "Luminous", spec: "150Ah · 5yr",         hsn_code: "85072000", unit_price: 16500, gst_percentage: 12, stock_quantity: 9 },
    { id: "p16", name: "DCDB Box 5kW with SPD+MCB",     category: "Accessories",  brand: "",         spec: "IP65 · Three Phase",   hsn_code: "85371000", unit_price: 6800,  gst_percentage: 18, stock_quantity: 7 },
    { id: "p17", name: "Tata Mounting Structure 5kW Kit", category: "Mounting",   brand: "Tata",    spec: "GI · 10-panel",        hsn_code: "73089090", unit_price: 13500, gst_percentage: 18, stock_quantity: 3 },
  ]);

  // ---- More enquiries (8 more, total 10) ----
  await upsert("enquiries", [
    { id: "e3",  customer_name: "Sunita Devi",     phone: "+91 99100 22345", source: "phone",     system_description: "2kW Hybrid Solar System",       estimated_amount: 95000,   status: "new",         notes: "Wants battery backup",         customer_id: "c10" },
    { id: "e4",  customer_name: "Krishna Bansal", phone: "+91 99100 32345", source: "online",    system_description: "10kW Commercial Solar Plant",   estimated_amount: 525000,  status: "quoted",      notes: "Big order, GST bill needed",   customer_id: "c11" },
    { id: "e5",  customer_name: "Om Prakash",      phone: "+91 99100 42345", source: "referral",  system_description: "3kW On-Grid Solar System",       estimated_amount: 185000,  status: "negotiating",  notes: "Negotiating price",            customer_id: "c12" },
    { id: "e6",  customer_name: "Geeta Sharma",    phone: "+91 99100 52345", source: "walk-in",   system_description: "2kW Solar with Battery",          estimated_amount: 92000,   status: "new",         notes: "",                              customer_id: "c13" },
    { id: "e7",  customer_name: "Arjun Singh",     phone: "+91 99100 62345", source: "whatsapp",  system_description: "1kW Solar Pump",                estimated_amount: 56000,   status: "won",         notes: "Installation scheduled",       customer_id: "c14" },
    { id: "e8",  customer_name: "Meena Yadav",     phone: "+91 99100 72345", source: "walk-in",   system_description: "3kW Solar System",               estimated_amount: 47000,   status: "lost",        notes: "Went to competitor",           customer_id: "c15" },
    { id: "e9",  customer_name: "Vinod Tyagi",     phone: "+91 99100 82345", source: "phone",     system_description: "5kW On-Grid Solar System",       estimated_amount: 215000,  status: "quoted",      notes: "",                              customer_id: "c16" },
    { id: "e10", customer_name: "Prem Sharma",     phone: "+91 99100 92345", source: "online",    system_description: "2kW On-Grid System",             estimated_amount: 65000,   status: "new",         notes: "Email only",                    customer_id: "c17" },
  ]);

  // ---- More quotations (4 more, total 6) ----
  await upsert("quotations", [
    { id: "q3", estimate_no: "2026-27/003", customer_name: "Krishna Bansal", customer_phone: "+91 99100 32345", customer_location: "Agra",      system_description: "10kW Commercial Solar Plant", subtotal: 446428.57, gst_total: 53571.43, grand_total: 500000, quote_date: iso(-2), status: "sent",       customer_id: "c11" },
    { id: "q4", estimate_no: "2026-27/004", customer_name: "Vinod Tyagi",    customer_phone: "+91 99100 82345", customer_location: "Chhata",    system_description: "5kW On-Grid Solar",          subtotal: 191964.29, gst_total: 23035.71, grand_total: 215000, quote_date: iso(-1), status: "sent",       customer_id: "c16" },
    { id: "q5", estimate_no: "2026-27/005", customer_name: "Mahesh Agarwal",customer_phone: "+91 99100 12345", customer_location: "Mathura",   system_description: "3kW Hybrid Solar",           subtotal: 138095.24, gst_total: 11904.76, grand_total: 150000, quote_date: iso(-1), status: "won",        customer_id: "c9" },
    { id: "q6", estimate_no: "2026-27/006", customer_name: "Om Prakash",     customer_phone: "+91 99100 42345", customer_location: "Mathura",   system_description: "3kW On-Grid Solar",          subtotal: 171428.57, gst_total: 8571.43,  grand_total: 180000, quote_date: iso(0),  status: "negotiating",customer_id: "c12" },
  ]);

  // ---- More quotation_items for the new quotations ----
  await upsert("quotation_items", [
    { id: "qi5",  quotation_id: "q3", item_name: "10kW Solar Power Generating System", hsn_code: "8541",    quantity: 1, unit_price: 446428.57, gst_percentage: 12, amount: 446428.57 },
    { id: "qi6",  quotation_id: "q3", item_name: "WAAREE 580WP TOPCON BIFACIAL",      hsn_code: "854143",  quantity: 18, unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "qi7",  quotation_id: "q3", item_name: "POLYCAB Solar Inv On-Grid 10 kWh",  hsn_code: "85044090",quantity: 1,  unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "qi8",  quotation_id: "q4", item_name: "5kW Solar Power Generating System", hsn_code: "8541",    quantity: 1,  unit_price: 191964.29, gst_percentage: 12, amount: 191964.29 },
    { id: "qi9",  quotation_id: "q4", item_name: "WAAREE 580WP TOPCON BIFACIAL",      hsn_code: "854143",  quantity: 10, unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "qi10", quotation_id: "q5", item_name: "3kW Hybrid Solar Power System",      hsn_code: "8541",    quantity: 1,  unit_price: 138095.24, gst_percentage: 5,  amount: 138095.24 },
    { id: "qi11", quotation_id: "q6", item_name: "3kW On-Grid Solar System",          hsn_code: "8541",    quantity: 1,  unit_price: 171428.57, gst_percentage: 5,  amount: 171428.57 },
  ]);

  // ---- More invoices (4 more, total 6) — mix of paid and due ----
  await upsert("invoices", [
    { id: "i3", invoice_no: "INV-2026-0003", customer_name: "Krishna Bansal", description: "10kW Commercial Solar Plant",  subtotal: 446428.57, gst_total: 53571.43, grand_total: 500000, invoice_date: iso(-3), due_date: "", status: "paid", customer_id: "c11" },
    { id: "i4", invoice_no: "INV-2026-0004", customer_name: "Vinod Tyagi",    description: "5kW On-Grid Solar System",   subtotal: 191964.29, gst_total: 23035.71, grand_total: 215000, invoice_date: iso(-2), due_date: "", status: "due",  customer_id: "c16" },
    { id: "i5", invoice_no: "INV-2026-0005", customer_name: "Mahesh Agarwal", description: "3kW Hybrid Solar",           subtotal: 138095.24, gst_total: 11904.76, grand_total: 150000, invoice_date: iso(-1), due_date: "", status: "paid", customer_id: "c9" },
    { id: "i6", invoice_no: "INV-2026-0006", customer_name: "Lakshmi Traders", description: "5kW Solar System + Battery",  subtotal: 276785.71, gst_total: 33214.29, grand_total: 310000, invoice_date: iso(0),  due_date: "", status: "due",  customer_id: "c18" },
  ]);

  // ---- Invoice items (matching the new invoices) ----
  await upsert("invoice_items", [
    { id: "iit1", invoice_id: "i3", item_name: "10kW Solar Power Generating System", hsn_code: "8541",     quantity: 1,  unit_price: 446428.57, gst_percentage: 12, amount: 446428.57 },
    { id: "iit2", invoice_id: "i3", item_name: "WAAREE 580WP TOPCON BIFACIAL",      hsn_code: "854143",   quantity: 18, unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "iit3", invoice_id: "i3", item_name: "POLYCAB Solar Inv On-Grid 10 kWh",  hsn_code: "85044090", quantity: 1,  unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "iit4", invoice_id: "i4", item_name: "5kW Solar Power Generating System", hsn_code: "8541",     quantity: 1,  unit_price: 191964.29, gst_percentage: 12, amount: 191964.29 },
    { id: "iit5", invoice_id: "i4", item_name: "WAAREE 580WP TOPCON BIFACIAL",      hsn_code: "854143",   quantity: 10, unit_price: 0,         gst_percentage: 0,  amount: 0 },
    { id: "iit6", invoice_id: "i5", item_name: "3kW Hybrid Solar Power System",      hsn_code: "8541",     quantity: 1,  unit_price: 138095.24, gst_percentage: 5,  amount: 138095.24 },
    { id: "iit7", invoice_id: "i6", item_name: "5kW Solar System + Battery",        hsn_code: "8541",     quantity: 1,  unit_price: 276785.71, gst_percentage: 12, amount: 276785.71 },
  ]);

  // ---- More installations (5 more, total 6) ----
  await upsert("installations", [
    { id: "in2", customer_name: "Rajesh Kumar",     system_description: "5kW Solar System",          install_date: iso(2),  stage: "scheduled",   team: "Ravi Kumar, Sunil Singh", notes: "Roof inspection done",      customer_id: "c2" },
    { id: "in3", customer_name: "Priya Singh",      system_description: "3kW Solar System",          install_date: iso(-1), stage: "in progress", team: "Sunil Singh",            notes: "Awaiting inverter delivery", customer_id: "c3" },
    { id: "in4", customer_name: "Suresh Patel",     system_description: "2kW Solar Pump",           install_date: iso(-5), stage: "completed",   team: "Ravi Kumar",             notes: "Customer satisfied",       customer_id: "c5" },
    { id: "in5", customer_name: "Krishna Bansal",   system_description: "10kW Commercial Plant",     install_date: iso(7),  stage: "scheduled",   team: "Ravi Kumar, Sunil Singh, Amit", notes: "Need crane for panel lift", customer_id: "c11" },
    { id: "in6", customer_name: "Mahesh Agarwal",   system_description: "3kW Hybrid Solar",         install_date: iso(3),  stage: "scheduled",   team: "Sunil Singh",            notes: "Battery installation same day", customer_id: "c9" },
  ]);

  // ---- More AMC contracts (3 more, total 5) ----
  await upsert("amc_contracts", [
    { id: "a3", customer_name: "Suresh Patel",    system: "2kW Solar Pump",       contract_type: "AMC",      start_date: iso(-180), expiry_date: iso(20)  },
    { id: "a4", customer_name: "Ramesh Yadav",   system: "5kW Solar System",     contract_type: "warranty", start_date: iso(-400), expiry_date: iso(-40) },  // already expired — tests the overdue state
    { id: "a5", customer_name: "Anita Devi",     system: "3kW Solar System",     contract_type: "AMC",      start_date: iso(-100), expiry_date: iso(45)  },
  ]);

  // ---- Expenses (8 entries — gives the finance section real data) ----
  await upsert("expenses", [
    { id: "x1", category: "Rent",        description: "Shop rent — August",          amount: 25000, expense_date: iso(-2) },
    { id: "x2", category: "Salary",      description: "Sunil Singh — July salary",    amount: 22000, expense_date: iso(-5) },
    { id: "x3", category: "Salary",      description: "Ravi Kumar — July salary",    amount: 25000, expense_date: iso(-5) },
    { id: "x4", category: "Purchase",    description: "Inventory restock — WAAREE panels (12 units)",  amount: 134400, expense_date: iso(-3) },
    { id: "x5", category: "Transport",  description: "Fuel — installation visits",   amount: 4500,  expense_date: iso(-1) },
    { id: "x6", category: "Utilities",  description: "Electricity bill",              amount: 3200,  expense_date: iso(-1) },
    { id: "x7", category: "Marketing",  description: "WhatsApp marketing campaign",  amount: 5000,  expense_date: iso(-4) },
    { id: "x8", category: "Maintenance",description: "AC repair — office",            amount: 2800,  expense_date: iso(-7) },
  ]);

  // ---- Cash book (6 entries — credit + debit mix) ----
  await upsert("cash_book", [
    { id: "cb1", type: "credit", description: "Cash sale — walk-in customer",        amount: 18500, entry_date: iso(-1) },
    { id: "cb2", type: "debit",  description: "Petty cash — tea/snacks",              amount: 500,   entry_date: iso(-1) },
    { id: "cb3", type: "credit", description: "Advance — Krishna Bansal",           amount: 250000, entry_date: iso(-3) },
    { id: "cb4", type: "debit",  description: "Panel cleaning chemicals",            amount: 1800,  entry_date: iso(-2) },
    { id: "cb5", type: "credit", description: "Cash sale — battery replacement",     amount: 9800,  entry_date: iso(0) },
    { id: "cb6", type: "debit",  description: "Courier — invoice delivery",          amount: 250,   entry_date: iso(0) },
  ]);

  // ---- Supplier POs (5 entries) ----
  await upsert("supplier_orders", [
    { id: "so1", po_number: "PO-2026-0001", supplier_name: "WAAREE Energies Ltd",   items: "12x WAAREE 580WP TOPCON BIFACIAL solar panels",     amount: 134400, order_date: iso(-3), status: "delivered" },
    { id: "so2", po_number: "PO-2026-0002", supplier_name: "Polycab India",          items: "5x POLYCAB 3kW On-Grid Inverter",                   amount: 164000, order_date: iso(-2), status: "pending" },
    { id: "so3", po_number: "PO-2026-0003", supplier_name: "Exide Industries",       items: "10x Exide Solar Tubular 150Ah batteries",          amount: 142000, order_date: iso(-1), status: "pending" },
    { id: "so4", po_number: "PO-2026-0004", supplier_name: "Luminous Power",         items: "8x Luminous 200Ah Tall Tubular + 5x 445WP panels", amount: 187200, order_date: iso(-5), status: "delivered" },
    { id: "so5", po_number: "PO-2026-0005", supplier_name: "Tata Power Solar",       items: "20x Tata Mounting Structure 3kW Kit",              amount: 170000, order_date: iso(0),  status: "pending" },
  ]);

  // ---- More employees (3 more, total 5) ----
  await upsert("employees", [
    { id: "emp3", name: "Amit Verma",     role: "Installation Engineer", phone: "+91 98765 33333", salary: 28000, join_date: "2023-06-15", active: true },
    { id: "emp4", name: "Pooja Gupta",    role: "Accountant",            phone: "+91 98765 44444", salary: 24000, join_date: "2024-09-01", active: true },
    { id: "emp5", name: "Deepak Sharma",  role: "Sales Executive",       phone: "+91 98765 55555", salary: 20000, join_date: "2025-01-10", active: false },
  ]);

  console.log("Sample data complete");
}

main().catch((e) => { console.error(e); process.exit(1); });

-- ============================================================
-- Karshani Solar CRM — Full Database Setup
-- ============================================================
-- Run this in Supabase SQL Editor to create ALL tables + seed data:
-- https://supabase.com/dashboard/project/ayiwltqmxbvurxoqyvbw/sql/new
--
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS + ON CONFLICT)
-- ============================================================

-- ============================================================
-- PART 1: DDL — Create all 14 tables
-- ============================================================

create table if not exists users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  pin text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null,
  brand text not null default '',
  spec text not null default '',
  hsn_code text not null default '',
  unit_price double precision not null default 0,
  gst_percentage double precision not null default 5,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  phone text not null default '',
  city text not null default '',
  gstin text not null default '',
  total_purchases double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  phone text not null default '',
  source text not null default 'walk-in',
  system_description text not null default '',
  estimated_amount double precision not null default 0,
  status text not null default 'new',
  notes text not null default '',
  created_at timestamptz not null default now(),
  customer_id text references customers(id) on delete set null
);

create table if not exists quotations (
  id text primary key default gen_random_uuid()::text,
  estimate_no text not null unique,
  customer_name text not null,
  customer_phone text not null default '',
  customer_location text not null default '',
  system_description text not null default '',
  subtotal double precision not null default 0,
  gst_total double precision not null default 0,
  grand_total double precision not null default 0,
  quote_date text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  customer_id text references customers(id) on delete set null,
  printed_at timestamptz,
  print_count integer not null default 0
);

create table if not exists quotation_items (
  id text primary key default gen_random_uuid()::text,
  quotation_id text not null references quotations(id) on delete cascade,
  item_name text not null,
  hsn_code text not null default '',
  quantity integer not null default 1,
  unit_price double precision not null default 0,
  gst_percentage double precision not null default 5,
  amount double precision not null default 0
);

create table if not exists invoices (
  id text primary key default gen_random_uuid()::text,
  invoice_no text not null unique,
  customer_name text not null,
  description text not null default '',
  subtotal double precision not null default 0,
  gst_total double precision not null default 0,
  grand_total double precision not null default 0,
  invoice_date text not null,
  due_date text not null default '',
  status text not null default 'due',
  created_at timestamptz not null default now(),
  customer_id text references customers(id) on delete set null,
  printed_at timestamptz,
  print_count integer not null default 0
);

create table if not exists invoice_items (
  id text primary key default gen_random_uuid()::text,
  invoice_id text not null references invoices(id) on delete cascade,
  item_name text not null,
  hsn_code text not null default '',
  quantity integer not null default 1,
  unit_price double precision not null default 0,
  gst_percentage double precision not null default 5,
  amount double precision not null default 0
);

create table if not exists installations (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  system_description text not null default '',
  install_date text not null default '',
  stage text not null default 'scheduled',
  team text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  customer_id text references customers(id) on delete set null
);

create table if not exists supplier_orders (
  id text primary key default gen_random_uuid()::text,
  po_number text not null,
  supplier_name text not null,
  items text not null,
  amount double precision not null default 0,
  order_date text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key default gen_random_uuid()::text,
  category text not null,
  description text not null default '',
  amount double precision not null default 0,
  expense_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists cash_book (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  description text not null default '',
  amount double precision not null default 0,
  entry_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists amc_contracts (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  system text not null default '',
  contract_type text not null default 'AMC',
  start_date text not null,
  expiry_date text not null,
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  role text not null default '',
  phone text not null default '',
  salary double precision not null default 0,
  join_date text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PART 2: Enable Realtime on all tables
-- (Supabase broadcasts DB changes to subscribed browser clients)
-- ============================================================

alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.enquiries;
alter publication supabase_realtime add table public.quotations;
alter publication supabase_realtime add table public.quotation_items;
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.invoice_items;
alter publication supabase_realtime add table public.installations;
alter publication supabase_realtime add table public.supplier_orders;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.cash_book;
alter publication supabase_realtime add table public.amc_contracts;
alter publication supabase_realtime add table public.employees;

-- ============================================================
-- PART 3: Seed Data — Admin user, 17 products, 18 customers, etc.
-- ============================================================

-- Admin user (PIN 0000)
insert into users (id, name, pin, role) values ('admin-001', 'Admin', '0000', 'admin')
  on conflict (id) do nothing;

-- 17 Products (12 + 5 extras)
insert into products (id, name, category, brand, spec, hsn_code, unit_price, gst_percentage, stock_quantity) values
  ('p1', 'WAAREE 580WP TOPCON BIFACIAL', 'Solar Panel', 'WAAREE', '580W · Mono Bifacial', '854143', 11200, 5, 42),
  ('p2', 'Tata Power Solar 540WP Mono', 'Solar Panel', 'Tata', '540W · Half-Cut', '854143', 10500, 5, 28),
  ('p3', 'POLYCAB Solar Inv On-Grid 3 kWh', 'Inverter', 'Polycab', '3kW · Single Phase', '85044090', 32800, 12, 15),
  ('p4', 'POLYCAB Solar Inv On-Grid 5 kWh', 'Inverter', 'Polycab', '5kW · Three Phase', '85044090', 48500, 12, 8),
  ('p5', 'Exide Solar Tubular 150Ah', 'Battery', 'Exide', '150Ah · C10', '85072000', 14200, 12, 3),
  ('p6', 'Luminous Solar 200Ah Tall Tubular', 'Battery', 'Luminous', '200Ah · 5yr', '85072000', 18900, 12, 11),
  ('p7', 'Tata Mounting Structure 3kW Kit', 'Mounting', 'Tata', 'GI · 6-panel', '73089090', 8500, 18, 20),
  ('p8', 'DC Cable 6mm² Copper (meter)', 'Accessories', '', 'UV Protected', '85446090', 65, 18, 500),
  ('p9', 'Luminous 445WP Mono PERC', 'Solar Panel', 'Luminous', '445W', '854143', 8750, 5, 5),
  ('p10', 'ACDB Box 3kW with SPD', 'Accessories', '', 'IP65', '85371000', 4500, 18, 12),
  ('p11', 'MC4 Connector Pair', 'Accessories', '', 'IP68', '85369090', 180, 18, 200),
  ('p12', 'Amaron Solar 100Ah Tubular', 'Battery', 'Amaron', '100Ah', '85072000', 9800, 12, 7),
  ('p13', 'WAAREE 440WP Bifacial', 'Solar Panel', 'WAAREE', '440W · Bifacial', '854143', 8900, 5, 18),
  ('p14', 'Tata Solar Inv Off-Grid 5kVA', 'Inverter', 'Tata', '5kVA · Off-Grid', '85044090', 62000, 12, 4),
  ('p15', 'Luminous 150Ah Tall Tubular', 'Battery', 'Luminous', '150Ah · 5yr', '85072000', 16500, 12, 9),
  ('p16', 'DCDB Box 5kW with SPD+MCB', 'Accessories', '', 'IP65 · Three Phase', '85371000', 6800, 18, 7),
  ('p17', 'Tata Mounting Structure 5kW Kit', 'Mounting', 'Tata', 'GI · 10-panel', '73089090', 13500, 18, 3)
on conflict (id) do nothing;

-- 18 Customers (8 + 10 more)
insert into customers (id, name, phone, city, gstin, total_purchases) values
  ('c1', 'Murarilal Ji', '+91 98765 43210', 'Mathura', '', 185000),
  ('c2', 'Rajesh Kumar', '+91 98112 34567', 'Vrindavan', '09ABCDE1234F1Z5', 246000),
  ('c3', 'Priya Singh', '+91 98734 56789', 'Kosi Kalan', '09FGHIJ5678K2Z6', 112000),
  ('c4', 'Amit Sharma', '+91 98109 87654', 'Govardhan', '', 62400),
  ('c5', 'Suresh Patel', '+91 98991 23456', 'Mathura', '09KLMNO9012P3Z7', 78500),
  ('c6', 'Anita Devi', '+91 70172 34567', 'Chhata', '', 54000),
  ('c7', 'Vikram Singh', '+91 94127 65432', 'Barsana', '', 32000),
  ('c8', 'Ramesh Yadav', '+91 98371 23456', 'Mathura', '09PQRST3456U4Z8', 94500),
  ('c9', 'Mahesh Agarwal', '+91 99100 12345', 'Mathura', '09AAAA0000A1Z1', 145000),
  ('c10', 'Sunita Devi', '+91 99100 22345', 'Vrindavan', '', 38000),
  ('c11', 'Krishna Bansal', '+91 99100 32345', 'Agra', '09BBBB1111B2Z2', 410000),
  ('c12', 'Om Prakash', '+91 99100 42345', 'Mathura', '', 75000),
  ('c13', 'Geeta Sharma', '+91 99100 52345', 'Kosi Kalan', '', 92000),
  ('c14', 'Arjun Singh', '+91 99100 62345', 'Govardhan', '', 56000),
  ('c15', 'Meena Yadav', '+91 99100 72345', 'Barsana', '', 47000),
  ('c16', 'Vinod Tyagi', '+91 99100 82345', 'Chhata', '09CCCC2222C3Z3', 215000),
  ('c17', 'Prem Sharma', '+91 99100 92345', 'Mathura', '', 65000),
  ('c18', 'Lakshmi Traders', '+91 99100 03456', 'Mathura', '09DDDD3333D4Z4', 525000)
on conflict (id) do nothing;

-- 10 Enquiries
insert into enquiries (id, customer_name, phone, source, system_description, estimated_amount, status, notes, customer_id) values
  ('e1', 'Murarilal Ji', '+91 98765 43210', 'walk-in', '3kW Solar System', 185000, 'quoted', '', 'c1'),
  ('e2', 'Rajesh Kumar', '+91 98112 34567', 'phone', '5kW On-Grid', 250000, 'new', 'Wants finance option', 'c2'),
  ('e3', 'Sunita Devi', '+91 99100 22345', 'phone', '2kW Hybrid Solar System', 95000, 'new', 'Wants battery backup', 'c10'),
  ('e4', 'Krishna Bansal', '+91 99100 32345', 'online', '10kW Commercial Solar Plant', 525000, 'quoted', 'Big order, GST bill needed', 'c11'),
  ('e5', 'Om Prakash', '+91 99100 42345', 'referral', '3kW On-Grid Solar System', 185000, 'negotiating', 'Negotiating price', 'c12'),
  ('e6', 'Geeta Sharma', '+91 99100 52345', 'walk-in', '2kW Solar with Battery', 92000, 'new', '', 'c13'),
  ('e7', 'Arjun Singh', '+91 99100 62345', 'whatsapp', '1kW Solar Pump', 56000, 'won', 'Installation scheduled', 'c14'),
  ('e8', 'Meena Yadav', '+91 99100 72345', 'walk-in', '3kW Solar System', 47000, 'lost', 'Went to competitor', 'c15'),
  ('e9', 'Vinod Tyagi', '+91 99100 82345', 'phone', '5kW On-Grid Solar System', 215000, 'quoted', '', 'c16'),
  ('e10', 'Prem Sharma', '+91 99100 92345', 'online', '2kW On-Grid System', 65000, 'new', 'Email only', 'c17')
on conflict (id) do nothing;

-- 6 Quotations
insert into quotations (id, estimate_no, customer_name, customer_phone, customer_location, system_description, subtotal, gst_total, grand_total, quote_date, status, customer_id) values
  ('q1', '2026-27/001', 'Murarilal Ji', '+91 98765 43210', 'Mathura', '3kW Solar System', 176190.48, 8809.52, 185000, '2026-08-10', 'sent', 'c1'),
  ('q2', '2026-27/002', 'Amit Sharma', '+91 98109 87654', 'Govardhan', '2kW Solar System', 95000, 4750, 99750, '2026-08-11', 'sent', 'c4'),
  ('q3', '2026-27/003', 'Krishna Bansal', '+91 99100 32345', 'Agra', '10kW Commercial Solar Plant', 446428.57, 53571.43, 500000, '2026-08-09', 'sent', 'c11'),
  ('q4', '2026-27/004', 'Vinod Tyagi', '+91 99100 82345', 'Chhata', '5kW On-Grid Solar', 191964.29, 23035.71, 215000, '2026-08-10', 'sent', 'c16'),
  ('q5', '2026-27/005', 'Mahesh Agarwal', '+91 99100 12345', 'Mathura', '3kW Hybrid Solar', 138095.24, 11904.76, 150000, '2026-08-10', 'won', 'c9'),
  ('q6', '2026-27/006', 'Om Prakash', '+91 99100 42345', 'Mathura', '3kW On-Grid Solar', 171428.57, 8571.43, 180000, '2026-08-11', 'negotiating', 'c12')
on conflict (id) do nothing;

-- 11 Quotation items
insert into quotation_items (id, quotation_id, item_name, hsn_code, quantity, unit_price, gst_percentage, amount) values
  ('qi1', 'q1', 'SOLAR POWER GENERATING SYSTEM 3 KW', '8541', 1, 176190.48, 5, 176190.48),
  ('qi2', 'q1', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 6, 0, 0, 0),
  ('qi3', 'q1', 'POLYCAB SOLAR INV ON GRID 3 KW', '85044090', 1, 0, 0, 0),
  ('qi4', 'q1', 'STRUCTURE, ACCESSORIES & INSTALLATION OF PLANT 3 KWH TATA', '', 1, 0, 0, 0),
  ('qi5', 'q3', '10kW Solar Power Generating System', '8541', 1, 446428.57, 12, 446428.57),
  ('qi6', 'q3', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 18, 0, 0, 0),
  ('qi7', 'q3', 'POLYCAB Solar Inv On-Grid 10 kWh', '85044090', 1, 0, 0, 0),
  ('qi8', 'q4', '5kW Solar Power Generating System', '8541', 1, 191964.29, 12, 191964.29),
  ('qi9', 'q4', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 10, 0, 0, 0),
  ('qi10', 'q5', '3kW Hybrid Solar Power System', '8541', 1, 138095.24, 5, 138095.24),
  ('qi11', 'q6', '3kW On-Grid Solar System', '8541', 1, 171428.57, 5, 171428.57)
on conflict (id) do nothing;

-- 6 Invoices (mix of paid and due)
insert into invoices (id, invoice_no, customer_name, description, subtotal, gst_total, grand_total, invoice_date, due_date, status, customer_id) values
  ('i1', 'INV-2026-0001', 'Murarilal Ji', '3kW Solar System', 176190.48, 8809.52, 185000, '2026-08-10', '', 'paid', 'c1'),
  ('i2', 'INV-2026-0002', 'Rajesh Kumar', '5kW Solar System', 250000, 30000, 280000, '2026-08-09', '', 'due', 'c2'),
  ('i3', 'INV-2026-0003', 'Krishna Bansal', '10kW Commercial Solar Plant', 446428.57, 53571.43, 500000, '2026-08-08', '', 'paid', 'c11'),
  ('i4', 'INV-2026-0004', 'Vinod Tyagi', '5kW On-Grid Solar System', 191964.29, 23035.71, 215000, '2026-08-09', '', 'due', 'c16'),
  ('i5', 'INV-2026-0005', 'Mahesh Agarwal', '3kW Hybrid Solar', 138095.24, 11904.76, 150000, '2026-08-10', '', 'paid', 'c9'),
  ('i6', 'INV-2026-0006', 'Lakshmi Traders', '5kW Solar System + Battery', 276785.71, 33214.29, 310000, '2026-08-11', '', 'due', 'c18')
on conflict (id) do nothing;

-- 12 Invoice items
insert into invoice_items (id, invoice_id, item_name, hsn_code, quantity, unit_price, gst_percentage, amount) values
  ('iit1', 'i1', 'SOLAR POWER GENERATING SYSTEM 3 KW', '8541', 1, 176190.48, 5, 176190.48),
  ('iit2', 'i1', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 6, 0, 0, 0),
  ('iit3', 'i1', 'POLYCAB SOLAR INV ON GRID 3 KW', '85044090', 1, 0, 0, 0),
  ('iit4', 'i1', 'STRUCTURE, ACCESSORIES & INSTALLATION OF PLANT 3 KWH TATA', '', 1, 0, 0, 0),
  ('iit5', 'i2', '5kW Solar Power System', '8541', 1, 250000, 12, 250000),
  ('iit6', 'i3', '10kW Solar Power Generating System', '8541', 1, 446428.57, 12, 446428.57),
  ('iit7', 'i3', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 18, 0, 0, 0),
  ('iit8', 'i4', '5kW Solar Power Generating System', '8541', 1, 191964.29, 12, 191964.29),
  ('iit9', 'i4', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 10, 0, 0, 0),
  ('iit10', 'i5', '3kW Hybrid Solar Power System', '8541', 1, 138095.24, 5, 138095.24),
  ('iit11', 'i6', '5kW Solar System + Battery', '8541', 1, 276785.71, 12, 276785.71),
  ('iit12', 'i6', 'Luminous 200Ah Tall Tubular', '85072000', 2, 18900, 12, 37800)
on conflict (id) do nothing;

-- 6 Installations
insert into installations (id, customer_name, system_description, install_date, stage, team, notes, customer_id) values
  ('in1', 'Murarilal Ji', '3kW Solar System', '2026-08-15', 'scheduled', 'Ravi Kumar', 'Customer available post 11am', 'c1'),
  ('in2', 'Rajesh Kumar', '5kW Solar System', '2026-08-13', 'scheduled', 'Ravi Kumar, Sunil Singh', 'Roof inspection done', 'c2'),
  ('in3', 'Priya Singh', '3kW Solar System', '2026-08-10', 'in progress', 'Sunil Singh', 'Awaiting inverter delivery', 'c3'),
  ('in4', 'Suresh Patel', '2kW Solar Pump', '2026-08-06', 'completed', 'Ravi Kumar', 'Customer satisfied', 'c5'),
  ('in5', 'Krishna Bansal', '10kW Commercial Plant', '2026-08-18', 'scheduled', 'Ravi Kumar, Sunil Singh, Amit', 'Need crane for panel lift', 'c11'),
  ('in6', 'Mahesh Agarwal', '3kW Hybrid Solar', '2026-08-14', 'scheduled', 'Sunil Singh', 'Battery installation same day', 'c9')
on conflict (id) do nothing;

-- 5 AMC contracts (includes 1 already-expired for testing)
insert into amc_contracts (id, customer_name, system, contract_type, start_date, expiry_date) values
  ('a1', 'Murarilal Ji', '3kW Solar System', 'AMC', '2025-08-15', '2026-09-10'),
  ('a2', 'Priya Singh', '5kW Solar System', 'warranty', '2025-08-15', '2026-10-05'),
  ('a3', 'Suresh Patel', '2kW Solar Pump', 'AMC', '2026-02-15', '2026-09-01'),
  ('a4', 'Ramesh Yadav', '5kW Solar System', 'warranty', '2025-06-01', '2026-07-02'),
  ('a5', 'Anita Devi', '3kW Solar System', 'AMC', '2026-05-01', '2026-09-25')
on conflict (id) do nothing;

-- 5 Supplier POs
insert into supplier_orders (id, po_number, supplier_name, items, amount, order_date, status) values
  ('so1', 'PO-2026-0001', 'WAAREE Energies Ltd', '12x WAAREE 580WP TOPCON BIFACIAL solar panels', 134400, '2026-08-08', 'delivered'),
  ('so2', 'PO-2026-0002', 'Polycab India', '5x POLYCAB 3kW On-Grid Inverter', 164000, '2026-08-09', 'pending'),
  ('so3', 'PO-2026-0003', 'Exide Industries', '10x Exide Solar Tubular 150Ah batteries', 142000, '2026-08-10', 'pending'),
  ('so4', 'PO-2026-0004', 'Luminous Power', '8x Luminous 200Ah Tall Tubular + 5x 445WP panels', 187200, '2026-08-06', 'delivered'),
  ('so5', 'PO-2026-0005', 'Tata Power Solar', '20x Tata Mounting Structure 3kW Kit', 170000, '2026-08-11', 'pending')
on conflict (id) do nothing;

-- 8 Expenses
insert into expenses (id, category, description, amount, expense_date) values
  ('x1', 'Rent', 'Shop rent — August', 25000, '2026-08-09'),
  ('x2', 'Salary', 'Sunil Singh — July salary', 22000, '2026-08-06'),
  ('x3', 'Salary', 'Ravi Kumar — July salary', 25000, '2026-08-06'),
  ('x4', 'Purchase', 'Inventory restock — WAAREE panels (12 units)', 134400, '2026-08-08'),
  ('x5', 'Transport', 'Fuel — installation visits', 4500, '2026-08-10'),
  ('x6', 'Utilities', 'Electricity bill', 3200, '2026-08-10'),
  ('x7', 'Marketing', 'WhatsApp marketing campaign', 5000, '2026-08-07'),
  ('x8', 'Maintenance', 'AC repair — office', 2800, '2026-08-04')
on conflict (id) do nothing;

-- 6 Cash book entries
insert into cash_book (id, type, description, amount, entry_date) values
  ('cb1', 'credit', 'Cash sale — walk-in customer', 18500, '2026-08-10'),
  ('cb2', 'debit', 'Petty cash — tea/snacks', 500, '2026-08-10'),
  ('cb3', 'credit', 'Advance — Krishna Bansal', 250000, '2026-08-08'),
  ('cb4', 'debit', 'Panel cleaning chemicals', 1800, '2026-08-09'),
  ('cb5', 'credit', 'Cash sale — battery replacement', 9800, '2026-08-11'),
  ('cb6', 'debit', 'Courier — invoice delivery', 250, '2026-08-11')
on conflict (id) do nothing;

-- 5 Employees
insert into employees (id, name, role, phone, salary, join_date, active) values
  ('emp1', 'Ravi Kumar', 'Installation Lead', '+91 98765 11111', 25000, '2024-01-15', true),
  ('emp2', 'Sunil Singh', 'Sales Executive', '+91 98765 22222', 22000, '2024-03-01', true),
  ('emp3', 'Amit Verma', 'Installation Engineer', '+91 98765 33333', 28000, '2023-06-15', true),
  ('emp4', 'Pooja Gupta', 'Accountant', '+91 98765 44444', 24000, '2024-09-01', true),
  ('emp5', 'Deepak Sharma', 'Sales Executive', '+91 98765 55555', 20000, '2025-01-10', false)
on conflict (id) do nothing;

-- ============================================================
-- Verify all tables + counts
-- ============================================================
select 'users' as table_name, count(*) as cnt from users
union all select 'products', count(*) from products
union all select 'customers', count(*) from customers
union all select 'enquiries', count(*) from enquiries
union all select 'quotations', count(*) from quotations
union all select 'quotation_items', count(*) from quotation_items
union all select 'invoices', count(*) from invoices
union all select 'invoice_items', count(*) from invoice_items
union all select 'installations', count(*) from installations
union all select 'supplier_orders', count(*) from supplier_orders
union all select 'expenses', count(*) from expenses
union all select 'cash_book', count(*) from cash_book
union all select 'amc_contracts', count(*) from amc_contracts
union all select 'employees', count(*) from employees
order by table_name;

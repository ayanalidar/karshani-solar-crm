-- Karshani CRM — Full schema + seed data
-- Idempotent: safe to run multiple times

-- ============================================================
-- DDL: create all 13 tables
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
  customer_id text references customers(id) on delete set null
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
  customer_id text references customers(id) on delete set null
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
-- Seed data (idempotent)
-- ============================================================

insert into users (id, name, pin, role) values ('admin-001', 'Admin', '0000', 'admin')
  on conflict (id) do nothing;

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
  ('p12', 'Amaron Solar 100Ah Tubular', 'Battery', 'Amaron', '100Ah', '85072000', 9800, 12, 7)
on conflict (id) do nothing;

insert into customers (id, name, phone, city, gstin, total_purchases) values
  ('c1', 'Murarilal Ji', '+91 98765 43210', 'Mathura', '', 185000),
  ('c2', 'Rajesh Kumar', '+91 98112 34567', 'Vrindavan', '09ABCDE1234F1Z5', 246000),
  ('c3', 'Priya Singh', '+91 98734 56789', 'Kosi Kalan', '09FGHIJ5678K2Z6', 112000),
  ('c4', 'Amit Sharma', '+91 98109 87654', 'Govardhan', '', 62400),
  ('c5', 'Suresh Patel', '+91 98991 23456', 'Mathura', '09KLMNO9012P3Z7', 78500),
  ('c6', 'Anita Devi', '+91 70172 34567', 'Chhata', '', 54000),
  ('c7', 'Vikram Singh', '+91 94127 65432', 'Barsana', '', 32000),
  ('c8', 'Ramesh Yadav', '+91 98371 23456', 'Mathura', '09PQRST3456U4Z8', 94500)
on conflict (id) do nothing;

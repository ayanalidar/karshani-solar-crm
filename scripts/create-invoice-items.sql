-- Run this in Supabase SQL Editor to create the missing invoice_items table.
-- https://supabase.com/dashboard/project/jmxbqvzxzezjqyoqfzdz/sql/new

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

-- Also create the view Prisma uses for include: { items: true }
-- (not strictly needed — table is enough)

-- Sample invoice items for the existing sample invoices (so dashboard + PDFs have data)
insert into invoice_items (invoice_id, item_name, hsn_code, quantity, unit_price, gst_percentage, amount) values
  ('i1', 'SOLAR POWER GENERATING SYSTEM 3 KW', '8541', 1, 176190.48, 5, 176190.48),
  ('i1', 'WAAREE 580WP TOPCON BIFACIAL', '854143', 6, 0, 0, 0),
  ('i1', 'POLYCAB SOLAR INV ON GRID 3 KW', '85044090', 1, 0, 0, 0),
  ('i1', 'STRUCTURE, ACCESSORIES & INSTALLATION OF PLANT 3 KWH TATA', '', 1, 0, 0, 0),
  ('i2', '5kW Solar Power System', '8541', 1, 250000, 12, 250000)
on conflict do nothing;

-- Enable Row Level Security policies so the service_role key can access them
-- (service_role bypasses RLS anyway, this is for completeness)
alter table invoice_items enable row level security;
create policy "Allow all for service_role" on invoice_items for all using (auth.role() = 'service_role');

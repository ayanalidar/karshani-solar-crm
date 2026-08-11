-- Enable Supabase Realtime on all Karshani CRM tables.
-- Run this once in Supabase SQL Editor.
-- https://supabase.com/dashboard/project/jmxbqvzxzezjqyoqfzdz/sql/new

-- Add every table to the supabase_realtime publication so postgres_changes
-- events are broadcast to subscribed browser clients.
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

-- Verify all tables are now in the realtime publication
-- (should print 14 rows on success)
select tablename from pg_publication_tables where pubname = 'supabase_realtime' order by tablename;

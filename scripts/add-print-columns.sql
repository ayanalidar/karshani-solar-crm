-- Add print tracking columns to quotations and invoices tables.
-- Run in Supabase SQL Editor (https://supabase.com/dashboard/project/jmxbqvzxzezjqyoqfzdz/sql/new)
-- Idempotent: safe to run multiple times.

-- Add print tracking to quotations
alter table quotations add column if not exists printed_at timestamptz;
alter table quotations add column if not exists print_count integer not null default 0;

-- Add print tracking to invoices
alter table invoices add column if not exists printed_at timestamptz;
alter table invoices add column if not exists print_count integer not null default 0;

-- Verify
select column_name, data_type from information_schema.columns
where table_name in ('quotations', 'invoices') and column_name in ('printed_at', 'print_count')
order by table_name, column_name;

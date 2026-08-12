-- Add payment_method column to transactions table
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ayiwltqmxbvurxoqyvbw/sql/new

alter table transactions add column if not exists payment_method text not null default 'cash';

-- Verify
select column_name, data_type from information_schema.columns
where table_name = 'transactions' and column_name = 'payment_method';

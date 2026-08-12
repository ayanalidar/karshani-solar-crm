-- Karshani CRM — Transactions table for Ledger
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ayiwltqmxbvurxoqyvbw/sql/new

-- Transactions table — logs every credit/debit per customer OR supplier
-- type: 'credit' = customer owes more (Udhaar/invoice generated)
--       'debit'  = customer paid (payment received)
-- partyType: 'customer' or 'supplier'
create table if not exists transactions (
  id text primary key default gen_random_uuid()::text,
  party_type text not null default 'customer',  -- 'customer' or 'supplier'
  party_id text,                                  -- customer.id or supplier_orders.supplier_name
  party_name text not null,                       -- customer name or supplier name
  type text not null,                             -- 'credit' or 'debit'
  amount double precision not null default 0,
  description text not null default '',
  transaction_date text not null,                 -- ISO date
  reference_type text not null default 'manual',  -- 'invoice', 'quotation', 'payment', 'manual', 'po', 'supplier_payment'
  reference_id text,                              -- invoice id, quotation id, etc.
  created_at timestamptz not null default now()
);

-- Enable Realtime
alter publication supabase_realtime add table public.transactions;

-- Verify
select count(*) as transactions_table_created from transactions;

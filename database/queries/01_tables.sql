-- 01) Tables
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null, -- INSERT/UPDATE/DELETE/SOFT_DELETE/HARD_DELETE/LOGIN/CREATE
  table_name text not null default 'users',
  row_id uuid,
  actor text, -- jwt sub or db user
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

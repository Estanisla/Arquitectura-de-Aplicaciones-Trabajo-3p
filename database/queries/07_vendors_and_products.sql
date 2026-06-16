-- 07) Vendors and products: tables, logs, triggers, safety guards

-- vendors: extiende public.users con informacion publica de la tienda
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendors_user_id_unique unique (user_id),
  constraint vendors_display_name_length check (char_length(trim(display_name)) >= 2)
);

create table if not exists public.vendor_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null,
  table_name text not null default 'vendors',
  row_id uuid,
  actor text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_length check (char_length(trim(name)) >= 2)
);

create table if not exists public.product_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null,
  table_name text not null default 'products',
  row_id uuid,
  actor text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

-- updated_at triggers
drop trigger if exists trg_vendors_set_updated_at on public.vendors;
create trigger trg_vendors_set_updated_at
before update on public.vendors
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_set_updated_at on public.products;
create trigger trg_products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

-- Audit functions and triggers
create or replace function public.log_vendors_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.vendor_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.vendor_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.vendor_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_vendors_audit on public.vendors;
create trigger trg_vendors_audit
after insert or update or delete on public.vendors
for each row
execute function public.log_vendors_changes();

create or replace function public.log_products_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.product_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.product_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.product_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_products_audit on public.products;
create trigger trg_products_audit
after insert or update or delete on public.products
for each row
execute function public.log_products_changes();

-- Safety guards: block direct DELETE and TRUNCATE on vendors
create or replace function public.block_direct_vendor_delete()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_vendor_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre vendors bloqueado. Usa la funcion vendor_hard_delete.';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_block_direct_vendor_delete on public.vendors;
create trigger trg_block_direct_vendor_delete
before delete on public.vendors
for each statement
execute function public.block_direct_vendor_delete();

create or replace function public.block_vendors_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre vendors bloqueado.';
end;
$$;

drop trigger if exists trg_block_vendors_truncate on public.vendors;
create trigger trg_block_vendors_truncate
before truncate on public.vendors
for each statement
execute function public.block_vendors_truncate();

-- Safety guards: block direct DELETE and TRUNCATE on products
create or replace function public.block_direct_product_delete()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.allow_product_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre products bloqueado. Usa la funcion product_hard_delete.';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_block_direct_product_delete on public.products;
create trigger trg_block_direct_product_delete
before delete on public.products
for each statement
execute function public.block_direct_product_delete();

create or replace function public.block_products_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre products bloqueado.';
end;
$$;

drop trigger if exists trg_block_products_truncate on public.products;
create trigger trg_block_products_truncate
before truncate on public.products
for each statement
execute function public.block_products_truncate();

-- Block direct table access from client roles
revoke all on table public.vendors from anon, authenticated;
revoke all on table public.vendor_logs from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_logs from anon, authenticated;

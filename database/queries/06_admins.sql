-- 06) Admins: tables, logs, triggers, safety guards, RPC + grants
-- Mirrors the vendor users setup, but for company-admin.

-- Tables
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null, -- INSERT/UPDATE/DELETE/SOFT_DELETE/HARD_DELETE/LOGIN/CREATE
  table_name text not null default 'admins',
  row_id uuid,
  actor text, -- jwt sub or db user
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

-- updated_at trigger
drop trigger if exists trg_admins_set_updated_at on public.admins;
create trigger trg_admins_set_updated_at
before update on public.admins
for each row
execute function public.set_updated_at();

-- Audit trigger on admins
create or replace function public.log_admins_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admin_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.admin_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.admin_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_admins_audit on public.admins;
create trigger trg_admins_audit
after insert or update or delete on public.admins
for each row
execute function public.log_admins_changes();

-- Safety guards: block direct DELETE and TRUNCATE
create or replace function public.block_direct_admin_delete()
returns trigger
language plpgsql
as $$
begin
  -- Allow DELETE only when admin_hard_delete enables it in transaction.
  if current_setting('app.allow_admin_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre admins bloqueado. Usa la funcion admin_hard_delete.';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_block_direct_admin_delete on public.admins;
create trigger trg_block_direct_admin_delete
before delete on public.admins
for each statement
execute function public.block_direct_admin_delete();

create or replace function public.block_admins_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre admins bloqueado.';
end;
$$;

drop trigger if exists trg_block_admins_truncate on public.admins;
create trigger trg_block_admins_truncate
before truncate on public.admins
for each statement
execute function public.block_admins_truncate();

-- Business functions

-- admin_create(username, password)
-- Bootstrap only; do NOT expose to anon/authenticated.
create or replace function public.admin_create(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'username requerido';
  end if;

  if p_password is null or length(p_password) < 10 then
    raise exception 'password minimo 10 caracteres';
  end if;

  insert into public.admins(username, password_hash)
  values (
    trim(p_username),
    extensions.crypt(p_password, extensions.gen_salt('bf'))
  )
  returning id into v_admin_id;

  insert into public.admin_logs(action, row_id, actor, reason)
  values ('CREATE', v_admin_id, public.current_actor(), 'admin_create function');

  return jsonb_build_object(
    'ok', true,
    'message', 'Admin creado',
    'admin_id', v_admin_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'Username ya existe');
end;
$$;

-- admin_login(username, password)
-- Avoids user enumeration by returning the same message.
create or replace function public.admin_login(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.admins%rowtype;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  if p_password is null or length(p_password) < 10 then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  select *
    into v_admin
  from public.admins
  where username = trim(p_username)
    and is_deleted = false
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  if extensions.crypt(p_password, v_admin.password_hash) <> v_admin.password_hash then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  insert into public.admin_logs(action, row_id, actor, reason)
  values ('LOGIN', v_admin.id, public.current_actor(), 'Login correcto');

  return jsonb_build_object(
    'ok', true,
    'message', 'Login correcto',
    'admin_id', v_admin.id
  );
end;
$$;

-- admin_soft_delete(admin_id, reason)
create or replace function public.admin_soft_delete(
  p_admin_id uuid,
  p_reason text default 'soft delete'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admins
  set is_deleted = true,
      deleted_at = now()
  where id = p_admin_id
    and is_deleted = false;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Admin no encontrado o ya eliminado');
  end if;

  insert into public.admin_logs(action, row_id, actor, reason)
  values ('SOFT_DELETE', p_admin_id, public.current_actor(), coalesce(p_reason, 'soft delete'));

  return jsonb_build_object('ok', true, 'message', 'Admin eliminado (soft)');
end;
$$;

-- admin_hard_delete(admin_id, reason)
create or replace function public.admin_hard_delete(
  p_admin_id uuid,
  p_reason text default 'hard delete'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enable DELETE only inside this transaction.
  perform set_config('app.allow_admin_delete', 'on', true);

  delete from public.admins
  where id = p_admin_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Admin no encontrado');
  end if;

  insert into public.admin_logs(action, row_id, actor, reason)
  values ('HARD_DELETE', p_admin_id, public.current_actor(), coalesce(p_reason, 'hard delete'));

  return jsonb_build_object('ok', true, 'message', 'Admin eliminado (hard)');
end;
$$;

-- Block direct table access from client roles
revoke all on table public.admins from anon, authenticated;
revoke all on table public.admin_logs from anon, authenticated;

-- Allow RPC execution only
grant execute on function public.admin_login(text, text) to anon, authenticated;

-- Bootstrap/admin management: service_role only
revoke all on function public.admin_create(text, text) from anon, authenticated;
grant execute on function public.admin_create(text, text) to service_role;

revoke all on function public.admin_soft_delete(uuid, text) from anon, authenticated;
revoke all on function public.admin_hard_delete(uuid, text) from anon, authenticated;
grant execute on function public.admin_soft_delete(uuid, text) to service_role;
grant execute on function public.admin_hard_delete(uuid, text) to service_role;

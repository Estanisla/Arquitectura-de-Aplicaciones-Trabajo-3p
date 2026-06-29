-- 13) Emporiums, multi-user store management and contact channels
-- Keeps vendors.user_id as the legacy owner while store_members enables
-- one or more users to manage the same store.

create table if not exists public.emporiums (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emporiums_admin_unique unique (admin_id),
  constraint emporiums_name_length check (char_length(trim(name)) >= 2)
);

create table if not exists public.emporium_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null,
  table_name text not null default 'emporiums',
  row_id uuid,
  actor text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

alter table public.vendors
  add column if not exists emporium_id uuid references public.emporiums(id);

create table if not exists public.store_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  member_role text not null default 'manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_members_vendor_user_unique unique (vendor_id, user_id),
  constraint store_members_role_check check (member_role in ('owner', 'manager'))
);

create table if not exists public.store_member_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null,
  table_name text not null default 'store_members',
  row_id uuid,
  actor text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

create table if not exists public.store_contacts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  channel text not null,
  value text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_contacts_vendor_channel_unique unique (vendor_id, channel),
  constraint store_contacts_channel_check check (
    channel in ('whatsapp', 'instagram', 'facebook', 'email', 'website')
  ),
  constraint store_contacts_value_check check (char_length(trim(value)) >= 3)
);

create table if not exists public.store_contact_logs (
  id bigserial primary key,
  event_time timestamptz not null default now(),
  action text not null,
  table_name text not null default 'store_contacts',
  row_id uuid,
  actor text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  txid bigint not null default txid_current()
);

alter table public.emporiums enable row level security;
alter table public.emporium_logs enable row level security;
alter table public.store_members enable row level security;
alter table public.store_member_logs enable row level security;
alter table public.store_contacts enable row level security;
alter table public.store_contact_logs enable row level security;

drop trigger if exists trg_emporiums_set_updated_at on public.emporiums;
create trigger trg_emporiums_set_updated_at
before update on public.emporiums
for each row execute function public.set_updated_at();

drop trigger if exists trg_store_members_set_updated_at on public.store_members;
create trigger trg_store_members_set_updated_at
before update on public.store_members
for each row execute function public.set_updated_at();

drop trigger if exists trg_store_contacts_set_updated_at on public.store_contacts;
create trigger trg_store_contacts_set_updated_at
before update on public.store_contacts
for each row execute function public.set_updated_at();

create or replace function public.log_emporiums_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.emporium_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.emporium_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.emporium_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.log_store_members_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.store_member_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.store_member_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.store_member_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.log_store_contacts_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.store_contact_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.store_contact_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.store_contact_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_emporiums_audit on public.emporiums;
create trigger trg_emporiums_audit
after insert or update or delete on public.emporiums
for each row execute function public.log_emporiums_changes();

drop trigger if exists trg_store_members_audit on public.store_members;
create trigger trg_store_members_audit
after insert or update or delete on public.store_members
for each row execute function public.log_store_members_changes();

drop trigger if exists trg_store_contacts_audit on public.store_contacts;
create trigger trg_store_contacts_audit
after insert or update or delete on public.store_contacts
for each row execute function public.log_store_contacts_changes();

create or replace function public.block_direct_emporium_delete()
returns trigger language plpgsql as $$
begin
  if current_setting('app.allow_emporium_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre emporiums bloqueado.';
  end if;
  return null;
end;
$$;

create or replace function public.block_direct_store_member_delete()
returns trigger language plpgsql as $$
begin
  if current_setting('app.allow_store_member_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre store_members bloqueado.';
  end if;
  return null;
end;
$$;

create or replace function public.block_direct_store_contact_delete()
returns trigger language plpgsql as $$
begin
  if current_setting('app.allow_store_contact_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre store_contacts bloqueado.';
  end if;
  return null;
end;
$$;

create or replace function public.block_emporiums_truncate()
returns trigger language plpgsql as $$
begin raise exception 'TRUNCATE sobre emporiums bloqueado.'; end;
$$;

create or replace function public.block_store_members_truncate()
returns trigger language plpgsql as $$
begin raise exception 'TRUNCATE sobre store_members bloqueado.'; end;
$$;

create or replace function public.block_store_contacts_truncate()
returns trigger language plpgsql as $$
begin raise exception 'TRUNCATE sobre store_contacts bloqueado.'; end;
$$;

drop trigger if exists trg_block_direct_emporium_delete on public.emporiums;
create trigger trg_block_direct_emporium_delete
before delete on public.emporiums
for each statement execute function public.block_direct_emporium_delete();

drop trigger if exists trg_block_direct_store_member_delete on public.store_members;
create trigger trg_block_direct_store_member_delete
before delete on public.store_members
for each statement execute function public.block_direct_store_member_delete();

drop trigger if exists trg_block_direct_store_contact_delete on public.store_contacts;
create trigger trg_block_direct_store_contact_delete
before delete on public.store_contacts
for each statement execute function public.block_direct_store_contact_delete();

drop trigger if exists trg_block_emporiums_truncate on public.emporiums;
create trigger trg_block_emporiums_truncate
before truncate on public.emporiums
for each statement execute function public.block_emporiums_truncate();

drop trigger if exists trg_block_store_members_truncate on public.store_members;
create trigger trg_block_store_members_truncate
before truncate on public.store_members
for each statement execute function public.block_store_members_truncate();

drop trigger if exists trg_block_store_contacts_truncate on public.store_contacts;
create trigger trg_block_store_contacts_truncate
before truncate on public.store_contacts
for each statement execute function public.block_store_contacts_truncate();

create or replace function public.admin_create_store_with_members(
  p_admin_id uuid,
  p_emporium_name text,
  p_store_name text,
  p_description text,
  p_members jsonb,
  p_contacts jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emporium_id uuid;
  v_vendor_id uuid;
  v_owner_user_id uuid;
  v_member jsonb;
  v_contact jsonb;
  v_user_id uuid;
  v_user_ids uuid[] := '{}';
  v_roles text[] := '{}';
  v_index integer;
  v_owner_count integer;
begin
  if not exists (
    select 1 from public.admins
    where id = p_admin_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Admin no autorizado');
  end if;

  if p_emporium_name is null or char_length(trim(p_emporium_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de emporio invalido');
  end if;

  if p_store_name is null or char_length(trim(p_store_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de tienda invalido');
  end if;

  if jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 1 then
    return jsonb_build_object('ok', false, 'message', 'La tienda requiere al menos un usuario');
  end if;

  select count(*) filter (where value->>'role' = 'owner')
    into v_owner_count
  from jsonb_array_elements(p_members);

  if v_owner_count <> 1 then
    return jsonb_build_object('ok', false, 'message', 'La tienda requiere exactamente un propietario');
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_members)
    where char_length(trim(coalesce(value->>'username', ''))) < 3
      or char_length(coalesce(value->>'temp_password', '')) < 6
      or coalesce(value->>'role', '') not in ('owner', 'manager')
  ) then
    return jsonb_build_object('ok', false, 'message', 'Datos de usuario invalidos');
  end if;

  if (
    select count(*) from jsonb_array_elements(p_members)
  ) <> (
    select count(distinct lower(trim(value->>'username')))
    from jsonb_array_elements(p_members)
  ) then
    return jsonb_build_object('ok', false, 'message', 'Los usernames deben ser unicos');
  end if;

  if exists (
    select 1
    from public.users u
    where lower(u.username) in (
      select lower(trim(value->>'username'))
      from jsonb_array_elements(p_members)
    )
  ) then
    return jsonb_build_object('ok', false, 'message', 'Uno de los usernames ya existe');
  end if;

  if jsonb_typeof(coalesce(p_contacts, '[]'::jsonb)) <> 'array' then
    return jsonb_build_object('ok', false, 'message', 'Contactos invalidos');
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb))
    where coalesce(value->>'channel', '') not in (
      'whatsapp', 'instagram', 'facebook', 'email', 'website'
    )
      or char_length(trim(coalesce(value->>'value', ''))) < 3
  ) then
    return jsonb_build_object('ok', false, 'message', 'Contacto invalido');
  end if;

  select id into v_emporium_id
  from public.emporiums
  where admin_id = p_admin_id
  limit 1;

  if not found then
    insert into public.emporiums(admin_id, name)
    values (p_admin_id, trim(p_emporium_name))
    returning id into v_emporium_id;
  end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    insert into public.users(username, password_hash, must_change_password)
    values (
      trim(v_member->>'username'),
      extensions.crypt(v_member->>'temp_password', extensions.gen_salt('bf')),
      true
    )
    returning id into v_user_id;

    v_user_ids := array_append(v_user_ids, v_user_id);
    v_roles := array_append(v_roles, v_member->>'role');

    if v_member->>'role' = 'owner' then
      v_owner_user_id := v_user_id;
    end if;
  end loop;

  insert into public.vendors(
    user_id,
    emporium_id,
    display_name,
    description
  )
  values (
    v_owner_user_id,
    v_emporium_id,
    trim(p_store_name),
    nullif(trim(coalesce(p_description, '')), '')
  )
  returning id into v_vendor_id;

  for v_index in 1..coalesce(array_length(v_user_ids, 1), 0)
  loop
    insert into public.store_members(vendor_id, user_id, member_role)
    values (v_vendor_id, v_user_ids[v_index], v_roles[v_index]);
  end loop;

  for v_contact in
    select value from jsonb_array_elements(coalesce(p_contacts, '[]'::jsonb))
  loop
    insert into public.store_contacts(vendor_id, channel, value)
    values (
      v_vendor_id,
      v_contact->>'channel',
      trim(v_contact->>'value')
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'message', 'Tienda y usuarios creados correctamente',
    'store_id', v_vendor_id,
    'emporium_name', (
      select name from public.emporiums where id = v_emporium_id
    )
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'La tienda, usuario o contacto ya existe');
end;
$$;

create or replace function public.admin_list_stores_with_members(
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emporium public.emporiums%rowtype;
  v_stores jsonb;
begin
  select * into v_emporium
  from public.emporiums
  where admin_id = p_admin_id and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', true,
      'message', 'Emporio sin tiendas',
      'data', jsonb_build_object(
        'emporium_name', null,
        'stores', '[]'::jsonb
      )
    );
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'store_id', v.id,
        'display_name', v.display_name,
        'description', v.description,
        'is_active', v.is_active,
        'created_at', v.created_at,
        'members', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'username', u.username,
              'role', sm.member_role,
              'must_change_password', u.must_change_password
            )
            order by sm.created_at
          )
          from public.store_members sm
          join public.users u on u.id = sm.user_id
          where sm.vendor_id = v.id
            and sm.is_active = true
            and u.is_deleted = false
        ), '[]'::jsonb),
        'contacts', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'channel', sc.channel,
              'value', sc.value
            )
            order by sc.channel
          )
          from public.store_contacts sc
          where sc.vendor_id = v.id and sc.is_public = true
        ), '[]'::jsonb)
      )
      order by v.created_at desc
    ),
    '[]'::jsonb
  )
  into v_stores
  from public.vendors v
  where v.emporium_id = v_emporium.id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Tiendas obtenidas',
    'data', jsonb_build_object(
      'emporium_name', v_emporium.name,
      'stores', v_stores
    )
  );
end;
$$;

create or replace function public.vendor_list_managed_stores(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stores jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'store_id', v.id,
        'display_name', v.display_name,
        'role', coalesce(sm.member_role, 'owner')
      )
      order by v.display_name
    ),
    '[]'::jsonb
  )
  into v_stores
  from public.vendors v
  left join public.store_members sm
    on sm.vendor_id = v.id
   and sm.user_id = p_user_id
   and sm.is_active = true
  where v.is_active = true
    and (v.user_id = p_user_id or sm.user_id is not null);

  return jsonb_build_object(
    'ok', true,
    'message', 'Tiendas administradas obtenidas',
    'data', v_stores
  );
end;
$$;

create or replace function public.get_vendor_contacts(
  p_vendor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contacts jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object('channel', channel, 'value', value)
      order by channel
    ),
    '[]'::jsonb
  )
  into v_contacts
  from public.store_contacts
  where vendor_id = p_vendor_id and is_public = true;

  return jsonb_build_object(
    'ok', true,
    'message', 'Contactos obtenidos',
    'data', v_contacts
  );
end;
$$;

create or replace function public.get_vendor_profile(
  p_vendor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor public.vendors%rowtype;
  v_products jsonb;
  v_contacts jsonb;
begin
  select * into v_vendor
  from public.vendors
  where id = p_vendor_id and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Vendedor no encontrado');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'image_url', p.image_url
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.products p
  where p.vendor_id = v_vendor.id and p.is_visible = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('channel', channel, 'value', value)
      order by channel
    ),
    '[]'::jsonb
  )
  into v_contacts
  from public.store_contacts
  where vendor_id = v_vendor.id and is_public = true;

  return jsonb_build_object(
    'ok', true,
    'message', 'Tienda obtenida',
    'data', jsonb_build_object(
      'vendor_id', v_vendor.id,
      'display_name', v_vendor.display_name,
      'description', v_vendor.description,
      'products', v_products,
      'contacts', v_contacts
    )
  );
end;
$$;

create or replace function public._assert_vendor_ownership(
  p_vendor_id uuid,
  p_actor text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid;
begin
  select v.id into v_vendor_id
  from public.vendors v
  left join public.store_members sm
    on sm.vendor_id = v.id
   and sm.user_id::text = p_actor
   and sm.is_active = true
  where v.id = p_vendor_id
    and v.is_active = true
    and (v.user_id::text = p_actor or sm.user_id is not null)
  limit 1;

  if not found then return null; end if;
  return v_vendor_id;
end;
$$;

create or replace function public.get_my_vendor_profile(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor public.vendors%rowtype;
  v_products jsonb;
begin
  select v.* into v_vendor
  from public.vendors v
  left join public.store_members sm
    on sm.vendor_id = v.id
   and sm.user_id = p_user_id
   and sm.is_active = true
  where v.is_active = true
    and (v.user_id = p_user_id or sm.user_id is not null)
  order by v.created_at
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'image_url', p.image_url,
        'is_visible', p.is_visible,
        'created_at', p.created_at
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.products p
  where p.vendor_id = v_vendor.id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Tienda obtenida',
    'data', jsonb_build_object(
      'vendor_id', v_vendor.id,
      'display_name', v_vendor.display_name,
      'description', v_vendor.description,
      'is_active', v_vendor.is_active,
      'products', v_products
    )
  );
end;
$$;

create or replace function public.vendor_update_profile(
  p_vendor_id uuid,
  p_display_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := public.current_actor();
begin
  if public._assert_vendor_ownership(p_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada o no autorizada');
  end if;

  if p_display_name is null or char_length(trim(p_display_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de tienda invalido');
  end if;

  update public.vendors
  set display_name = trim(p_display_name),
      description = nullif(trim(coalesce(p_description, '')), '')
  where id = p_vendor_id;

  return jsonb_build_object('ok', true, 'message', 'Perfil actualizado correctamente');
end;
$$;

create or replace function public.product_update(
  p_product_id uuid,
  p_name text,
  p_description text default null,
  p_image_url text default null,
  p_is_visible boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := public.current_actor();
  v_vendor_id uuid;
begin
  select vendor_id into v_vendor_id
  from public.products
  where id = p_product_id;

  if not found or public._assert_vendor_ownership(v_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de producto invalido');
  end if;

  update public.products
  set name = trim(p_name),
      description = p_description,
      image_url = p_image_url,
      is_visible = p_is_visible
  where id = p_product_id;

  return jsonb_build_object('ok', true, 'message', 'Producto actualizado');
end;
$$;

create or replace function public.product_soft_delete(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := public.current_actor();
  v_vendor_id uuid;
begin
  select vendor_id into v_vendor_id
  from public.products
  where id = p_product_id;

  if not found or public._assert_vendor_ownership(v_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  update public.products set is_visible = false where id = p_product_id;
  return jsonb_build_object('ok', true, 'message', 'Producto ocultado');
end;
$$;

create or replace function public.product_hard_delete(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text := public.current_actor();
  v_vendor_id uuid;
begin
  select vendor_id into v_vendor_id
  from public.products
  where id = p_product_id;

  if not found or public._assert_vendor_ownership(v_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  perform set_config('app.allow_product_delete', 'on', true);
  delete from public.products where id = p_product_id;
  return jsonb_build_object('ok', true, 'message', 'Producto eliminado definitivamente');
end;
$$;

revoke all on table public.emporiums from anon, authenticated, public;
revoke all on table public.emporium_logs from anon, authenticated, public;
revoke all on table public.store_members from anon, authenticated, public;
revoke all on table public.store_member_logs from anon, authenticated, public;
revoke all on table public.store_contacts from anon, authenticated, public;
revoke all on table public.store_contact_logs from anon, authenticated, public;

revoke all on function public.admin_create_store_with_members(
  uuid, text, text, text, jsonb, jsonb
) from anon, authenticated, public;
grant execute on function public.admin_create_store_with_members(
  uuid, text, text, text, jsonb, jsonb
) to authenticated;
grant execute on function public.admin_create_store_with_members(
  uuid, text, text, text, jsonb, jsonb
) to service_role;

revoke all on function public.admin_list_stores_with_members(uuid)
from anon, authenticated, public;
grant execute on function public.admin_list_stores_with_members(uuid)
to authenticated;
grant execute on function public.admin_list_stores_with_members(uuid)
to service_role;

revoke all on function public.vendor_list_managed_stores(uuid)
from anon, authenticated, public;
grant execute on function public.vendor_list_managed_stores(uuid)
to authenticated;

revoke all on function public.get_vendor_contacts(uuid)
from anon, authenticated, public;
grant execute on function public.get_vendor_contacts(uuid)
to anon, authenticated;

revoke all on function public.get_vendor_profile(uuid)
from anon, authenticated, public;
grant execute on function public.get_vendor_profile(uuid)
to anon, authenticated;

revoke all on function public._assert_vendor_ownership(uuid, text)
from anon, authenticated, public;
grant execute on function public._assert_vendor_ownership(uuid, text)
to authenticated;

revoke all on function public.get_my_vendor_profile(uuid)
from anon, authenticated, public;
grant execute on function public.get_my_vendor_profile(uuid)
to authenticated;

revoke all on function public.vendor_update_profile(uuid, text, text)
from anon, authenticated, public;
grant execute on function public.vendor_update_profile(uuid, text, text)
to authenticated;

revoke all on function public.product_update(uuid, text, text, text, boolean)
from anon, authenticated, public;
grant execute on function public.product_update(uuid, text, text, text, boolean)
to authenticated;

revoke all on function public.product_soft_delete(uuid)
from anon, authenticated, public;
grant execute on function public.product_soft_delete(uuid)
to authenticated;

revoke all on function public.product_hard_delete(uuid)
from anon, authenticated, public;
grant execute on function public.product_hard_delete(uuid)
to authenticated;

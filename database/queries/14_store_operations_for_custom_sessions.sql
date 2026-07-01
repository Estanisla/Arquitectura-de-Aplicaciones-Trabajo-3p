-- 14) Store operations for backend-managed sessions.
-- The application authenticates users with its own HTTP-only cookie. These
-- RPCs are service_role-only and receive the session subject from the backend.

create or replace function public._get_store_member_role(
  p_user_id uuid,
  p_vendor_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select coalesce(sm.member_role, 'owner')
    into v_role
  from public.vendors v
  left join public.store_members sm
    on sm.vendor_id = v.id
   and sm.user_id = p_user_id
   and sm.is_active = true
  join public.users u
    on u.id = p_user_id
   and u.is_deleted = false
  where v.id = p_vendor_id
    and v.is_active = true
    and (v.user_id = p_user_id or sm.user_id is not null)
  limit 1;

  return v_role;
end;
$$;

create or replace function public._admin_owns_store(
  p_admin_id uuid,
  p_vendor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.admins a
    join public.emporiums e on e.admin_id = a.id and e.is_active = true
    join public.vendors v on v.emporium_id = e.id
    where a.id = p_admin_id
      and a.is_deleted = false
      and v.id = p_vendor_id
  );
end;
$$;

create or replace function public._replace_store_contacts(
  p_vendor_id uuid,
  p_contacts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact jsonb;
  v_contacts jsonb := coalesce(p_contacts, '[]'::jsonb);
begin
  if jsonb_typeof(v_contacts) <> 'array' then
    return jsonb_build_object('ok', false, 'message', 'Contactos invalidos');
  end if;

  if jsonb_array_length(v_contacts) > 5 then
    return jsonb_build_object('ok', false, 'message', 'Cantidad de contactos invalida');
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_contacts)
    where coalesce(value->>'channel', '') not in (
      'whatsapp', 'instagram', 'facebook', 'email', 'website'
    )
      or char_length(trim(coalesce(value->>'value', ''))) < 3
      or char_length(trim(coalesce(value->>'value', ''))) > 300
  ) then
    return jsonb_build_object('ok', false, 'message', 'Contacto invalido');
  end if;

  if (
    select count(*) from jsonb_array_elements(v_contacts)
  ) <> (
    select count(distinct value->>'channel')
    from jsonb_array_elements(v_contacts)
  ) then
    return jsonb_build_object('ok', false, 'message', 'Los canales no deben repetirse');
  end if;

  perform set_config('app.allow_store_contact_delete', 'on', true);
  delete from public.store_contacts where vendor_id = p_vendor_id;

  for v_contact in select value from jsonb_array_elements(v_contacts)
  loop
    insert into public.store_contacts(vendor_id, channel, value, is_public)
    values (
      p_vendor_id,
      v_contact->>'channel',
      trim(v_contact->>'value'),
      true
    );
  end loop;

  return jsonb_build_object('ok', true, 'message', 'Contactos actualizados');
end;
$$;

create or replace function public.vendor_get_managed_stores(
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
  if not exists (
    select 1 from public.users
    where id = p_user_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Usuario no autorizado');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'store_id', v.id,
        'display_name', v.display_name,
        'member_role', coalesce(sm.member_role, 'owner')
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

create or replace function public.vendor_get_store_dashboard(
  p_user_id uuid,
  p_vendor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor public.vendors%rowtype;
  v_role text;
  v_products jsonb;
  v_contacts jsonb;
begin
  v_role := public._get_store_member_role(p_user_id, p_vendor_id);
  if v_role is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  select * into v_vendor
  from public.vendors
  where id = p_vendor_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'image_url', p.image_url,
        'is_visible', p.is_visible,
        'created_at', p.created_at,
        'updated_at', p.updated_at
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.products p
  where p.vendor_id = p_vendor_id;

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
    'message', 'Tienda obtenida',
    'data', jsonb_build_object(
      'store_id', v_vendor.id,
      'display_name', v_vendor.display_name,
      'description', v_vendor.description,
      'is_active', v_vendor.is_active,
      'member_role', v_role,
      'products', v_products,
      'contacts', v_contacts
    )
  );
end;
$$;

create or replace function public.vendor_update_store_profile(
  p_user_id uuid,
  p_vendor_id uuid,
  p_display_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public._get_store_member_role(p_user_id, p_vendor_id) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  if p_display_name is null
     or char_length(trim(p_display_name)) < 2
     or char_length(trim(p_display_name)) > 120 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de tienda invalido');
  end if;

  update public.vendors
  set display_name = trim(p_display_name),
      description = nullif(trim(coalesce(p_description, '')), '')
  where id = p_vendor_id;

  return jsonb_build_object('ok', true, 'message', 'Tienda actualizada');
end;
$$;

create or replace function public.vendor_update_store_contacts(
  p_user_id uuid,
  p_vendor_id uuid,
  p_contacts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public._get_store_member_role(p_user_id, p_vendor_id) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  return public._replace_store_contacts(p_vendor_id, p_contacts);
end;
$$;

create or replace function public.vendor_create_product(
  p_user_id uuid,
  p_vendor_id uuid,
  p_name text,
  p_description text default null,
  p_image_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
begin
  if public._get_store_member_role(p_user_id, p_vendor_id) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  if p_name is null
     or char_length(trim(p_name)) < 2
     or char_length(trim(p_name)) > 160 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de producto invalido');
  end if;

  insert into public.products(vendor_id, name, description, image_url)
  values (
    p_vendor_id,
    trim(p_name),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_image_url, '')), '')
  )
  returning id into v_product_id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Producto creado',
    'product_id', v_product_id
  );
end;
$$;

create or replace function public.vendor_update_product(
  p_user_id uuid,
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
  v_vendor_id uuid;
begin
  select vendor_id into v_vendor_id
  from public.products
  where id = p_product_id;

  if not found
     or public._get_store_member_role(p_user_id, v_vendor_id) is null then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado');
  end if;

  if p_name is null
     or char_length(trim(p_name)) < 2
     or char_length(trim(p_name)) > 160 then
    return jsonb_build_object('ok', false, 'message', 'Nombre de producto invalido');
  end if;

  update public.products
  set name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      image_url = nullif(trim(coalesce(p_image_url, '')), ''),
      is_visible = p_is_visible
  where id = p_product_id;

  return jsonb_build_object('ok', true, 'message', 'Producto actualizado');
end;
$$;

create or replace function public.vendor_remove_product(
  p_user_id uuid,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid;
begin
  select vendor_id into v_vendor_id
  from public.products
  where id = p_product_id;

  if not found
     or public._get_store_member_role(p_user_id, v_vendor_id) is null then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado');
  end if;

  update public.products
  set is_visible = false
  where id = p_product_id;

  return jsonb_build_object('ok', true, 'message', 'Producto retirado');
end;
$$;

create or replace function public.admin_add_store_member(
  p_admin_id uuid,
  p_vendor_id uuid,
  p_username text,
  p_temp_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not public._admin_owns_store(p_admin_id, p_vendor_id) then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  if p_username is null
     or char_length(trim(p_username)) < 3
     or char_length(trim(p_username)) > 80
     or p_temp_password is null
     or char_length(p_temp_password) < 6 then
    return jsonb_build_object('ok', false, 'message', 'Datos de usuario invalidos');
  end if;

  if exists (
    select 1 from public.users where lower(username) = lower(trim(p_username))
  ) then
    return jsonb_build_object('ok', false, 'message', 'El usuario ya existe');
  end if;

  insert into public.users(username, password_hash, must_change_password)
  values (
    trim(p_username),
    extensions.crypt(p_temp_password, extensions.gen_salt('bf')),
    true
  )
  returning id into v_user_id;

  insert into public.store_members(vendor_id, user_id, member_role)
  values (p_vendor_id, v_user_id, 'manager');

  return jsonb_build_object(
    'ok', true,
    'message', 'Usuario agregado a la tienda',
    'username', trim(p_username)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'El usuario ya existe');
end;
$$;

create or replace function public.admin_set_store_member_active(
  p_admin_id uuid,
  p_vendor_id uuid,
  p_username text,
  p_is_active boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_role text;
begin
  if not public._admin_owns_store(p_admin_id, p_vendor_id) then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  select sm.member_role into v_member_role
  from public.store_members sm
  join public.users u on u.id = sm.user_id
  where sm.vendor_id = p_vendor_id
    and lower(u.username) = lower(trim(p_username))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  if v_member_role = 'owner' and p_is_active = false then
    return jsonb_build_object('ok', false, 'message', 'No se puede desactivar al propietario');
  end if;

  update public.store_members sm
  set is_active = p_is_active
  from public.users u
  where sm.user_id = u.id
    and sm.vendor_id = p_vendor_id
    and lower(u.username) = lower(trim(p_username));

  return jsonb_build_object(
    'ok', true,
    'message', case
      when p_is_active then 'Usuario activado'
      else 'Usuario desactivado'
    end
  );
end;
$$;

create or replace function public.admin_update_store_contacts(
  p_admin_id uuid,
  p_vendor_id uuid,
  p_contacts jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_owns_store(p_admin_id, p_vendor_id) then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  return public._replace_store_contacts(p_vendor_id, p_contacts);
end;
$$;

-- Include inactive memberships so company-admins can reactivate managers.
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
              'is_active', sm.is_active,
              'must_change_password', u.must_change_password
            )
            order by sm.created_at
          )
          from public.store_members sm
          join public.users u on u.id = sm.user_id
          where sm.vendor_id = v.id
            and u.is_deleted = false
        ), '[]'::jsonb),
        'contacts', coalesce((
          select jsonb_agg(
            jsonb_build_object('channel', sc.channel, 'value', sc.value)
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

revoke all on function public._get_store_member_role(uuid, uuid)
from anon, authenticated, public;
grant execute on function public._get_store_member_role(uuid, uuid)
to service_role;

revoke all on function public._admin_owns_store(uuid, uuid)
from anon, authenticated, public;
grant execute on function public._admin_owns_store(uuid, uuid)
to service_role;

revoke all on function public._replace_store_contacts(uuid, jsonb)
from anon, authenticated, public;
grant execute on function public._replace_store_contacts(uuid, jsonb)
to service_role;

revoke all on function public.vendor_get_managed_stores(uuid)
from anon, authenticated, public;
grant execute on function public.vendor_get_managed_stores(uuid)
to service_role;

revoke all on function public.vendor_get_store_dashboard(uuid, uuid)
from anon, authenticated, public;
grant execute on function public.vendor_get_store_dashboard(uuid, uuid)
to service_role;

revoke all on function public.vendor_update_store_profile(uuid, uuid, text, text)
from anon, authenticated, public;
grant execute on function public.vendor_update_store_profile(uuid, uuid, text, text)
to service_role;

revoke all on function public.vendor_update_store_contacts(uuid, uuid, jsonb)
from anon, authenticated, public;
grant execute on function public.vendor_update_store_contacts(uuid, uuid, jsonb)
to service_role;

revoke all on function public.vendor_create_product(uuid, uuid, text, text, text)
from anon, authenticated, public;
grant execute on function public.vendor_create_product(uuid, uuid, text, text, text)
to service_role;

revoke all on function public.vendor_update_product(
  uuid, uuid, text, text, text, boolean
) from anon, authenticated, public;
grant execute on function public.vendor_update_product(
  uuid, uuid, text, text, text, boolean
) to service_role;

revoke all on function public.vendor_remove_product(uuid, uuid)
from anon, authenticated, public;
grant execute on function public.vendor_remove_product(uuid, uuid)
to service_role;

revoke all on function public.admin_add_store_member(uuid, uuid, text, text)
from anon, authenticated, public;
grant execute on function public.admin_add_store_member(uuid, uuid, text, text)
to service_role;

revoke all on function public.admin_set_store_member_active(
  uuid, uuid, text, boolean
) from anon, authenticated, public;
grant execute on function public.admin_set_store_member_active(
  uuid, uuid, text, boolean
) to service_role;

revoke all on function public.admin_update_store_contacts(uuid, uuid, jsonb)
from anon, authenticated, public;
grant execute on function public.admin_update_store_contacts(uuid, uuid, jsonb)
to service_role;

revoke all on function public.admin_list_stores_with_members(uuid)
from anon, authenticated, public;
grant execute on function public.admin_list_stores_with_members(uuid)
to service_role;

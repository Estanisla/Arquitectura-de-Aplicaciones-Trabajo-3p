-- 10) Admin panel functions + grants

-- admin_create_vendor(admin_id, username, temp_password, display_name, description)
-- Solo ejecutable por authenticated (admin verificado desde el backend).
-- Crea usuario + perfil de tienda + marca must_change_password = true.
create or replace function public.admin_create_vendor(
  p_admin_id uuid,
  p_username text,
  p_temp_password text,
  p_display_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_vendor_id uuid;
begin
  if not exists (
    select 1 from public.admins where id = p_admin_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Admin no autorizado');
  end if;

  if p_username is null or length(trim(p_username)) = 0 then
    return jsonb_build_object('ok', false, 'message', 'username requerido');
  end if;

  if p_temp_password is null or length(p_temp_password) < 6 then
    return jsonb_build_object('ok', false, 'message', 'La contrasena temporal debe tener al menos 6 caracteres');
  end if;

  if p_display_name is null or length(trim(p_display_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'display_name minimo 2 caracteres');
  end if;

  insert into public.users(username, password_hash, must_change_password)
  values (
    trim(p_username),
    extensions.crypt(p_temp_password, extensions.gen_salt('bf')),
    true
  )
  returning id into v_user_id;

  insert into public.vendors(user_id, display_name, description)
  values (v_user_id, trim(p_display_name), p_description)
  returning id into v_vendor_id;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('CREATE', v_user_id, public.current_actor(), 'admin_create_vendor: cuenta creada por admin ' || p_admin_id::text);

  return jsonb_build_object(
    'ok', true,
    'message', 'Vendedor creado correctamente',
    'user_id', v_user_id,
    'vendor_id', v_vendor_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'El username ya existe');
end;
$$;

revoke all on function public.admin_create_vendor(uuid, text, text, text, text) from anon, authenticated, public;
grant execute on function public.admin_create_vendor(uuid, text, text, text, text) to authenticated;

-- admin_list_vendors(admin_id)
create or replace function public.admin_list_vendors(
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from public.admins where id = p_admin_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Admin no autorizado');
  end if;

  select coalesce(jsonb_agg(row order by u.created_at desc), '[]'::jsonb)
  into v_result
  from public.users u
  join public.vendors v on v.user_id = u.id
  cross join lateral (
    select jsonb_build_object(
      'user_id', u.id,
      'username', u.username,
      'display_name', v.display_name,
      'vendor_id', v.id,
      'is_active', v.is_active,
      'is_deleted', u.is_deleted,
      'must_change_password', u.must_change_password,
      'created_at', u.created_at
    ) as row
  ) sub;

  return jsonb_build_object('ok', true, 'data', v_result);
end;
$$;

revoke all on function public.admin_list_vendors(uuid) from anon, authenticated, public;
grant execute on function public.admin_list_vendors(uuid) to authenticated;

-- admin_deactivate_vendor(admin_id, vendor_id)
create or replace function public.admin_deactivate_vendor(
  p_admin_id uuid,
  p_vendor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.admins where id = p_admin_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Admin no autorizado');
  end if;

  update public.vendors
  set is_active = false
  where id = p_vendor_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Vendedor no encontrado');
  end if;

  insert into public.vendor_logs(action, row_id, actor, reason)
  values ('UPDATE', p_vendor_id, public.current_actor(), 'admin_deactivate_vendor por admin ' || p_admin_id::text);

  return jsonb_build_object('ok', true, 'message', 'Tienda desactivada');
end;
$$;

revoke all on function public.admin_deactivate_vendor(uuid, uuid) from anon, authenticated, public;
grant execute on function public.admin_deactivate_vendor(uuid, uuid) to authenticated;

-- 08) Vendor and product business functions + grants

-- get_vendor_list_with_products(preview_limit)
-- Retorna todos los vendedores activos con hasta preview_limit productos visibles cada uno.
create or replace function public.get_vendor_list_with_products(
  p_preview_limit int default 4
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select coalesce(jsonb_agg(vendor_row order by v.created_at desc), '[]'::jsonb)
  into v_result
  from public.vendors v
  cross join lateral (
    select jsonb_build_object(
      'vendor_id', v.id,
      'display_name', v.display_name,
      'description', v.description,
      'products', coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'description', p.description,
              'image_url', p.image_url
            )
            order by p.created_at desc
          )
          from (
            select id, name, description, image_url, created_at
            from public.products
            where vendor_id = v.id
              and is_visible = true
            order by created_at desc
            limit p_preview_limit
          ) p
        ),
        '[]'::jsonb
      )
    ) as vendor_row
  ) sub
  where v.is_active = true;

  return jsonb_build_object('ok', true, 'data', v_result);
end;
$$;

-- get_vendor_profile(vendor_id)
-- Retorna el perfil publico de un vendedor con todos sus productos visibles.
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
begin
  select *
    into v_vendor
  from public.vendors
  where id = p_vendor_id
    and is_active = true
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
  where p.vendor_id = v_vendor.id
    and p.is_visible = true;

  return jsonb_build_object(
    'ok', true,
    'data', jsonb_build_object(
      'vendor_id', v_vendor.id,
      'display_name', v_vendor.display_name,
      'description', v_vendor.description,
      'products', v_products
    )
  );
end;
$$;

-- vendor_create(user_id, display_name, description)
create or replace function public.vendor_create(
  p_user_id uuid,
  p_display_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor_id uuid;
begin
  if p_user_id is null then
    raise exception 'user_id requerido';
  end if;

  if p_display_name is null or length(trim(p_display_name)) < 2 then
    raise exception 'display_name minimo 2 caracteres';
  end if;

  -- Verificar que el user_id existe y no esta eliminado
  if not exists (
    select 1 from public.users where id = p_user_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  insert into public.vendors(user_id, display_name, description)
  values (p_user_id, trim(p_display_name), p_description)
  returning id into v_vendor_id;

  insert into public.vendor_logs(action, row_id, actor, reason)
  values ('CREATE', v_vendor_id, public.current_actor(), 'vendor_create function');

  return jsonb_build_object(
    'ok', true,
    'message', 'Tienda creada',
    'vendor_id', v_vendor_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'Este usuario ya tiene una tienda');
end;
$$;

-- Grants
-- Acceso publico a consultas de tiendas y productos (lectura)
grant execute on function public.get_vendor_list_with_products(int) to anon, authenticated;
grant execute on function public.get_vendor_profile(uuid) to anon, authenticated;

-- vendor_create: solo service_role (bootstrap o admin futuro)
revoke all on function public.vendor_create(uuid, text, text) from anon, authenticated;
grant execute on function public.vendor_create(uuid, text, text) to service_role;

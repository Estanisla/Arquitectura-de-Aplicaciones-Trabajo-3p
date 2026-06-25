-- 12) Product CRUD functions + grants

-- Helper: verifica que el vendor pertenece al actor actual
-- y retorna vendor_id o null.
-- Reutilizada por todas las funciones de producto.
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
  where v.id = p_vendor_id
    and v.user_id::text = p_actor
    and v.is_active = true;

  if not found then
    return null;
  end if;

  return v_vendor_id;
end;
$$;

revoke all on function public._assert_vendor_ownership(uuid, text) from anon, authenticated, public;
grant execute on function public._assert_vendor_ownership(uuid, text) to authenticated;

-- vendor_get_my_products(vendor_id)
-- Retorna todos los productos del vendedor autenticado, incluyendo no visibles.
create or replace function public.vendor_get_my_products(
  p_vendor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
  v_products jsonb;
begin
  v_actor := public.current_actor();

  if public._assert_vendor_ownership(p_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada o no autorizada');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',          p.id,
        'name',        p.name,
        'description', p.description,
        'image_url',   p.image_url,
        'is_visible',  p.is_visible,
        'created_at',  p.created_at,
        'updated_at',  p.updated_at
      )
      order by p.created_at desc
    ),
    '[]'::jsonb
  )
  into v_products
  from public.products p
  where p.vendor_id = p_vendor_id;

  return jsonb_build_object('ok', true, 'data', v_products);
end;
$$;

revoke all on function public.vendor_get_my_products(uuid) from anon, authenticated, public;
grant execute on function public.vendor_get_my_products(uuid) to authenticated;

-- product_create(vendor_id, name, description, image_url)
create or replace function public.product_create(
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
  v_actor text;
  v_product_id uuid;
begin
  v_actor := public.current_actor();

  if public._assert_vendor_ownership(p_vendor_id, v_actor) is null then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada o no autorizada');
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'El nombre debe tener al menos 2 caracteres');
  end if;

  insert into public.products(vendor_id, name, description, image_url)
  values (p_vendor_id, trim(p_name), p_description, p_image_url)
  returning id into v_product_id;

  insert into public.product_logs(action, row_id, actor, reason)
  values ('INSERT', v_product_id, v_actor, 'product_create');

  return jsonb_build_object(
    'ok', true,
    'message', 'Producto creado',
    'product_id', v_product_id
  );
end;
$$;

revoke all on function public.product_create(uuid, text, text, text) from anon, authenticated, public;
grant execute on function public.product_create(uuid, text, text, text) to authenticated;

-- product_update(product_id, name, description, image_url, is_visible)
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
  v_actor text;
  v_vendor_id uuid;
begin
  v_actor := public.current_actor();

  -- Obtener vendor_id del producto y verificar ownership
  select v.id into v_vendor_id
  from public.products p
  join public.vendors v on v.id = p.vendor_id
  where p.id = p_product_id
    and v.user_id::text = v_actor
    and v.is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'El nombre debe tener al menos 2 caracteres');
  end if;

  update public.products
  set name = trim(p_name),
      description = p_description,
      image_url = p_image_url,
      is_visible = p_is_visible
  where id = p_product_id;

  insert into public.product_logs(action, row_id, actor, reason)
  values ('UPDATE', p_product_id, v_actor, 'product_update');

  return jsonb_build_object('ok', true, 'message', 'Producto actualizado');
end;
$$;

revoke all on function public.product_update(uuid, text, text, text, boolean) from anon, authenticated, public;
grant execute on function public.product_update(uuid, text, text, text, boolean) to authenticated;

-- product_soft_delete(product_id)
-- Marca is_visible = false (oculta el producto, no lo borra).
create or replace function public.product_soft_delete(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
begin
  v_actor := public.current_actor();

  if not exists (
    select 1 from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = p_product_id
      and v.user_id::text = v_actor
      and v.is_active = true
  ) then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  update public.products
  set is_visible = false
  where id = p_product_id;

  insert into public.product_logs(action, row_id, actor, reason)
  values ('UPDATE', p_product_id, v_actor, 'product_soft_delete');

  return jsonb_build_object('ok', true, 'message', 'Producto ocultado');
end;
$$;

revoke all on function public.product_soft_delete(uuid) from anon, authenticated, public;
grant execute on function public.product_soft_delete(uuid) to authenticated;

-- product_hard_delete(product_id)
-- Elimina fisicamente el producto usando app.allow_product_delete.
create or replace function public.product_hard_delete(
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor text;
begin
  v_actor := public.current_actor();

  if not exists (
    select 1 from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = p_product_id
      and v.user_id::text = v_actor
      and v.is_active = true
  ) then
    return jsonb_build_object('ok', false, 'message', 'Producto no encontrado o no autorizado');
  end if;

  perform set_config('app.allow_product_delete', 'on', true);

  delete from public.products
  where id = p_product_id;

  insert into public.product_logs(action, row_id, actor, reason)
  values ('DELETE', p_product_id, v_actor, 'product_hard_delete');

  return jsonb_build_object('ok', true, 'message', 'Producto eliminado definitivamente');
end;
$$;

revoke all on function public.product_hard_delete(uuid) from anon, authenticated, public;
grant execute on function public.product_hard_delete(uuid) to authenticated;

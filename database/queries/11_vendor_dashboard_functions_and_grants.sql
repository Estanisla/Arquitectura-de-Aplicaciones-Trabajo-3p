-- 11) Vendor dashboard functions + grants

create or replace function public.get_my_vendor_profile(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vendor  public.vendors%rowtype;
  v_products jsonb;
begin
  select *
    into v_vendor
  from public.vendors
  where user_id = p_user_id
    and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',          p.id,
        'name',        p.name,
        'description', p.description,
        'image_url',   p.image_url,
        'is_visible',  p.is_visible,
        'created_at',  p.created_at
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
    'data', jsonb_build_object(
      'vendor_id',    v_vendor.id,
      'display_name', v_vendor.display_name,
      'description',  v_vendor.description,
      'is_active',    v_vendor.is_active,
      'products',     v_products
    )
  );
end;
$$;

revoke all on function public.get_my_vendor_profile(uuid) from anon, authenticated;
grant execute on function public.get_my_vendor_profile(uuid) to authenticated;

-- vendor_update_profile(vendor_id, display_name, description)
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
  v_actor text;
begin
  v_actor := public.current_actor();

  if not exists (
    select 1 from public.vendors
    where id = p_vendor_id
      and user_id::text = v_actor
      and is_active = true
  ) then
    return jsonb_build_object('ok', false, 'message', 'Tienda no encontrada o no autorizada');
  end if;

  if p_display_name is null or length(trim(p_display_name)) < 2 then
    return jsonb_build_object('ok', false, 'message', 'display_name debe tener al menos 2 caracteres');
  end if;

  update public.vendors
  set display_name = trim(p_display_name),
      description = p_description
  where id = p_vendor_id;

  insert into public.vendor_logs(action, row_id, actor, reason)
  values ('UPDATE', p_vendor_id, v_actor, 'vendor_update_profile');

  return jsonb_build_object('ok', true, 'message', 'Perfil actualizado correctamente');
end;
$$;

revoke all on function public.vendor_update_profile(uuid, text, text) from anon, authenticated;
grant execute on function public.vendor_update_profile(uuid, text, text) to authenticated;

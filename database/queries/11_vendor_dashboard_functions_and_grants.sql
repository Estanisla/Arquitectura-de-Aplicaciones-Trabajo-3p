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

-- 14) Admin hard delete for users (wrap user_hard_delete with admin auth)

-- admin_hard_delete_user(admin_id, user_id, reason)
-- Verifies the caller is an active admin before allowing the destructive
-- action. user_hard_delete grants remain broad, but this endpoint is
-- the surface a client should call.
create or replace function public.admin_hard_delete_user(
  p_admin_id uuid,
  p_user_id uuid,
  p_reason text default 'admin hard delete'
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

  if p_user_id is null then
    return jsonb_build_object('ok', false, 'message', 'user_id requerido');
  end if;

  -- Enable DELETE only inside this transaction (same guard as user_hard_delete).
  perform set_config('app.allow_user_delete', 'on', true);

  delete from public.users where id = p_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  insert into public.user_logs(action, row_id, actor, reason)
  values (
    'HARD_DELETE',
    p_user_id,
    public.current_actor(),
    coalesce(p_reason, 'admin hard delete') || ' by admin ' || p_admin_id::text
  );

  return jsonb_build_object('ok', true, 'message', 'Usuario eliminado (hard)');
end;
$$;

revoke all on function public.admin_hard_delete_user(uuid, uuid, text) from anon, authenticated;
grant execute on function public.admin_hard_delete_user(uuid, uuid, text) to authenticated;

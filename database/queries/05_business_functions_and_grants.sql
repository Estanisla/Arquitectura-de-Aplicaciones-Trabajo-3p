-- 05) Business functions + grants for RPC

-- user_create(username, password)
create or replace function public.user_create(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    raise exception 'username requerido';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'password minimo 6 caracteres';
  end if;

  insert into public.users(username, password_hash)
  values (
    trim(p_username),
    crypt(p_password, gen_salt('bf'))
  )
  returning id into v_user_id;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('CREATE', v_user_id, public.current_actor(), 'user_create function');

  return jsonb_build_object(
    'ok', true,
    'message', 'Usuario creado',
    'user_id', v_user_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'Username ya existe');
end;
$$;

-- user_login(username, password)
create or replace function public.user_login(
  p_username text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
begin
  select *
    into v_user
  from public.users
  where username = trim(p_username)
    and is_deleted = false
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  if crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('LOGIN', v_user.id, public.current_actor(), 'Login correcto');

  return jsonb_build_object(
    'ok', true,
    'message', 'Login correcto',
    'user_id', v_user.id
  );
end;
$$;

-- user_soft_delete(user_id, reason)
create or replace function public.user_soft_delete(
  p_user_id uuid,
  p_reason text default 'soft delete'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set is_deleted = true,
      deleted_at = now()
  where id = p_user_id
    and is_deleted = false;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado o ya eliminado');
  end if;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('SOFT_DELETE', p_user_id, public.current_actor(), coalesce(p_reason, 'soft delete'));

  return jsonb_build_object('ok', true, 'message', 'Usuario eliminado (soft)');
end;
$$;

-- user_hard_delete(user_id, reason)
create or replace function public.user_hard_delete(
  p_user_id uuid,
  p_reason text default 'hard delete'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enable DELETE only inside this transaction.
  perform set_config('app.allow_user_delete', 'on', true);

  delete from public.users
  where id = p_user_id;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('HARD_DELETE', p_user_id, public.current_actor(), coalesce(p_reason, 'hard delete'));

  return jsonb_build_object('ok', true, 'message', 'Usuario eliminado (hard)');
end;
$$;

-- Block direct table access from client roles
revoke all on table public.users from anon, authenticated;
revoke all on table public.user_logs from anon, authenticated;

-- Allow RPC execution only
grant execute on function public.user_create(text, text) to anon, authenticated;
grant execute on function public.user_login(text, text) to anon, authenticated;
grant execute on function public.user_soft_delete(uuid, text) to authenticated;
grant execute on function public.user_hard_delete(uuid, text) to authenticated;

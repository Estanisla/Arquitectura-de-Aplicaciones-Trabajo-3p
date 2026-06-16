-- 09) must_change_password: columna y funciones de cambio de contrasena

alter table public.users
  add column if not exists must_change_password boolean not null default false;

-- user_change_password(user_id, current_password, new_password)
-- El vendedor llama esta funcion con su user_id de sesion.
-- Si must_change_password = true, current_password es la temporal y se acepta igual.
create or replace function public.user_change_password(
  p_user_id uuid,
  p_current_password text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
begin
  if p_user_id is null then
    raise exception 'user_id requerido';
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    return jsonb_build_object('ok', false, 'message', 'La nueva contrasena debe tener al menos 6 caracteres');
  end if;

  if p_current_password = p_new_password then
    return jsonb_build_object('ok', false, 'message', 'La nueva contrasena no puede ser igual a la actual');
  end if;

  select *
    into v_user
  from public.users
  where id = p_user_id
    and is_deleted = false
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', 'Usuario no encontrado');
  end if;

  if extensions.crypt(p_current_password, v_user.password_hash) <> v_user.password_hash then
    return jsonb_build_object('ok', false, 'message', 'Contrasena actual incorrecta');
  end if;

  update public.users
  set
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    must_change_password = false,
    updated_at = now()
  where id = p_user_id;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('UPDATE', p_user_id, public.current_actor(), 'user_change_password: contrasena actualizada');

  return jsonb_build_object('ok', true, 'message', 'Contrasena actualizada correctamente');
end;
$$;

revoke all on function public.user_change_password(uuid, text, text) from anon, authenticated;
grant execute on function public.user_change_password(uuid, text, text) to authenticated;

-- user_login_v2: igual que user_login pero incluye must_change_password en la respuesta.
-- El backend debe llamar user_login_v2 en lugar de user_login a partir de ahora.
create or replace function public.user_login_v2(
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

  if extensions.crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    return jsonb_build_object('ok', false, 'message', 'Credenciales invalidas');
  end if;

  insert into public.user_logs(action, row_id, actor, reason)
  values ('LOGIN', v_user.id, public.current_actor(), 'Login correcto via user_login_v2');

  return jsonb_build_object(
    'ok', true,
    'message', 'Login correcto',
    'user_id', v_user.id,
    'must_change_password', v_user.must_change_password
  );
end;
$$;

revoke all on function public.user_login_v2(text, text) from anon, authenticated;
grant execute on function public.user_login_v2(text, text) to anon, authenticated;

-- 15) Password reset flow for vendor users

create table if not exists public.user_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_password_resets_user_id_used_at
  on public.user_password_resets(user_id, used_at);

create index if not exists idx_user_password_resets_expires_at
  on public.user_password_resets(expires_at);

-- Request password reset by username.
-- Always returns ok=true to avoid username enumeration; the token
-- field is only populated when the user actually exists. Real
-- deployments should stop returning the token in the response and
-- send it via email/SMS instead — the DB function keeps the surface
-- explicit so the swap is local.
create or replace function public.user_password_reset_request(
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_token text;
  v_expires_at timestamptz;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    return jsonb_build_object(
      'ok', true,
      'message', 'Si el usuario existe, se enviaron instrucciones'
    );
  end if;

  select id into v_user_id
  from public.users
  where username = trim(p_username)
    and is_deleted = false
  limit 1;

  if v_user_id is null then
    return jsonb_build_object(
      'ok', true,
      'message', 'Si el usuario existe, se enviaron instrucciones'
    );
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '')
    || replace(gen_random_uuid()::text, '-', '');
  v_expires_at := now() + interval '15 minutes';

  insert into public.user_password_resets(user_id, token_hash, expires_at)
  values (
    v_user_id,
    extensions.crypt(v_token, extensions.gen_salt('bf')),
    v_expires_at
  );

  insert into public.user_logs(action, row_id, actor, reason)
  values (
    'PASSWORD_RESET_REQUEST',
    v_user_id,
    public.current_actor(),
    'reset token issued'
  );

  return jsonb_build_object(
    'ok', true,
    'message', 'Si el usuario existe, se enviaron instrucciones',
    'token', v_token,
    'expires_at', v_expires_at
  );
end;
$$;

-- Complete password reset given a plaintext token and a new password.
-- The token hash comparison happens over the small window of unused,
-- non-expired rows.
create or replace function public.user_password_reset_complete(
  p_token text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reset_row public.user_password_resets%rowtype;
  v_user_id uuid;
begin
  if p_token is null or length(p_token) < 32 then
    return jsonb_build_object('ok', false, 'message', 'Token invalido');
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    return jsonb_build_object(
      'ok', false,
      'message', 'password minimo 6 caracteres'
    );
  end if;

  for v_reset_row in
    select *
    from public.user_password_resets
    where used_at is null
      and expires_at > now()
    order by created_at desc
    limit 100
  loop
    if extensions.crypt(p_token, v_reset_row.token_hash) = v_reset_row.token_hash then
      v_user_id := v_reset_row.user_id;

      update public.users
      set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
          must_change_password = false
      where id = v_user_id;

      update public.user_password_resets
      set used_at = now()
      where id = v_reset_row.id;

      insert into public.user_logs(action, row_id, actor, reason)
      values (
        'PASSWORD_RESET_COMPLETE',
        v_user_id,
        public.current_actor(),
        'password reset via token'
      );

      return jsonb_build_object('ok', true, 'message', 'Contrasena actualizada');
    end if;
  end loop;

  return jsonb_build_object('ok', false, 'message', 'Token invalido o expirado');
end;
$$;

revoke all on table public.user_password_resets from anon, authenticated;
grant execute on function public.user_password_reset_request(text) to anon, authenticated;
grant execute on function public.user_password_reset_complete(text, text) to anon, authenticated;

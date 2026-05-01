-- 04) Safety guards: block direct DELETE and TRUNCATE
create or replace function public.block_direct_user_delete()
returns trigger
language plpgsql
as $$
begin
  -- Allow DELETE only when user_hard_delete enables it in transaction.
  if current_setting('app.allow_user_delete', true) is distinct from 'on' then
    raise exception 'DELETE directo sobre users bloqueado. Usa la funcion user_hard_delete.';
  end if;
  return null;
end;
$$;

drop trigger if exists trg_block_direct_delete on public.users;
create trigger trg_block_direct_delete
before delete on public.users
for each statement
execute function public.block_direct_user_delete();

create or replace function public.block_users_truncate()
returns trigger
language plpgsql
as $$
begin
  raise exception 'TRUNCATE sobre users bloqueado.';
end;
$$;

drop trigger if exists trg_block_users_truncate on public.users;
create trigger trg_block_users_truncate
before truncate on public.users
for each statement
execute function public.block_users_truncate();

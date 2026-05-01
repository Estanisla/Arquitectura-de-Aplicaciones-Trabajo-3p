-- 02) Helpers and updated_at trigger
create or replace function public.current_actor()
returns text
language sql
stable
as $$
  select coalesce(
    current_setting('request.jwt.claim.sub', true),
    current_user::text
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

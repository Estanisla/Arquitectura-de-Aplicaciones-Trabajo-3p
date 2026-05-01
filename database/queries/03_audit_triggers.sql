-- 03) Audit trigger on users
create or replace function public.log_users_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.user_logs(action, row_id, actor, after_data)
    values ('INSERT', new.id, public.current_actor(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.user_logs(action, row_id, actor, before_data, after_data)
    values ('UPDATE', new.id, public.current_actor(), to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.user_logs(action, row_id, actor, before_data)
    values ('DELETE', old.id, public.current_actor(), to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_users_audit on public.users;
create trigger trg_users_audit
after insert or update or delete on public.users
for each row
execute function public.log_users_changes();

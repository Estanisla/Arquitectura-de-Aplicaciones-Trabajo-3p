-- 13) Admin audit log viewer functions + grants

-- admin_list_audit_logs(admin_id, table_filter, limit, offset)
-- Returns unified rows from admin_logs, user_logs, and vendor_logs.
-- Filter: NULL returns all sources; otherwise pass one of
-- 'admins' | 'users' | 'vendors' (matches table_name column).
create or replace function public.admin_list_audit_logs(
  p_admin_id uuid,
  p_table text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_data jsonb;
  v_limit int := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if not exists (
    select 1 from public.admins where id = p_admin_id and is_deleted = false
  ) then
    return jsonb_build_object('ok', false, 'message', 'Admin no autorizado');
  end if;

  select coalesce(jsonb_agg(row_data), '[]'::jsonb)
    into v_data
  from (
    select jsonb_build_object(
      'source', source,
      'event_time', event_time,
      'action', action,
      'table_name', table_name,
      'row_id', row_id,
      'actor', actor,
      'reason', reason
    ) as row_data
    from (
      select 'admins'::text  as source, event_time, action, table_name, row_id::text, actor, reason from public.admin_logs
      union all
      select 'users'::text,               event_time, action, table_name, row_id::text, actor, reason from public.user_logs
      union all
      select 'vendors'::text,             event_time, action, table_name, row_id::text, actor, reason from public.vendor_logs
    ) unified
    where p_table is null or unified.source = p_table
    order by event_time desc
    limit v_limit
    offset v_offset
  ) sub;

  return jsonb_build_object('ok', true, 'data', v_data);
end;
$$;

revoke all on function public.admin_list_audit_logs(uuid, text, int, int) from anon, authenticated;
grant execute on function public.admin_list_audit_logs(uuid, text, int, int) to authenticated;

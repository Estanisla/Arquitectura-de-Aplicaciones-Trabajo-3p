-- 15) Remove PostgreSQL's default PUBLIC execution from store RPCs.
-- Migration 13/14 are also corrected for fresh environments. This migration
-- closes the default privilege in projects where those migrations already ran.

revoke all on function public.admin_create_store_with_members(
  uuid, text, text, text, jsonb, jsonb
) from public;
revoke all on function public.admin_list_stores_with_members(uuid) from public;
revoke all on function public.vendor_list_managed_stores(uuid) from public;
revoke all on function public.get_vendor_contacts(uuid) from public;
revoke all on function public.get_vendor_profile(uuid) from public;
revoke all on function public._assert_vendor_ownership(uuid, text) from public;
revoke all on function public.get_my_vendor_profile(uuid) from public;
revoke all on function public.vendor_update_profile(uuid, text, text) from public;
revoke all on function public.product_update(
  uuid, text, text, text, boolean
) from public;
revoke all on function public.product_soft_delete(uuid) from public;
revoke all on function public.product_hard_delete(uuid) from public;

revoke all on function public._get_store_member_role(uuid, uuid) from public;
revoke all on function public._admin_owns_store(uuid, uuid) from public;
revoke all on function public._replace_store_contacts(uuid, jsonb) from public;
revoke all on function public.vendor_get_managed_stores(uuid) from public;
revoke all on function public.vendor_get_store_dashboard(uuid, uuid) from public;
revoke all on function public.vendor_update_store_profile(
  uuid, uuid, text, text
) from public;
revoke all on function public.vendor_update_store_contacts(
  uuid, uuid, jsonb
) from public;
revoke all on function public.vendor_create_product(
  uuid, uuid, text, text, text
) from public;
revoke all on function public.vendor_update_product(
  uuid, uuid, text, text, text, boolean
) from public;
revoke all on function public.vendor_remove_product(uuid, uuid) from public;
revoke all on function public.admin_add_store_member(
  uuid, uuid, text, text
) from public;
revoke all on function public.admin_set_store_member_active(
  uuid, uuid, text, boolean
) from public;
revoke all on function public.admin_update_store_contacts(
  uuid, uuid, jsonb
) from public;

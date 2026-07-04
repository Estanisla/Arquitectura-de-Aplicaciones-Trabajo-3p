export interface VendorRow {
  user_id: string;
  username: string;
  display_name: string;
  vendor_id: string;
  is_active: boolean;
  is_deleted: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface CreateVendorInput {
  username: string;
  tempPassword: string;
  displayName: string;
  description?: string;
}

export type AuditLogSource = "admins" | "users" | "vendors";

export interface AuditLogEntry {
  source: AuditLogSource;
  event_time: string;
  action: string;
  table_name: string;
  row_id: string | null;
  actor: string | null;
  reason: string | null;
}

export interface ListAuditLogsInput {
  table?: AuditLogSource;
  limit?: number;
  offset?: number;
}

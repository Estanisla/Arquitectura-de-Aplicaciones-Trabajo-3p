import { supabaseAdmin } from "../../lib/supabaseClient.js";
import type {
  AuditLogEntry,
  AuditLogSource,
  CreateVendorInput,
  VendorRow,
} from "./admin-panel.types.js";

type RpcResult = {
  ok: boolean;
  message?: string;
  user_id?: string;
  vendor_id?: string;
};

type ListVendorsRpcResponse = {
  ok: boolean;
  data: VendorRow[];
  message?: string;
};

type ListAuditLogsRpcResponse = {
  ok: boolean;
  data: AuditLogEntry[];
  message?: string;
};

export const adminPanelRepository = {
  async createVendor(
    adminId: string,
    input: CreateVendorInput,
  ): Promise<RpcResult> {
    const { data, error } = await supabaseAdmin.rpc("admin_create_vendor", {
      p_admin_id: adminId,
      p_username: input.username,
      p_temp_password: input.tempPassword,
      p_display_name: input.displayName,
      p_description: input.description ?? null,
    });

    if (error) {
      throw new Error(`Supabase RPC admin_create_vendor failed: ${error.message}`);
    }

    return data as RpcResult;
  },

  async listVendors(adminId: string): Promise<VendorRow[]> {
    const { data, error } = await supabaseAdmin.rpc("admin_list_vendors", {
      p_admin_id: adminId,
    });

    if (error) {
      throw new Error(`Supabase RPC admin_list_vendors failed: ${error.message}`);
    }

    const result = data as ListVendorsRpcResponse | null;

    if (!result?.ok) {
      throw new Error(result?.message ?? "Error al listar vendedores");
    }

    return result.data;
  },

  async deactivateVendor(
    adminId: string,
    vendorId: string,
  ): Promise<RpcResult> {
    const { data, error } = await supabaseAdmin.rpc("admin_deactivate_vendor", {
      p_admin_id: adminId,
      p_vendor_id: vendorId,
    });

    if (error) {
      throw new Error(`Supabase RPC admin_deactivate_vendor failed: ${error.message}`);
    }

    return data as RpcResult;
  },

  async listAuditLogs(
    adminId: string,
    table: AuditLogSource | null,
    limit: number,
    offset: number,
  ): Promise<AuditLogEntry[]> {
    const { data, error } = await supabaseAdmin.rpc("admin_list_audit_logs", {
      p_admin_id: adminId,
      p_table: table,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(`Supabase RPC admin_list_audit_logs failed: ${error.message}`);
    }

    const result = data as ListAuditLogsRpcResponse | null;

    if (!result?.ok) {
      throw new Error(result?.message ?? "Error al listar logs de auditoria");
    }

    return result.data;
  },
};

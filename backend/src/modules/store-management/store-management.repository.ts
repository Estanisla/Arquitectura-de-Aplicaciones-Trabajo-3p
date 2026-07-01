import { supabaseAdmin } from "../../lib/supabaseClient.js";
import type {
  CreateManagedStoreInput,
  CreateManagedStoreResult,
  ManagedStoreCollection,
  StoreManagementDataSource,
} from "./store-management.types.js";

type ListStoresRpcResult = {
  ok: boolean;
  message?: string;
  data?: ManagedStoreCollection;
};

export const storeManagementRepository: StoreManagementDataSource = {
  async createStore(
    adminId: string,
    input: CreateManagedStoreInput,
  ): Promise<CreateManagedStoreResult> {
    const { data, error } = await supabaseAdmin.rpc(
      "admin_create_store_with_members",
      {
        p_admin_id: adminId,
        p_emporium_name: input.emporiumName,
        p_store_name: input.displayName,
        p_description: input.description ?? null,
        p_members: input.members.map((member) => ({
          username: member.username,
          temp_password: member.tempPassword,
          role: member.role,
        })),
        p_contacts: input.contacts,
      },
    );

    if (error) {
      throw new Error("No se pudo crear la tienda");
    }

    return data as CreateManagedStoreResult;
  },

  async listStores(adminId: string): Promise<ManagedStoreCollection> {
    const { data, error } = await supabaseAdmin.rpc(
      "admin_list_stores_with_members",
      { p_admin_id: adminId },
    );

    if (error) {
      throw new Error("No se pudieron obtener las tiendas");
    }

    const result = data as ListStoresRpcResult | null;
    if (!result?.ok || !result.data) {
      throw new Error("No se pudieron obtener las tiendas");
    }

    return result.data;
  },

  async addMember(adminId, storeId, member): Promise<boolean> {
    const { data, error } = await supabaseAdmin.rpc("admin_add_store_member", {
      p_admin_id: adminId,
      p_vendor_id: storeId,
      p_username: member.username,
      p_temp_password: member.tempPassword,
    });
    if (error) throw new Error("No se pudo agregar el usuario");
    return Boolean((data as { ok?: boolean } | null)?.ok);
  },

  async setMemberActive(
    adminId,
    storeId,
    username,
    isActive,
  ): Promise<boolean> {
    const { data, error } = await supabaseAdmin.rpc(
      "admin_set_store_member_active",
      {
        p_admin_id: adminId,
        p_vendor_id: storeId,
        p_username: username,
        p_is_active: isActive,
      },
    );
    if (error) throw new Error("No se pudo actualizar el usuario");
    return Boolean((data as { ok?: boolean } | null)?.ok);
  },

  async updateContacts(adminId, storeId, contacts): Promise<boolean> {
    const { data, error } = await supabaseAdmin.rpc(
      "admin_update_store_contacts",
      {
        p_admin_id: adminId,
        p_vendor_id: storeId,
        p_contacts: contacts,
      },
    );
    if (error) throw new Error("No se pudieron actualizar los contactos");
    return Boolean((data as { ok?: boolean } | null)?.ok);
  },
};

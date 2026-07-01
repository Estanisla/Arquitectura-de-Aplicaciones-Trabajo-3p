import { supabaseAdmin } from "../../lib/supabaseClient.js";
import type {
  ManagedStoreSummary,
  MyVendorProfile,
  ProductInput,
  StoreContact,
  UpdateStoreProfileInput,
  VendorDashboardDataSource,
} from "./vendor-dashboard.types.js";

type RpcResult<T = undefined> = {
  ok: boolean;
  data?: T;
  message?: string;
  product_id?: string;
};

const runRpc = async <T>(
  name: string,
  params: Record<string, unknown>,
): Promise<RpcResult<T>> => {
  const { data, error } = await supabaseAdmin.rpc(name, params);
  if (error) {
    throw new Error("No se pudo completar la operacion de tienda");
  }
  return data as RpcResult<T>;
};

export const vendorDashboardRepository: VendorDashboardDataSource = {
  async listManagedStores(userId: string): Promise<ManagedStoreSummary[]> {
    const result = await runRpc<ManagedStoreSummary[]>(
      "vendor_get_managed_stores",
      { p_user_id: userId },
    );
    return result.ok && Array.isArray(result.data) ? result.data : [];
  },

  async getStoreDashboard(
    userId: string,
    storeId: string,
  ): Promise<MyVendorProfile | null> {
    const result = await runRpc<MyVendorProfile>(
      "vendor_get_store_dashboard",
      { p_user_id: userId, p_vendor_id: storeId },
    );
    return result.ok && result.data ? result.data : null;
  },

  async updateStoreProfile(
    userId: string,
    storeId: string,
    input: UpdateStoreProfileInput,
  ): Promise<boolean> {
    const result = await runRpc("vendor_update_store_profile", {
      p_user_id: userId,
      p_vendor_id: storeId,
      p_display_name: input.displayName,
      p_description: input.description ?? null,
    });
    return result.ok;
  },

  async updateStoreContacts(
    userId: string,
    storeId: string,
    contacts: StoreContact[],
  ): Promise<boolean> {
    const result = await runRpc("vendor_update_store_contacts", {
      p_user_id: userId,
      p_vendor_id: storeId,
      p_contacts: contacts,
    });
    return result.ok;
  },

  async createProduct(
    userId: string,
    storeId: string,
    input: ProductInput,
  ): Promise<string | null> {
    const result = await runRpc("vendor_create_product", {
      p_user_id: userId,
      p_vendor_id: storeId,
      p_name: input.name,
      p_description: input.description ?? null,
      p_image_url: input.imageUrl ?? null,
    });
    return result.ok && result.product_id ? result.product_id : null;
  },

  async updateProduct(
    userId: string,
    productId: string,
    input: ProductInput,
  ): Promise<boolean> {
    const result = await runRpc("vendor_update_product", {
      p_user_id: userId,
      p_product_id: productId,
      p_name: input.name,
      p_description: input.description ?? null,
      p_image_url: input.imageUrl ?? null,
      p_is_visible: input.isVisible ?? true,
    });
    return result.ok;
  },

  async removeProduct(userId: string, productId: string): Promise<boolean> {
    const result = await runRpc("vendor_remove_product", {
      p_user_id: userId,
      p_product_id: productId,
    });
    return result.ok;
  },
};

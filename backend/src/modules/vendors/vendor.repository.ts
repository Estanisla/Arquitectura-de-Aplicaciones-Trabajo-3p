import { supabase } from "../../lib/supabaseClient.js";
import type { VendorListItem, VendorProfile } from "./vendor.types.js";

type VendorListRpcResponse = {
  ok: boolean;
  data: VendorListItem[];
  message?: string;
};

type VendorProfileRpcResponse = {
  ok: boolean;
  data: VendorProfile;
  message?: string;
};

export const vendorRepository = {
  async getVendorList(previewLimit: number): Promise<VendorListItem[]> {
    const { data, error } = await supabase.rpc("get_vendor_list_with_products", {
      p_preview_limit: previewLimit,
    });

    if (error) {
      throw new Error("Error al obtener lista de vendedores");
    }

    const result = data as VendorListRpcResponse | null;

    if (!result?.ok) {
      throw new Error(result?.message ?? "Error al obtener lista de vendedores");
    }

    return result.data;
  },

  async getVendorProfile(vendorId: string): Promise<VendorProfile | null> {
    const { data, error } = await supabase.rpc("get_vendor_profile", {
      p_vendor_id: vendorId,
    });

    if (error) {
      throw new Error("Error al obtener perfil del vendedor");
    }

    const result = data as VendorProfileRpcResponse | null;

    if (!result?.ok) {
      return null;
    }

    return result.data;
  },
};

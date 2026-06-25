import { supabase } from "../../lib/supabaseClient.js";
import type { MyVendorProfile } from "./vendor-dashboard.types.js";

type MyVendorProfileRpcResponse = {
  ok: boolean;
  data: MyVendorProfile;
  message?: string;
};

export const vendorDashboardRepository = {
  async getMyVendorProfile(userId: string): Promise<MyVendorProfile | null> {
    const { data, error } = await supabase.rpc("get_my_vendor_profile", {
      p_user_id: userId,
    });

    if (error) {
      throw new Error("Error al obtener perfil del vendedor");
    }

    const result = data as MyVendorProfileRpcResponse | null;

    if (!result?.ok) {
      return null;
    }

    return result.data;
  },
};

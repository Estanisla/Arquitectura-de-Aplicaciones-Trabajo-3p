import { supabase } from "../../lib/supabaseClient.js";
import type { LoginRequest, LoginResult } from "./auth.types.js";

export const authRepository = {
  async loginWithRpc(payload: LoginRequest): Promise<LoginResult> {
    const { data, error } = await supabase.rpc("user_login", {
      p_username: payload.username,
      p_password: payload.password,
    });

    if (error) {
      throw new Error(`Supabase RPC user_login failed: ${error.message}`);
    }

    return data as LoginResult;
  },
};

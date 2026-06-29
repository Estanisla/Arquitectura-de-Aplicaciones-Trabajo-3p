import { supabase, supabaseAdmin } from "../../lib/supabaseClient.js";
import type {
  AuthRequest,
  AuthResult,
  ChangePasswordResult,
  LoginRequest,
  LoginResult,
  LoginResultV2,
  RegisterRequest,
  RegisterResult,
} from "./auth.types.js";

const runAuthRpc = async (
  functionName: "user_login" | "user_create" | "admin_login",
  payload: AuthRequest,
): Promise<AuthResult> => {
  const { data, error } = await supabase.rpc(functionName, {
    p_username: payload.username,
    p_password: payload.password,
  });

  if (error) {
    throw new Error(`Supabase RPC ${functionName} failed: ${error.message}`);
  }

  return data as AuthResult;
};

export const authRepository = {
  async loginWithRpc(payload: LoginRequest): Promise<LoginResult> {
    return (await runAuthRpc("user_login", payload)) as LoginResult;
  },

  async loginWithRpcV2(payload: LoginRequest): Promise<LoginResultV2> {
    const { data, error } = await supabase.rpc("user_login_v2", {
      p_username: payload.username,
      p_password: payload.password,
    });

    if (error) {
      throw new Error(`Supabase RPC user_login_v2 failed: ${error.message}`);
    }

    return data as LoginResultV2;
  },

  async adminLoginWithRpc(payload: LoginRequest): Promise<AuthResult> {
    return (await runAuthRpc("admin_login", payload)) as AuthResult;
  },

  async registerWithRpc(payload: RegisterRequest): Promise<RegisterResult> {
    return (await runAuthRpc("user_create", payload)) as RegisterResult;
  },

  async changePasswordWithRpc(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ChangePasswordResult> {
    const { data, error } = await supabaseAdmin.rpc("user_change_password", {
      p_user_id: userId,
      p_current_password: currentPassword,
      p_new_password: newPassword,
    });

    if (error) {
      throw new Error(`Supabase RPC user_change_password failed: ${error.message}`);
    }

    return data as ChangePasswordResult;
  },
};

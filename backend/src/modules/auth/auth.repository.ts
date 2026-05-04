import { supabase } from "../../lib/supabaseClient.js";
import type {
  AuthRequest,
  AuthResult,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  RegisterResult,
} from "./auth.types.js";

const runAuthRpc = async (
  functionName: "user_login" | "user_create",
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

  async registerWithRpc(payload: RegisterRequest): Promise<RegisterResult> {
    return (await runAuthRpc("user_create", payload)) as RegisterResult;
  },
};

import { supabase } from "../../lib/supabaseClient.js";
const runAuthRpc = async (functionName, payload) => {
    const { data, error } = await supabase.rpc(functionName, {
        p_username: payload.username,
        p_password: payload.password,
    });
    if (error) {
        throw new Error(`Supabase RPC ${functionName} failed: ${error.message}`);
    }
    return data;
};
export const authRepository = {
    async loginWithRpc(payload) {
        return (await runAuthRpc("user_login", payload));
    },
    async registerWithRpc(payload) {
        return (await runAuthRpc("user_create", payload));
    },
};
//# sourceMappingURL=auth.repository.js.map
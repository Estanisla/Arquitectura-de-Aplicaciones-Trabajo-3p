import { supabase } from "../../lib/supabaseClient.js";
export const authRepository = {
    async loginWithRpc(payload) {
        const { data, error } = await supabase.rpc("user_login", {
            p_username: payload.username,
            p_password: payload.password,
        });
        if (error) {
            throw new Error(`Supabase RPC user_login failed: ${error.message}`);
        }
        return data;
    },
};
//# sourceMappingURL=auth.repository.js.map
import { authRepository } from "./auth.repository.js";
const normalize = (input) => input.trim();
export const authService = {
    async login(payload) {
        const username = normalize(payload.username);
        const password = payload.password;
        if (!username) {
            return { ok: false, message: "username requerido" };
        }
        if (!password || password.length < 6) {
            return { ok: false, message: "password minimo 6 caracteres" };
        }
        return authRepository.loginWithRpc({ username, password });
    },
};
//# sourceMappingURL=auth.service.js.map
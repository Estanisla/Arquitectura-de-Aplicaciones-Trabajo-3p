import { authRepository } from "./auth.repository.js";
const normalize = (input) => input.trim();
const validateCredentials = (payload) => {
    const username = normalize(payload.username);
    const password = payload.password;
    if (!username) {
        return { ok: false, message: "username requerido" };
    }
    if (!password || password.length < 6) {
        return { ok: false, message: "password minimo 6 caracteres" };
    }
    return null;
};
export const authService = {
    async login(payload) {
        const username = normalize(payload.username);
        const password = payload.password;
        const validationError = validateCredentials(payload);
        if (validationError) {
            return validationError;
        }
        return authRepository.loginWithRpc({ username, password });
    },
    async register(payload) {
        const username = normalize(payload.username);
        const password = payload.password;
        const validationError = validateCredentials(payload);
        if (validationError) {
            return validationError;
        }
        return authRepository.registerWithRpc({ username, password });
    },
};
//# sourceMappingURL=auth.service.js.map
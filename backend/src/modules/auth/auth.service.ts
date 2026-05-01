import { authRepository } from "./auth.repository.js";
import type { LoginRequest, LoginResult } from "./auth.types.js";

const normalize = (input: string): string => input.trim();

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResult> {
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

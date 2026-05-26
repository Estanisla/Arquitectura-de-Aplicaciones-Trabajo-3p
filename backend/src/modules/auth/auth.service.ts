import { authRepository } from "./auth.repository.js";
import type {
  AuthRequest,
  AuthResult,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  RegisterResult,
} from "./auth.types.js";

const normalize = (input: string): string => input.trim();

const validateCredentials = (payload: AuthRequest): AuthResult | null => {
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
  async login(payload: LoginRequest): Promise<LoginResult> {
    const username = normalize(payload.username);
    const password = payload.password;

    const validationError = validateCredentials(payload);
    if (validationError) {
      return validationError;
    }

    return authRepository.loginWithRpc({ username, password });
  },

  async adminLogin(payload: LoginRequest): Promise<AuthResult> {
    const username = normalize(payload.username);
    const password = payload.password;

    // Stricter minimum for admins matches SQL (>= 10).
    if (!username) {
      return { ok: false, message: "username requerido" };
    }

    if (!password || password.length < 10) {
      return { ok: false, message: "password minimo 10 caracteres" };
    }

    return authRepository.adminLoginWithRpc({ username, password });
  },

  async register(payload: RegisterRequest): Promise<RegisterResult> {
    const username = normalize(payload.username);
    const password = payload.password;

    const validationError = validateCredentials(payload);
    if (validationError) {
      return validationError;
    }

    return authRepository.registerWithRpc({ username, password });
  },
};

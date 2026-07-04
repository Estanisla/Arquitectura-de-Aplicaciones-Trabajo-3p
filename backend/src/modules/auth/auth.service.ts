import { AppError } from "../../shared/AppError.js";
import { authRepository } from "./auth.repository.js";
import type {
  AuthRequest,
  AuthResult,
  LoginRequest,
  LoginResult,
  LoginResultV2,
  RegisterRequest,
  RegisterResult,
} from "./auth.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
  async login(payload: LoginRequest): Promise<LoginResultV2> {
    const username = normalize(payload.username);
    const password = payload.password;

    const validationError = validateCredentials(payload);
    if (validationError) {
      return validationError;
    }

    return authRepository.loginWithRpcV2({ username, password });
  },

  async adminLogin(payload: LoginRequest): Promise<AuthResult> {
    const username = normalize(payload.username);
    const password = payload.password;

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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (!UUID_REGEX.test(userId)) {
      throw new AppError("ID de usuario invalido", 400);
    }

    if (!currentPassword || !newPassword) {
      throw new AppError("Todos los campos son requeridos", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError(
        "La nueva contrasena no puede ser igual a la actual",
        400,
      );
    }

    if (newPassword.length < 6) {
      throw new AppError(
        "La nueva contrasena debe tener al menos 6 caracteres",
        400,
      );
    }

    const result = await authRepository.changePasswordWithRpc(
      userId,
      currentPassword,
      newPassword,
    );

    if (!result.ok) {
      throw new AppError(result.message, 400);
    }
  },

  async requestPasswordReset(
    username: string,
  ): Promise<{ ok: boolean; message: string; token?: string; expires_at?: string }> {
    return authRepository.requestPasswordReset(normalize(username));
  },

  async completePasswordReset(
    token: string,
    newPassword: string,
  ): Promise<void> {
    if (!token || token.trim().length < 32) {
      throw new AppError("Token invalido", 400);
    }

    if (!newPassword || newPassword.length < 6) {
      throw new AppError("La nueva contrasena debe tener al menos 6 caracteres", 400);
    }

    const result = await authRepository.completePasswordReset(
      token.trim(),
      newPassword,
    );

    if (!result.ok) {
      throw new AppError(result.message, 400);
    }
  },
};

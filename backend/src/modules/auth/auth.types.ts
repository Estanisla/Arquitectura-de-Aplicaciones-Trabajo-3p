export type AuthRole = "vendor" | "admin";

export type AuthRequest = {
  username: string;
  password: string;
};

export type AuthResult = {
  ok: boolean;
  message: string;
  user_id?: string;
  admin_id?: string;
};

export type LoginResultV2 = AuthResult & {
  must_change_password?: boolean;
};

export type SessionResult = {
  ok: boolean;
  authenticated: boolean;
  message: string;
  user_id?: string;
  role?: AuthRole;
};

export type LoginRequest = AuthRequest;
export type RegisterRequest = AuthRequest;

export type LoginResult = AuthResult;
export type RegisterResult = AuthResult;

export type SessionPayload = {
  sub: string;
  role: AuthRole;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResult = {
  ok: boolean;
  message: string;
};

export type AuthRole = "vendor" | "admin";

export type AuthRequest = {
  username: string;
  password: string;
};

export type AuthResult = {
  ok: boolean;
  message: string;
  user_id?: string;
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

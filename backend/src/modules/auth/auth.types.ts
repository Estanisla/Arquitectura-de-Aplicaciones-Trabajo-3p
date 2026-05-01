export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResult = {
  ok: boolean;
  message: string;
  user_id?: string;
};

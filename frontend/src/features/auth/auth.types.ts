export type LoginInput = {
  username: string;
  password: string;
};

export type LoginResponse = {
  ok: boolean;
  message: string;
  user_id?: string;
};

import type { LoginInput, LoginResponse } from "../auth.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const authApi = {
  async login(payload: LoginInput): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as LoginResponse;

    if (!response.ok) {
      return data;
    }

    return data;
  },
};

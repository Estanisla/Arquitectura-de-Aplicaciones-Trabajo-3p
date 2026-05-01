import { useState } from "react";
import type { FormEvent } from "react";
import { authApi } from "../api/authApi";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await authApi.login({ username, password });

    if (!result.ok) {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setMessage(`Login correcto. User ID: ${result.user_id ?? "N/A"}`);
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="card">
      <h1>Login</h1>

      <label htmlFor="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p>{message}</p>
    </form>
  );
}

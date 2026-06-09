import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
process.env.SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vendor_session";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";

const { authService } = await import("./auth.service.ts");
const { authRepository } = await import("./auth.repository.ts");

afterEach(() => {
  mock.restoreAll();
});

test("authService.login trims username before calling repository", async () => {
  const loginMock = mock.method(authRepository, "loginWithRpc", async (payload) => ({
    ok: true,
    message: `login for ${payload.username}`,
    user_id: "vendor-1",
  }));

  const result = await authService.login({
    username: "  alice  ",
    password: "secret1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.user_id, "vendor-1");
  assert.equal(loginMock.mock.calls.length, 1);
  assert.deepEqual(loginMock.mock.calls[0]?.arguments[0], {
    username: "alice",
    password: "secret1",
  });
});

test("authService.login rejects empty username without calling repository", async () => {
  const loginMock = mock.method(authRepository, "loginWithRpc", async () => {
    throw new Error("repository should not be called");
  });

  const result = await authService.login({
    username: "   ",
    password: "secret1",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "username requerido",
  });
  assert.equal(loginMock.mock.calls.length, 0);
});

test("authService.adminLogin enforces the admin password minimum", async () => {
  const adminLoginMock = mock.method(authRepository, "adminLoginWithRpc", async () => {
    throw new Error("repository should not be called");
  });

  const result = await authService.adminLogin({
    username: "admin",
    password: "short123",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "password minimo 10 caracteres",
  });
  assert.equal(adminLoginMock.mock.calls.length, 0);
});

test("authService.register delegates valid payloads to the repository", async () => {
  const registerMock = mock.method(authRepository, "registerWithRpc", async (payload) => ({
    ok: true,
    message: `created ${payload.username}`,
    user_id: "vendor-2",
  }));

  const result = await authService.register({
    username: "  seller  ",
    password: "secret1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.user_id, "vendor-2");
  assert.deepEqual(registerMock.mock.calls[0]?.arguments[0], {
    username: "seller",
    password: "secret1",
  });
});

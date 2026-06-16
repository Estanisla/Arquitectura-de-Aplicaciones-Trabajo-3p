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
  const loginMock = mock.method(authRepository, "loginWithRpcV2", async (payload) => ({
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
  const loginMock = mock.method(authRepository, "loginWithRpcV2", async () => {
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

test("authService.login returns mustChangePassword true when RPC indicates flag active", async () => {
  mock.method(authRepository, "loginWithRpcV2", async () => ({
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
    must_change_password: true,
  }));

  const result = await authService.login({
    username: "alice",
    password: "secret1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.must_change_password, true);
});

test("authService.login returns mustChangePassword false for normal accounts", async () => {
  mock.method(authRepository, "loginWithRpcV2", async () => ({
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
    must_change_password: false,
  }));

  const result = await authService.login({
    username: "bob",
    password: "secret1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.must_change_password, false);
});

test("authService.changePassword rejects if newPassword equals currentPassword", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  await assert.rejects(
    authService.changePassword(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "samepass",
      "samepass",
    ),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "La nueva contrasena no puede ser igual a la actual");
      return true;
    },
  );
});

test("authService.changePassword rejects if newPassword is too short", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  await assert.rejects(
    authService.changePassword(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "oldpass",
      "short",
    ),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "La nueva contrasena debe tener al menos 6 caracteres");
      return true;
    },
  );
});

test("authService.changePassword throws AppError 400 if RPC returns ok false", async () => {
  mock.method(authRepository, "changePasswordWithRpc", async () => ({
    ok: false,
    message: "Contrasena actual incorrecta",
  }));

  const { AppError } = await import("../../shared/AppError.ts");

  await assert.rejects(
    authService.changePassword(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "wrong",
      "newpass123",
    ),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "Contrasena actual incorrecta");
      return true;
    },
  );
});

test("authService.changePassword completes without error if RPC returns ok true", async () => {
  mock.method(authRepository, "changePasswordWithRpc", async () => ({
    ok: true,
    message: "Contrasena actualizada correctamente",
  }));

  await assert.doesNotReject(
    authService.changePassword(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "oldpass",
      "newpass123",
    ),
  );
});

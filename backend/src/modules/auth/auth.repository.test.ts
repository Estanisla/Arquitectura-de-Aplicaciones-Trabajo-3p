import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { authRepository } = await import("./auth.repository.ts");
const { supabase } = await import("../../lib/supabaseClient.ts");

afterEach(() => {
  mock.restoreAll();
});

test("authRepository.loginWithRpc calls the expected Supabase RPC", async () => {
  const rpcMock = mock.method(supabase, "rpc", async (fn, payload) => ({
    data: {
      ok: true,
      message: "Login correcto",
      user_id: "vendor-1",
    },
    error: null,
    fn,
    payload,
  }));

  const result = await authRepository.loginWithRpc({
    username: "alice",
    password: "secret1",
  });

  assert.equal(result.ok, true);
  assert.equal(result.user_id, "vendor-1");
  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "user_login");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], {
    p_username: "alice",
    p_password: "secret1",
  });
});

test("authRepository.registerWithRpc throws a readable error when Supabase fails", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: null,
    error: { message: "duplicate key" },
  }));

  await assert.rejects(
    authRepository.registerWithRpc({
      username: "alice",
      password: "secret1",
    }),
    /Supabase RPC user_create failed: duplicate key/,
  );
});

test("authRepository.adminLoginWithRpc uses the admin RPC", async () => {
  const rpcMock = mock.method(supabase, "rpc", async () => ({
    data: {
      ok: true,
      message: "Admin login correcto",
      admin_id: "admin-1",
    },
    error: null,
  }));

  const result = await authRepository.adminLoginWithRpc({
    username: "root",
    password: "secret1234",
  });

  assert.equal(result.ok, true);
  assert.equal(result.admin_id, "admin-1");
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "admin_login");
});

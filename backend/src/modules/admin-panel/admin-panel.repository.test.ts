import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { adminPanelRepository } = await import("./admin-panel.repository.ts");
const { supabaseAdmin } = await import("../../lib/supabaseClient.ts");

afterEach(() => {
  mock.restoreAll();
});

const adminId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

test("createVendor calls admin_create_vendor with correct params", async () => {
  const rpcMock = mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      message: "Vendedor creado correctamente",
      user_id: "vendor-user-id",
      vendor_id: "vendor-profile-id",
    },
    error: null,
  }));

  const result = await adminPanelRepository.createVendor(adminId, {
    username: "newvendor",
    tempPassword: "temp123456",
    displayName: "Mi Tienda",
    description: "Descripcion",
  });

  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "admin_create_vendor");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], {
    p_admin_id: adminId,
    p_username: "newvendor",
    p_temp_password: "temp123456",
    p_display_name: "Mi Tienda",
    p_description: "Descripcion",
  });
  assert.equal(result.user_id, "vendor-user-id");
  assert.equal(result.vendor_id, "vendor-profile-id");
});

test("createVendor returns ok false on unique violation", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: false,
      message: "El username ya existe",
    },
    error: null,
  }));

  const result = await adminPanelRepository.createVendor(adminId, {
    username: "exists",
    tempPassword: "temp123456",
    displayName: "Ya Existe",
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, "El username ya existe");
});

test("listVendors calls admin_list_vendors with admin id", async () => {
  const rpcMock = mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      data: [],
    },
    error: null,
  }));

  await adminPanelRepository.listVendors(adminId);

  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "admin_list_vendors");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], { p_admin_id: adminId });
});

test("listVendors returns vendor array on success", async () => {
  const vendors = [
    {
      user_id: "user-1",
      username: "vendor1",
      display_name: "Tienda 1",
      vendor_id: "vendor-1",
      is_active: true,
      is_deleted: false,
      must_change_password: true,
      created_at: "2025-01-01T00:00:00Z",
    },
  ];

  mock.method(supabaseAdmin, "rpc", async () => ({
    data: { ok: true, data: vendors },
    error: null,
  }));

  const result = await adminPanelRepository.listVendors(adminId);

  assert.deepEqual(result, vendors);
});

test("deactivateVendor calls admin_deactivate_vendor with correct params", async () => {
  const rpcMock = mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      message: "Tienda desactivada",
    },
    error: null,
  }));

  const result = await adminPanelRepository.deactivateVendor(adminId, "vendor-1");

  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "admin_deactivate_vendor");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], {
    p_admin_id: adminId,
    p_vendor_id: "vendor-1",
  });
  assert.equal(result.ok, true);
});

test("all repository methods throw descriptive error when Supabase fails", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: null,
    error: { message: "connection refused" },
  }));

  await assert.rejects(
    adminPanelRepository.createVendor(adminId, {
      username: "test",
      tempPassword: "temp123456",
      displayName: "Test",
    }),
    /Supabase RPC admin_create_vendor failed: connection refused/,
  );

  await assert.rejects(
    adminPanelRepository.listVendors(adminId),
    /Supabase RPC admin_list_vendors failed: connection refused/,
  );

  await assert.rejects(
    adminPanelRepository.deactivateVendor(adminId, "vendor-1"),
    /Supabase RPC admin_deactivate_vendor failed: connection refused/,
  );
});

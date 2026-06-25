import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorDashboardRepository } = await import("./vendor-dashboard.repository.ts");
const { supabase } = await import("../../lib/supabaseClient.ts");

afterEach(() => {
  mock.restoreAll();
});

const VALID_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

test("getMyVendorProfile calls supabase.rpc with correct params", async () => {
  const rpcMock = mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: { vendor_id: VALID_UUID, display_name: "Test", description: null, is_active: true, products: [] } },
    error: null,
  }));

  await vendorDashboardRepository.getMyVendorProfile(VALID_UUID);

  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "get_my_vendor_profile");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], { p_user_id: VALID_UUID });
});

test("getMyVendorProfile returns profile when ok is true", async () => {
  const profile = {
    vendor_id: VALID_UUID,
    display_name: "Mi Tienda",
    description: "Descripcion",
    is_active: true,
    products: [],
  };

  mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: profile },
    error: null,
  }));

  const result = await vendorDashboardRepository.getMyVendorProfile(VALID_UUID);
  assert.deepEqual(result, profile);
});

test("getMyVendorProfile returns null when ok is false", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: { ok: false, message: "Tienda no encontrada" },
    error: null,
  }));

  const result = await vendorDashboardRepository.getMyVendorProfile(VALID_UUID);
  assert.equal(result, null);
});

test("getMyVendorProfile throws when rpc error is not null", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: null,
    error: { message: "rpc failed" },
  }));

  await assert.rejects(
    vendorDashboardRepository.getMyVendorProfile(VALID_UUID),
    /Error al obtener perfil del vendedor/,
  );
});

test("getMyVendorProfile result does not contain user_id or password_hash", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: {
      ok: true,
      data: {
        vendor_id: VALID_UUID,
        display_name: "Mi Tienda",
        description: null,
        is_active: true,
        products: [],
      },
    },
    error: null,
  }));

  const result = await vendorDashboardRepository.getMyVendorProfile(VALID_UUID);
  assert.equal(result !== null && "user_id" in result, false);
  assert.equal(result !== null && "password_hash" in result, false);
});

import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-key";
process.env.JWT_SECRET ??= "test-secret";

const { vendorDashboardRepository } = await import(
  "./vendor-dashboard.repository.ts"
);
const { supabaseAdmin } = await import("../../lib/supabaseClient.ts");

afterEach(() => mock.restoreAll());

const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const storeId = "11111111-2222-3333-4444-555555555555";
const productId = "99999999-8888-7777-6666-555555555555";

test("listManagedStores uses the service RPC without exposing users", async () => {
  const rpc = mock.method(supabaseAdmin, "rpc", async () => ({
    data: {
      ok: true,
      data: [{
        store_id: storeId,
        display_name: "Tienda",
        member_role: "manager",
      }],
    },
    error: null,
  }));

  const stores = await vendorDashboardRepository.listManagedStores(userId);

  assert.equal(stores[0]?.store_id, storeId);
  assert.equal(rpc.mock.calls[0]?.arguments[0], "vendor_get_managed_stores");
  assert.deepEqual(rpc.mock.calls[0]?.arguments[1], { p_user_id: userId });
  assert.equal("user_id" in (stores[0] ?? {}), false);
});

test("getStoreDashboard returns null when membership is denied", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: { ok: false, message: "Tienda no encontrada" },
    error: null,
  }));
  assert.equal(
    await vendorDashboardRepository.getStoreDashboard(userId, storeId),
    null,
  );
});

test("product operations call their dedicated RPCs", async () => {
  const rpc = mock.method(supabaseAdmin, "rpc", async (name: string) => ({
    data: name === "vendor_create_product"
      ? { ok: true, product_id: productId }
      : { ok: true },
    error: null,
  }));

  assert.equal(
    await vendorDashboardRepository.createProduct(userId, storeId, {
      name: "Producto",
    }),
    productId,
  );
  assert.equal(
    await vendorDashboardRepository.updateProduct(userId, productId, {
      name: "Producto",
      isVisible: false,
    }),
    true,
  );
  assert.equal(
    await vendorDashboardRepository.removeProduct(userId, productId),
    true,
  );
  assert.deepEqual(
    rpc.mock.calls.map((call) => call.arguments[0]),
    [
      "vendor_create_product",
      "vendor_update_product",
      "vendor_remove_product",
    ],
  );
});

test("repository hides Supabase details on errors", async () => {
  mock.method(supabaseAdmin, "rpc", async () => ({
    data: null,
    error: { message: "internal database endpoint" },
  }));
  await assert.rejects(
    vendorDashboardRepository.listManagedStores(userId),
    /No se pudo completar la operacion de tienda/,
  );
});

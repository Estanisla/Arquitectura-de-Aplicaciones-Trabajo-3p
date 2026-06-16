import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorRepository } = await import("./vendor.repository.ts");
const { supabase } = await import("../../lib/supabaseClient.ts");

afterEach(() => {
  mock.restoreAll();
});

test("getVendorList calls supabase.rpc with correct name and params", async () => {
  const rpcMock = mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: [] },
    error: null,
  }));

  await vendorRepository.getVendorList(4);

  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "get_vendor_list_with_products");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], { p_preview_limit: 4 });
});

test("getVendorList returns vendor array when rpc succeeds", async () => {
  const vendors = [
    {
      vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      display_name: "GrowaGarden",
      description: "Plantas y jardineria",
      products: [
        {
          id: "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
          name: "Maceta",
          description: "Maceta de barro",
          image_url: null,
        },
      ],
    },
  ];

  mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: vendors },
    error: null,
  }));

  const result = await vendorRepository.getVendorList(4);

  assert.deepEqual(result, vendors);
});

test("getVendorList throws when rpc error is not null", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: null,
    error: { message: "connection failed" },
  }));

  await assert.rejects(
    vendorRepository.getVendorList(4),
    /Error al obtener lista de vendedores/,
  );
});

test("getVendorList throws when data.ok is false", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: { ok: false, message: "sin acceso" },
    error: null,
  }));

  await assert.rejects(
    vendorRepository.getVendorList(4),
    /sin acceso/,
  );
});

test("getVendorProfile calls supabase.rpc with correct name and params", async () => {
  const vendorId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  const rpcMock = mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: { vendor_id: vendorId, display_name: "Test", products: [] } },
    error: null,
  }));

  await vendorRepository.getVendorProfile(vendorId);

  assert.equal(rpcMock.mock.calls.length, 1);
  assert.equal(rpcMock.mock.calls[0]?.arguments[0], "get_vendor_profile");
  assert.deepEqual(rpcMock.mock.calls[0]?.arguments[1], { p_vendor_id: vendorId });
});

test("getVendorProfile returns profile when data.ok is true", async () => {
  const profile = {
    vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    display_name: "GrowaGarden",
    description: "Plantas",
    products: [],
  };

  mock.method(supabase, "rpc", async () => ({
    data: { ok: true, data: profile },
    error: null,
  }));

  const result = await vendorRepository.getVendorProfile(profile.vendor_id);

  assert.deepEqual(result, profile);
});

test("getVendorProfile returns null when data.ok is false", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: { ok: false, message: "Vendedor no encontrado" },
    error: null,
  }));

  const result = await vendorRepository.getVendorProfile(
    "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  );

  assert.equal(result, null);
});

test("getVendorProfile throws when rpc error is not null", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: null,
    error: { message: "rpc failed" },
  }));

  await assert.rejects(
    vendorRepository.getVendorProfile("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    /Error al obtener perfil del vendedor/,
  );
});

test("getVendorList result does not contain user_id or password_hash", async () => {
  mock.method(supabase, "rpc", async () => ({
    data: {
      ok: true,
      data: [
        {
          vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          display_name: "GrowaGarden",
          description: null,
          products: [],
        },
      ],
    },
    error: null,
  }));

  const result = await vendorRepository.getVendorList(4);

  assert.equal("user_id" in result[0]!, false);
  assert.equal("password_hash" in result[0]!, false);
});

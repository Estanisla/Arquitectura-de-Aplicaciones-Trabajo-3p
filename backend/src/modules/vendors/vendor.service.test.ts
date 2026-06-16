import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorService } = await import("./vendor.service.ts");
const { vendorRepository } = await import("./vendor.repository.ts");
const { AppError } = await import("../../shared/AppError.ts");

afterEach(() => {
  mock.restoreAll();
});

test("listVendors calls repository with previewLimit = 4", async () => {
  const listMock = mock.method(vendorRepository, "getVendorList", async () => []);

  await vendorService.listVendors();

  assert.equal(listMock.mock.calls.length, 1);
  assert.equal(listMock.mock.calls[0]?.arguments[0], 4);
});

test("listVendors returns vendor array from repository", async () => {
  const vendors = [
    {
      vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      display_name: "GrowaGarden",
      description: "Plantas",
      products: [],
    },
  ];

  mock.method(vendorRepository, "getVendorList", async () => vendors);

  const result = await vendorService.listVendors();

  assert.deepEqual(result, vendors);
});

test("getVendorProfile rejects non-UUID with 400", async () => {
  await assert.rejects(
    vendorService.getVendorProfile("not-a-uuid"),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 400);
      assert.equal(error.message, "ID de vendedor invalido");
      return true;
    },
  );
});

test("getVendorProfile calls repository with validated UUID", async () => {
  const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const profile = {
    vendor_id: uuid,
    display_name: "GrowaGarden",
    description: "Plantas",
    products: [],
  };

  const profileMock = mock.method(vendorRepository, "getVendorProfile", async () => profile);

  const result = await vendorService.getVendorProfile(uuid);

  assert.equal(profileMock.mock.calls.length, 1);
  assert.equal(profileMock.mock.calls[0]?.arguments[0], uuid);
  assert.deepEqual(result, profile);
});

test("getVendorProfile throws AppError 404 when repository returns null", async () => {
  mock.method(vendorRepository, "getVendorProfile", async () => null);

  await assert.rejects(
    vendorService.getVendorProfile("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    (error: unknown) => {
      assert(error instanceof AppError);
      assert.equal((error as AppError).status, 404);
      assert.equal(error.message, "Vendedor no encontrado");
      return true;
    },
  );
});

test("getVendorProfile returns profile when repository responds correctly", async () => {
  const profile = {
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
  };

  mock.method(vendorRepository, "getVendorProfile", async () => profile);

  const result = await vendorService.getVendorProfile(profile.vendor_id);

  assert.deepEqual(result, profile);
});

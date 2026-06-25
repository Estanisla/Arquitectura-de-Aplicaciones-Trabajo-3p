import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorDashboardService } = await import("./vendor-dashboard.service.ts");
const { vendorDashboardRepository } = await import("./vendor-dashboard.repository.ts");

afterEach(() => {
  mock.restoreAll();
});

const VALID_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const mockProfile = {
  vendor_id: VALID_UUID,
  display_name: "Mi Tienda",
  description: "Descripcion",
  is_active: true,
  products: [],
};

test("getMyProfile returns profile when repository returns data", async () => {
  mock.method(vendorDashboardRepository, "getMyVendorProfile", async () => mockProfile);

  const result = await vendorDashboardService.getMyProfile(VALID_UUID);
  assert.deepEqual(result, mockProfile);
});

test("getMyProfile throws 404 AppError when repository returns null", async () => {
  mock.method(vendorDashboardRepository, "getMyVendorProfile", async () => null);

  await assert.rejects(
    vendorDashboardService.getMyProfile(VALID_UUID),
    (err: { message: string; status: number }) => {
      assert.equal(err.message, "Tienda no encontrada para este vendedor");
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test("getMyProfile propagates unexpected errors", async () => {
  mock.method(vendorDashboardRepository, "getMyVendorProfile", async () => {
    throw new Error("unexpected");
  });

  await assert.rejects(
    vendorDashboardService.getMyProfile(VALID_UUID),
    /unexpected/,
  );
});

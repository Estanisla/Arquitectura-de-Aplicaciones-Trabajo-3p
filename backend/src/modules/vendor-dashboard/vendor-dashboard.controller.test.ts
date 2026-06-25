import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorDashboardController } = await import("./vendor-dashboard.controller.ts");
const { vendorDashboardService } = await import("./vendor-dashboard.service.ts");

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

const mockRes = () => {
  const res: Record<string, unknown> = {};
  res.status = (code: number) => { res._status = code; return res; };
  res.json = (data: unknown) => { res._json = data; return res; };
  return res as unknown as import("express").Response;
};

test("getMyProfile returns 200 with vendor data", async () => {
  mock.method(vendorDashboardService, "getMyProfile", async () => mockProfile);

  const req = { vendorUserId: VALID_UUID } as unknown as import("express").Request;
  const res = mockRes();

  await vendorDashboardController.getMyProfile(req, res);

  assert.equal((res as Record<string, unknown>)._status, 200);
  assert.deepEqual((res as Record<string, unknown>)._json, { vendor: mockProfile });
});

test("getMyProfile returns 404 when AppError is thrown", async () => {
  const { AppError } = await import("../../shared/AppError.ts");
  mock.method(vendorDashboardService, "getMyProfile", async () => {
    throw new AppError("Tienda no encontrada para este vendedor", 404);
  });

  const req = { vendorUserId: VALID_UUID } as unknown as import("express").Request;
  const res = mockRes();

  await vendorDashboardController.getMyProfile(req, res);

  assert.equal((res as Record<string, unknown>)._status, 404);
});

test("getMyProfile returns 500 on unexpected error", async () => {
  mock.method(vendorDashboardService, "getMyProfile", async () => {
    throw new Error("unexpected");
  });

  const req = { vendorUserId: VALID_UUID } as unknown as import("express").Request;
  const res = mockRes();

  await vendorDashboardController.getMyProfile(req, res);

  assert.equal((res as Record<string, unknown>)._status, 500);
});

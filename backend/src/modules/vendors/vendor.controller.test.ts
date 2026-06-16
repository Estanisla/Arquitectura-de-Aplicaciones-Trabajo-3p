import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { vendorController } = await import("./vendor.controller.ts");
const { vendorService } = await import("./vendor.service.ts");

afterEach(() => {
  mock.restoreAll();
});

const createResponse = () => {
  const state: {
    statusCode: number;
    jsonBody: unknown;
  } = {
    statusCode: 200,
    jsonBody: undefined,
  };

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      state.jsonBody = payload;
      return response;
    },
  };

  return { response, state };
};

test("list responds 200 with vendors array", async () => {
  const vendors = [
    {
      vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      display_name: "GrowaGarden",
      description: "Plantas",
      products: [],
    },
  ];

  mock.method(vendorService, "listVendors", async () => vendors);

  const { response, state } = createResponse();

  await vendorController.list({} as never, response as never);

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, { vendors });
});

test("list responds 500 when service throws", async () => {
  mock.method(vendorService, "listVendors", async () => {
    throw new Error("unexpected");
  });

  const { response, state } = createResponse();

  await vendorController.list({} as never, response as never);

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, { message: "Error interno" });
});

test("getProfile responds 200 with vendor profile", async () => {
  const vendor = {
    vendor_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    display_name: "GrowaGarden",
    description: "Plantas",
    products: [],
  };

  mock.method(vendorService, "getVendorProfile", async () => vendor);

  const { response, state } = createResponse();

  await vendorController.getProfile(
    { params: { vendorId: vendor.vendor_id } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, { vendor });
});

test("getProfile responds 400 for invalid UUID", async () => {
  mock.method(vendorService, "getVendorProfile", async () => {
    const { AppError } = await import("../../shared/AppError.ts");
    throw new AppError("ID de vendedor invalido", 400);
  });

  const { response, state } = createResponse();

  await vendorController.getProfile(
    { params: { vendorId: "not-a-uuid" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.jsonBody, { message: "ID de vendedor invalido" });
});

test("getProfile responds 404 when vendor not found", async () => {
  mock.method(vendorService, "getVendorProfile", async () => {
    const { AppError } = await import("../../shared/AppError.ts");
    throw new AppError("Vendedor no encontrado", 404);
  });

  const { response, state } = createResponse();

  await vendorController.getProfile(
    {
      params: { vendorId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 404);
  assert.deepEqual(state.jsonBody, { message: "Vendedor no encontrado" });
});

test("getProfile responds 500 when service throws unexpected error", async () => {
  mock.method(vendorService, "getVendorProfile", async () => {
    throw new Error("db exploded");
  });

  const { response, state } = createResponse();

  await vendorController.getProfile(
    {
      params: { vendorId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, { message: "Error interno" });
});

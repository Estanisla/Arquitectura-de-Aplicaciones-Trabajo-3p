import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.ts";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.JWT_SECRET ??= "test-secret";

const { vendorDashboardService } = await import("./vendor-dashboard.service.ts");
const { vendorDashboardController } = await import(
  "./vendor-dashboard.controller.ts"
);

afterEach(() => mock.restoreAll());

const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const storeId = "11111111-2222-3333-4444-555555555555";

const response = () => {
  const state = { status: 0, body: undefined as unknown };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;
  return { res, state };
};

const request = (params = {}, body = {}) => ({
  vendorUserId: userId,
  params,
  body,
}) as unknown as Request;

test("listStores returns only managed store summaries", async () => {
  mock.method(vendorDashboardService, "listManagedStores", async () => [{
    store_id: storeId,
    display_name: "Tienda",
    member_role: "owner" as const,
  }]);
  const { res, state } = response();

  await vendorDashboardController.listStores(request(), res);

  assert.equal(state.status, 200);
  assert.deepEqual(state.body, {
    ok: true,
    data: [{
      store_id: storeId,
      display_name: "Tienda",
      member_role: "owner",
    }],
  });
});

test("createProduct returns 201 with the safe product id", async () => {
  mock.method(vendorDashboardService, "createProduct", async () => storeId);
  const { res, state } = response();

  await vendorDashboardController.createProduct(
    request({ storeId }, { name: "Producto" }),
    res,
  );

  assert.equal(state.status, 201);
  assert.deepEqual(state.body, {
    ok: true,
    message: "Producto creado",
    productId: storeId,
  });
});

test("controller replaces expected and unexpected errors", async () => {
  mock.method(vendorDashboardService, "getStoreDashboard", async () => {
    throw new AppError("detail", 404);
  });
  const first = response();
  await vendorDashboardController.getStore(request({ storeId }), first.res);
  assert.deepEqual(first.state.body, {
    ok: false,
    message: "Recurso no encontrado",
  });

  mock.restoreAll();
  mock.method(vendorDashboardService, "getStoreDashboard", async () => {
    throw new Error("database endpoint");
  });
  const second = response();
  await vendorDashboardController.getStore(request({ storeId }), second.res);
  assert.deepEqual(second.state.body, {
    ok: false,
    message: "No se pudo completar la solicitud",
  });
});

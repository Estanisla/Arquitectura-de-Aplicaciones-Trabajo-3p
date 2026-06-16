import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import jwt from "jsonwebtoken";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
process.env.SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vendor_session";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";

const { adminPanelController } = await import("./admin-panel.controller.ts");
const { adminPanelService } = await import("./admin-panel.service.ts");

const jwtSecret = process.env.JWT_SECRET!;
const sessionCookieName = process.env.SESSION_COOKIE_NAME!;

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

const validUuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const makeAdminRequest = () => ({
  cookies: {
    [sessionCookieName]: jwt.sign({ role: "admin" }, jwtSecret, {
      subject: validUuid,
      expiresIn: "12h",
    }),
  },
  body: {},
  params: {},
});

// --- createVendor tests ---

test("createVendor responds 201 with userId and vendorId on success", async () => {
  mock.method(adminPanelService, "createVendor", async () => ({
    userId: "new-user-id",
    vendorId: "new-vendor-id",
  }));

  const { response, state } = createResponse();

  await adminPanelController.createVendor(
    {
      ...makeAdminRequest(),
      body: { username: "newvendor", tempPassword: "temp123456", displayName: "Tienda" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 201);
  assert.deepEqual(state.jsonBody, {
    userId: "new-user-id",
    vendorId: "new-vendor-id",
  });
});

test("createVendor responds 400 when service throws AppError 400", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  mock.method(adminPanelService, "createVendor", async () => {
    throw new AppError("username requerido", 400);
  });

  const { response, state } = createResponse();

  await adminPanelController.createVendor(
    {
      ...makeAdminRequest(),
      body: { username: "", tempPassword: "temp123456", displayName: "Tienda" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.jsonBody, { ok: false, message: "username requerido" });
});

test("createVendor responds 409 on unique violation", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  mock.method(adminPanelService, "createVendor", async () => {
    throw new AppError("El username ya existe", 409);
  });

  const { response, state } = createResponse();

  await adminPanelController.createVendor(
    {
      ...makeAdminRequest(),
      body: { username: "exists", tempPassword: "temp123456", displayName: "Tienda" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 409);
});

test("createVendor responds 403 without admin session", async () => {
  const { response, state } = createResponse();

  await adminPanelController.createVendor(
    { cookies: {}, body: {} } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
});

test("createVendor responds 403 when session role is not admin", async () => {
  const { response, state } = createResponse();

  await adminPanelController.createVendor(
    {
      cookies: {
        [sessionCookieName]: jwt.sign({ role: "vendor" }, jwtSecret, {
          subject: validUuid,
          expiresIn: "12h",
        }),
      },
      body: {},
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
});

// --- listVendors tests ---

test("listVendors responds 200 with vendors array", async () => {
  const vendors = [
    { user_id: "user-1", username: "v1", display_name: "T1", vendor_id: "v-1", is_active: true, is_deleted: false, must_change_password: true, created_at: "2025-01-01T00:00:00Z" },
  ];

  mock.method(adminPanelService, "listVendors", async () => vendors);

  const { response, state } = createResponse();

  await adminPanelController.listVendors(
    makeAdminRequest() as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, { vendors });
});

test("listVendors responds 403 without admin session", async () => {
  const { response, state } = createResponse();

  await adminPanelController.listVendors(
    { cookies: {} } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
});

// --- deactivateVendor tests ---

test("deactivateVendor responds 200 on success", async () => {
  mock.method(adminPanelService, "deactivateVendor", async () => {});

  const { response, state } = createResponse();

  await adminPanelController.deactivateVendor(
    {
      ...makeAdminRequest(),
      params: { vendorId: validUuid },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, { ok: true, message: "Tienda desactivada" });
});

test("deactivateVendor responds 404 when vendor not found", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  mock.method(adminPanelService, "deactivateVendor", async () => {
    throw new AppError("Vendedor no encontrado", 404);
  });

  const { response, state } = createResponse();

  await adminPanelController.deactivateVendor(
    {
      ...makeAdminRequest(),
      params: { vendorId: validUuid },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 404);
});

test("deactivateVendor responds 403 without admin session", async () => {
  const { response, state } = createResponse();

  await adminPanelController.deactivateVendor(
    { cookies: {}, params: {} } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
});

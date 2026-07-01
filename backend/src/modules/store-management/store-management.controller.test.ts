import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import jwt from "jsonwebtoken";

process.env.SUPABASE_URL ??= "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY ??= "anon-key";
process.env.JWT_SECRET ??= "test-secret";

const { env } = await import("../../config/env.ts");
const { storeManagementService } = await import(
  "./store-management.service.ts"
);
const { storeManagementController } = await import(
  "./store-management.controller.ts"
);

afterEach(() => mock.restoreAll());

const createResponse = () => {
  const state = { statusCode: 200, jsonBody: null as unknown };
  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.jsonBody = body;
      return response;
    },
  };
  return { response, state };
};

const adminRequest = (body: unknown = {}, params: unknown = {}) => ({
  body,
  params,
  cookies: {
    [env.SESSION_COOKIE_NAME]: jwt.sign(
      { role: "admin" },
      env.JWT_SECRET,
      {
        subject: "99999999-8888-7777-6666-555555555555",
        expiresIn: "1h",
      },
    ),
  },
});

test("listStores requires an admin session", async () => {
  const { response, state } = createResponse();
  await storeManagementController.listStores(
    { cookies: {} } as never,
    response as never,
  );
  assert.equal(state.statusCode, 403);
});

test("listStores returns safe store data", async () => {
  mock.method(storeManagementService, "listStores", async () => ({
    emporium_name: "Emporio Azul",
    stores: [],
  }));
  const { response, state } = createResponse();

  await storeManagementController.listStores(
    adminRequest() as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    data: { emporium_name: "Emporio Azul", stores: [] },
  });
});

test("createStore returns a generic validation error", async () => {
  mock.method(storeManagementService, "createStore", async () => {
    const { AppError } = await import("../../shared/AppError.ts");
    throw new AppError("internal validation detail", 400);
  });
  const { response, state } = createResponse();

  await storeManagementController.createStore(
    adminRequest({}) as never,
    response as never,
  );

  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "Solicitud invalida",
  });
});

test("member endpoints require admin and return safe responses", async () => {
  mock.method(storeManagementService, "addMember", async () => undefined);
  const { response, state } = createResponse();

  await storeManagementController.addMember(
    adminRequest(
      { username: "manager", tempPassword: "Temporal123" },
      { storeId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    ) as never,
    response as never,
  );

  assert.equal(state.statusCode, 201);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Usuario agregado correctamente",
  });
});

test("contact endpoint hides unexpected storage errors", async () => {
  mock.method(storeManagementService, "updateContacts", async () => {
    throw new Error("database endpoint");
  });
  const { response, state } = createResponse();

  await storeManagementController.updateContacts(
    adminRequest(
      { contacts: [] },
      { storeId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    ) as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo completar la solicitud",
  });
});

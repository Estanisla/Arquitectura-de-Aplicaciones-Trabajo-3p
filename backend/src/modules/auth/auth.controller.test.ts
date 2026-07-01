import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import jwt from "jsonwebtoken";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
process.env.SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vendor_session";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";

const { authController } = await import("./auth.controller.ts");
const { authService } = await import("./auth.service.ts");

afterEach(() => {
  mock.restoreAll();
});

const sessionCookieName = process.env.SESSION_COOKIE_NAME!;
const jwtSecret = process.env.JWT_SECRET!;

const createResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as unknown,
    cookies: [] as Array<{ name: string; value: string; options: object }>,
    clearedCookies: [] as Array<{ name: string; options: object }>,
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
    cookie(name: string, value: string, options: object) {
      state.cookies.push({ name, value, options });
      return response;
    },
    clearCookie(name: string, options: object) {
      state.clearedCookies.push({ name, options });
      return response;
    },
  };

  return { response, state };
};

test("authController.login returns 200 and sets a vendor cookie on success", async () => {
  mock.method(authService, "login", async () => ({
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
  }));

  const { response, state } = createResponse();

  await authController.login(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
  });
  assert.equal(state.cookies.length, 1);
  assert.equal(state.cookies[0]?.name, sessionCookieName);
});

test("authController.login returns 401 for invalid credentials", async () => {
  mock.method(authService, "login", async () => ({
    ok: false,
    message: "Credenciales invalidas",
  }));

  const { response, state } = createResponse();

  await authController.login(
    { body: { username: "alice", password: "wrong" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 401);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "Credenciales invalidas",
  });
  assert.equal(state.cookies.length, 0);
});

test("authController.login returns 500 when the service throws", async () => {
  mock.method(authService, "login", async () => {
    throw new Error("rpc exploded");
  });

  const { response, state } = createResponse();

  await authController.login(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo iniciar sesion",
  });
});

test("authController.register returns 201 on success and 400 on validation failure", async () => {
  mock.method(authService, "register", async ({ username }) => {
    if (username === "bad-user") {
      return { ok: false, message: "username requerido" };
    }

    return {
      ok: true,
      message: "Usuario creado",
      user_id: "vendor-2",
    };
  });

  const success = createResponse();
  await authController.register(
    { body: { username: "alice", password: "secret1" } } as never,
    success.response as never,
  );
  assert.equal(success.state.statusCode, 201);

  const failure = createResponse();
  await authController.register(
    { body: { username: "bad-user", password: "secret1" } } as never,
    failure.response as never,
  );
  assert.equal(failure.state.statusCode, 400);
  assert.deepEqual(failure.state.jsonBody, {
    ok: false,
    message: "username requerido",
  });
});

test("authController.adminLogin returns 200 and sets an admin cookie on success", async () => {
  mock.method(authService, "adminLogin", async () => ({
    ok: true,
    message: "Admin login correcto",
    admin_id: "admin-1",
  }));

  const { response, state } = createResponse();

  await authController.adminLogin(
    { body: { username: "root", password: "secret1234" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Admin login correcto",
    admin_id: "admin-1",
  });
  assert.equal(state.cookies.length, 1);
  assert.equal(state.cookies[0]?.name, sessionCookieName);
});

test("authController.adminLogin returns 401 for invalid credentials", async () => {
  mock.method(authService, "adminLogin", async () => ({
    ok: false,
    message: "Credenciales invalidas",
  }));

  const { response, state } = createResponse();

  await authController.adminLogin(
    { body: { username: "root", password: "wrong" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 401);
  assert.equal(state.cookies.length, 0);
});

test("authController.adminLogin returns 500 when the service throws", async () => {
  mock.method(authService, "adminLogin", async () => {
    throw new Error("admin rpc exploded");
  });

  const { response, state } = createResponse();

  await authController.adminLogin(
    { body: { username: "root", password: "secret1234" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo iniciar sesion",
  });
});

test("authController.adminLogin returns 500 when the service throws a non-Error", async () => {
  mock.method(authService, "adminLogin", async () => {
    throw "string error";
  });

  const { response, state } = createResponse();

  await authController.adminLogin(
    { body: { username: "root", password: "secret1234" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo iniciar sesion",
  });
});

test("authController.session returns authenticated session details when the cookie is valid", () => {
  const token = jwt.sign({ role: "admin" }, jwtSecret, {
    subject: "admin-1",
    expiresIn: "12h",
  });
  const { response, state } = createResponse();

  authController.session(
    {
      cookies: {
        [sessionCookieName]: token,
      },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    authenticated: true,
    message: "Sesion activa",
    user_id: "admin-1",
    role: "admin",
  });
});

test("authController.session returns anonymous when cookie has no role", () => {
  const token = jwt.sign({}, jwtSecret, {
    subject: "admin-1",
    expiresIn: "12h",
  });
  const { response, state } = createResponse();

  authController.session(
    {
      cookies: {
        [sessionCookieName]: token,
      },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    authenticated: false,
    message: "Sin sesion activa",
  });
});

test("authController.session returns an anonymous payload without a valid session", () => {
  const { response, state } = createResponse();

  authController.session(
    {
      cookies: {},
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    authenticated: false,
    message: "Sin sesion activa",
  });
});

test("authController.logout clears the session cookie", () => {
  const { response, state } = createResponse();

  authController.logout({} as never, response as never);

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Sesion cerrada",
    authenticated: false,
  });
  assert.equal(state.clearedCookies.length, 1);
  assert.equal(state.clearedCookies[0]?.name, sessionCookieName);
});

test("authController.login returns 500 when the service throws a non-Error", async () => {
  mock.method(authService, "login", async () => {
    throw "string error";
  });

  const { response, state } = createResponse();

  await authController.login(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo iniciar sesion",
  });
});

test("authController.register returns 500 when the service throws an Error", async () => {
  mock.method(authService, "register", async () => {
    throw new Error("register exploded");
  });

  const { response, state } = createResponse();

  await authController.register(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo completar el registro",
  });
});

test("authController.register returns 500 when the service throws a non-Error", async () => {
  mock.method(authService, "register", async () => {
    throw "string error";
  });

  const { response, state } = createResponse();

  await authController.register(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo completar el registro",
  });
});

test("authController.login includes mustChangePassword in response", async () => {
  mock.method(authService, "login", async () => ({
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
    must_change_password: true,
  }));

  const { response, state } = createResponse();

  await authController.login(
    { body: { username: "alice", password: "secret1" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Login correcto",
    user_id: "vendor-1",
    must_change_password: true,
  });
});

test("authController.changePassword returns 200 on success", async () => {
  mock.method(authService, "changePassword", async () => {});

  const { response, state } = createResponse();

  const token = jwt.sign({ role: "vendor" }, jwtSecret, {
    subject: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    expiresIn: "12h",
  });

  await authController.changePassword(
    {
      cookies: { [sessionCookieName]: token },
      body: { currentPassword: "oldpass", newPassword: "newpass123" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Contrasena actualizada correctamente",
  });
});

test("authController.changePassword returns 401 without valid session", async () => {
  const { response, state } = createResponse();

  await authController.changePassword(
    {
      cookies: {},
      body: { currentPassword: "oldpass", newPassword: "newpass123" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 401);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "Sesion no valida",
  });
});

test("authController.changePassword returns 400 when service throws AppError", async () => {
  const { AppError } = await import("../../shared/AppError.ts");

  mock.method(authService, "changePassword", async () => {
    throw new AppError("La nueva contrasena debe tener al menos 6 caracteres", 400);
  });

  const { response, state } = createResponse();

  const token = jwt.sign({ role: "vendor" }, jwtSecret, {
    subject: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    expiresIn: "12h",
  });

  await authController.changePassword(
    {
      cookies: { [sessionCookieName]: token },
      body: { currentPassword: "oldpass", newPassword: "short" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "La nueva contrasena debe tener al menos 6 caracteres",
  });
});

test("authController.changePassword returns 500 when service throws a generic Error", async () => {
  mock.method(authService, "changePassword", async () => {
    throw new Error("generic error");
  });

  const { response, state } = createResponse();

  const token = jwt.sign({ role: "vendor" }, jwtSecret, {
    subject: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    expiresIn: "12h",
  });

  await authController.changePassword(
    {
      cookies: { [sessionCookieName]: token },
      body: { currentPassword: "oldpass", newPassword: "newpass123" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo cambiar la contrasena",
  });
});


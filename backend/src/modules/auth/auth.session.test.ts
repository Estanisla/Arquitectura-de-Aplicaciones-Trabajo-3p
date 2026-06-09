import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
process.env.SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vendor_session";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";

const {
  clearSessionCookie,
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
  setSessionCookie,
} = await import("./auth.session.ts");

const sessionCookieName = process.env.SESSION_COOKIE_NAME!;
const jwtSecret = process.env.JWT_SECRET!;

test("setSessionCookie stores a token that can be read back from the request", () => {
  const cookieCalls: Array<{ name: string; value: string; options: object }> = [];
  const response = {
    cookie(name: string, value: string, options: object) {
      cookieCalls.push({ name, value, options });
    },
  };

  setSessionCookie(response as never, "vendor-1", "vendor");

  assert.equal(cookieCalls.length, 1);
  assert.equal(cookieCalls[0]?.name, sessionCookieName);
  assert.equal(typeof cookieCalls[0]?.value, "string");
  assert.deepEqual(cookieCalls[0]?.options, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  const request = {
    cookies: {
      [sessionCookieName]: cookieCalls[0]?.value,
    },
  };

  assert.equal(readSessionUserIdFromRequest(request as never), "vendor-1");
  assert.equal(readSessionRoleFromRequest(request as never), "vendor");
});

test("readSession helpers return null for missing or invalid cookies", () => {
  assert.equal(readSessionUserIdFromRequest({ cookies: {} } as never), null);
  assert.equal(readSessionRoleFromRequest({ cookies: {} } as never), null);

  const invalidRequest = {
    cookies: {
      [sessionCookieName]: "not-a-jwt",
    },
  };

  assert.equal(readSessionUserIdFromRequest(invalidRequest as never), null);
  assert.equal(readSessionRoleFromRequest(invalidRequest as never), null);
});

test("readSession helpers reject tokens with unsupported roles", () => {
  const token = jwt.sign({ role: "customer" }, jwtSecret, {
    subject: "user-1",
    expiresIn: "12h",
  });

  const request = {
    cookies: {
      [sessionCookieName]: token,
    },
  };

  assert.equal(readSessionUserIdFromRequest(request as never), null);
  assert.equal(readSessionRoleFromRequest(request as never), null);
});

test("clearSessionCookie clears the configured session cookie", () => {
  const clearCookieCalls: Array<{ name: string; options: object }> = [];
  const response = {
    clearCookie(name: string, options: object) {
      clearCookieCalls.push({ name, options });
    },
  };

  clearSessionCookie(response as never);

  assert.deepEqual(clearCookieCalls, [
    {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      },
    },
  ]);
});

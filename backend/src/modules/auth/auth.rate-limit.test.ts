import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import {
  authRateLimit,
  AUTH_RATE_LIMIT_MAX_ATTEMPTS,
  resetAuthRateLimitStore,
} from "./auth.rate-limit.js";

const createRequest = (ip = "127.0.0.1"): Request => ({ ip } as Request);

const createResponse = () => {
  let statusCode = 200;
  let body: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as Partial<Response>;

  return {
    res: res as Response,
    getStatusCode: () => statusCode,
    getBody: () => body,
  };
};

test.beforeEach(() => {
  resetAuthRateLimitStore();
});

test.after(() => {
  resetAuthRateLimitStore();
});

test("permite hasta el maximo de intentos por IP", () => {
  const req = createRequest();
  let nextCalls = 0;

  for (let index = 0; index < AUTH_RATE_LIMIT_MAX_ATTEMPTS; index += 1) {
    const { res, getStatusCode } = createResponse();

    authRateLimit(req, res, () => {
      nextCalls += 1;
    });

    assert.equal(getStatusCode(), 200);
  }

  assert.equal(nextCalls, AUTH_RATE_LIMIT_MAX_ATTEMPTS);
});

test("bloquea el intento que excede el maximo por IP", () => {
  const req = createRequest();

  for (let index = 0; index < AUTH_RATE_LIMIT_MAX_ATTEMPTS; index += 1) {
    const { res } = createResponse();
    authRateLimit(req, res, () => {});
  }

  const { res, getStatusCode, getBody } = createResponse();
  let nextCalled = false;

  authRateLimit(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(getStatusCode(), 429);
  assert.deepEqual(getBody(), {
    ok: false,
    message:
      "Demasiados intentos de inicio de sesion. Intenta nuevamente en 30 minutos",
  });
});
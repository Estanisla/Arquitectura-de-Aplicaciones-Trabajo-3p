import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "12h";
process.env.SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "vendor_session";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";

const { reviewsController } = await import("./reviews.controller.ts");
const { reviewsService } = await import("./reviews.service.ts");
const { AppError } = await import("../../shared/AppError.ts");

afterEach(() => {
  mock.restoreAll();
});

const adminId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const reviewId = new ObjectId().toHexString();
const sessionCookieName = process.env.SESSION_COOKIE_NAME!;
const jwtSecret = process.env.JWT_SECRET!;

const adminRequest = (params: Record<string, string> = {}) => ({
  cookies: {
    [sessionCookieName]: jwt.sign({ role: "admin" }, jwtSecret, {
      subject: adminId,
      expiresIn: "12h",
    }),
  },
  params,
  body: {},
});

const createResponse = () => {
  const state: { statusCode: number; jsonBody: unknown } = {
    statusCode: 200,
    jsonBody: undefined,
  };
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

test("listReviewsForModeration requires an admin session", async () => {
  const { response, state } = createResponse();

  await reviewsController.listReviewsForModeration(
    { cookies: {} } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
  assert.deepEqual(state.jsonBody, { ok: false, message: "No autorizado" });
});

test("listReviewsForModeration rejects a vendor session", async () => {
  const { response, state } = createResponse();
  const vendorToken = jwt.sign({ role: "vendor" }, jwtSecret, {
    subject: adminId,
    expiresIn: "12h",
  });

  await reviewsController.listReviewsForModeration(
    { cookies: { [sessionCookieName]: vendorToken } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 403);
});

test("getProductReviews returns public reviews", async () => {
  mock.method(reviewsService, "getReviewsByProduct", async () => [{
    id: reviewId,
    product_id: "product",
    vendor_id: "vendor",
    rating: 5,
    comment: "Excelente",
    created_at: "2026-06-28T00:00:00.000Z",
  }]);
  const { response, state } = createResponse();

  await reviewsController.getProductReviews(
    { params: { productId: "product" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.equal((state.jsonBody as { data: unknown[] }).data.length, 1);
});

test("createProductReview returns the created review", async () => {
  mock.method(reviewsService, "createReview", async () => ({
    id: reviewId,
    product_id: "product",
    vendor_id: "vendor",
    rating: 4,
    comment: "Buena",
    created_at: "2026-06-28T00:00:00.000Z",
  }));
  const { response, state } = createResponse();

  await reviewsController.createProductReview(
    {
      params: { productId: "product" },
      body: { vendor_id: "vendor", rating: 4, comment: "Buena" },
    } as never,
    response as never,
  );

  assert.equal(state.statusCode, 201);
  assert.equal((state.jsonBody as { ok: boolean }).ok, true);
});

test("createProductReview supplies safe defaults for an incomplete body", async () => {
  let capturedVendorId = "not-called";
  let capturedRating = -1;
  let capturedComment = "not-called";
  mock.method(
    reviewsService,
    "createReview",
    async (_productId, vendorId, body) => {
      capturedVendorId = vendorId;
      capturedRating = body.rating;
      capturedComment = body.comment;
      throw new AppError("Datos incompletos", 400);
    },
  );
  const { response, state } = createResponse();

  await reviewsController.createProductReview(
    { params: {}, body: {} } as never,
    response as never,
  );

  assert.equal(capturedVendorId, "");
  assert.equal(capturedRating, 0);
  assert.equal(capturedComment, "");
  assert.equal(state.statusCode, 400);
});

test("public controller errors use generic messages", async () => {
  mock.method(reviewsService, "getReviewsByProduct", async () => {
    throw new AppError("ID interno invalido", 400);
  });
  const { response, state } = createResponse();

  await reviewsController.getProductReviews(
    { params: { productId: "invalid" } } as never,
    response as never,
  );

  assert.equal(state.statusCode, 400);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "Solicitud invalida",
  });
});

test("listReviewsForModeration returns reviews to an admin", async () => {
  mock.method(reviewsService, "getReviewsForModeration", async () => [{
    id: reviewId,
    product_id: "product",
    vendor_id: "vendor",
    rating: 1,
    comment: "Contenido",
    created_at: "2026-06-28T00:00:00.000Z",
    status: "visible" as const,
    moderated_at: null,
  }]);
  const { response, state } = createResponse();

  await reviewsController.listReviewsForModeration(
    adminRequest() as never,
    response as never,
  );

  assert.equal(state.statusCode, 200);
  assert.equal(
    (state.jsonBody as { data: unknown[] }).data.length,
    1,
  );
});

test("removeReview marks a review as removed", async () => {
  let capturedReviewId = "";
  mock.method(reviewsService, "removeReview", async (value) => {
    capturedReviewId = value;
  });
  const { response, state } = createResponse();

  await reviewsController.removeReview(
    adminRequest({ reviewId }) as never,
    response as never,
  );

  assert.equal(capturedReviewId, reviewId);
  assert.equal(state.statusCode, 200);
  assert.deepEqual(state.jsonBody, {
    ok: true,
    message: "Resena eliminada correctamente",
  });
});

test("controller replaces internal AppError details with a public message", async () => {
  mock.method(reviewsService, "removeReview", async () => {
    throw new AppError("Mongo collection reviews unavailable", 404);
  });
  const { response, state } = createResponse();

  await reviewsController.removeReview(
    adminRequest({ reviewId }) as never,
    response as never,
  );

  assert.equal(state.statusCode, 404);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "Recurso no encontrado",
  });
});

test("controller returns a generic message for unexpected errors", async () => {
  mock.method(reviewsService, "getReviewsForModeration", async () => {
    throw new Error("mongodb://secret-host/internal");
  });
  const { response, state } = createResponse();

  await reviewsController.listReviewsForModeration(
    adminRequest() as never,
    response as never,
  );

  assert.equal(state.statusCode, 500);
  assert.deepEqual(state.jsonBody, {
    ok: false,
    message: "No se pudo completar la solicitud",
  });
});

test("controller maps authorization and other errors to generic messages", async () => {
  mock.method(reviewsService, "removeReview", async () => {
    throw new AppError("Token interno invalido", 401);
  });
  const unauthorized = createResponse();

  await reviewsController.removeReview(
    adminRequest({ reviewId }) as never,
    unauthorized.response as never,
  );

  assert.deepEqual(unauthorized.state.jsonBody, {
    ok: false,
    message: "No autorizado",
  });

  mock.restoreAll();
  mock.method(reviewsService, "removeReview", async () => {
    throw new AppError("Conflicto interno", 409);
  });
  const conflict = createResponse();

  await reviewsController.removeReview(
    adminRequest({ reviewId }) as never,
    conflict.response as never,
  );

  assert.deepEqual(conflict.state.jsonBody, {
    ok: false,
    message: "No se pudo completar la solicitud",
  });
});

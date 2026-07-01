import assert from "node:assert/strict";
import test, { afterEach, mock } from "node:test";
import { ObjectId } from "mongodb";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { reviewsRepository } = await import("./reviews.repository.ts");
const { vendorRepository } = await import("../vendors/vendor.repository.ts");
const { reviewsService } = await import("./reviews.service.ts");

afterEach(() => {
  mock.restoreAll();
});

const productId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const vendorId = "11111111-2222-3333-4444-555555555555";
const adminId = "99999999-8888-7777-6666-555555555555";
const reviewId = new ObjectId();

test("getReviewsByProduct returns public review data", async () => {
  mock.method(reviewsRepository, "findByProductId", async () => [{
    _id: reviewId,
    product_id: productId,
    vendor_id: vendorId,
    rating: 4,
    comment: "Buena compra",
    created_at: new Date("2026-06-28T00:00:00Z"),
    status: "visible" as const,
  }]);

  const reviews = await reviewsService.getReviewsByProduct(productId);

  assert.equal(reviews[0]?.id, reviewId.toHexString());
  assert.equal(reviews[0]?.comment, "Buena compra");
  assert.equal("status" in (reviews[0] ?? {}), false);
});

test("createReview validates and stores a visible review", async () => {
  mock.method(reviewsRepository, "insertOne", async () => reviewId.toHexString());
  mock.method(vendorRepository, "getVendorProfile", async () => ({
    vendor_id: vendorId,
    display_name: "Tienda Central",
    description: null,
    products: [{
      id: productId,
      name: "Polo azul",
      description: null,
      image_url: null,
    }],
  }));

  const review = await reviewsService.createReview(productId, vendorId, {
    rating: 5,
    comment: "  Excelente  ",
  });

  assert.equal(review.id, reviewId.toHexString());
  assert.equal(review.comment, "Excelente");
});

test("createReview rejects a product outside the supplied store", async () => {
  mock.method(vendorRepository, "getVendorProfile", async () => ({
    vendor_id: vendorId,
    display_name: "Tienda Central",
    description: null,
    products: [],
  }));

  await assert.rejects(
    reviewsService.createReview(productId, vendorId, {
      rating: 5,
      comment: "Comentario",
    }),
    { status: 404 },
  );
});

test("createReview rejects invalid input", async () => {
  await assert.rejects(
    reviewsService.createReview("invalid", vendorId, {
      rating: 5,
      comment: "Comentario",
    }),
    { status: 400 },
  );

  await assert.rejects(
    reviewsService.createReview(productId, vendorId, {
      rating: 0,
      comment: "Comentario",
    }),
    { status: 400 },
  );

  await assert.rejects(
    reviewsService.createReview(productId, "invalid", {
      rating: 5,
      comment: "Comentario",
    }),
    { status: 400 },
  );

  await assert.rejects(
    reviewsService.createReview(productId, vendorId, {
      rating: 5,
      comment: " ",
    }),
    { status: 400 },
  );

  await assert.rejects(
    reviewsService.createReview(productId, vendorId, {
      rating: 5,
      comment: "a".repeat(1001),
    }),
    { status: 400 },
  );
});

test("getReviewsForModeration includes moderation status", async () => {
  mock.method(reviewsRepository, "findAllForModeration", async () => [{
    _id: reviewId,
    product_id: productId,
    vendor_id: vendorId,
    product_name: "Polo azul clasico",
    store_name: "Tienda Central",
    rating: 2,
    comment: "Contenido reportado",
    created_at: new Date("2026-06-28T00:00:00Z"),
    status: "removed" as const,
    moderated_at: new Date("2026-06-28T01:00:00Z"),
    moderated_by: adminId,
  }]);

  const reviews = await reviewsService.getReviewsForModeration();

  assert.equal(reviews[0]?.status, "removed");
  assert.equal(reviews[0]?.moderated_at, "2026-06-28T01:00:00.000Z");
  assert.equal(reviews[0]?.product_name, "Polo azul clasico");
  assert.equal(reviews[0]?.store_name, "Tienda Central");
  assert.equal("moderated_by" in (reviews[0] ?? {}), false);
});

test("getReviewsForModeration resolves names for legacy reviews", async () => {
  mock.method(reviewsRepository, "findAllForModeration", async () => [{
    _id: reviewId,
    product_id: productId,
    vendor_id: vendorId,
    rating: 3,
    comment: "Registro anterior",
    created_at: new Date("2026-06-28T00:00:00Z"),
  }]);
  mock.method(vendorRepository, "getVendorProfile", async () => ({
    vendor_id: vendorId,
    display_name: "Tienda Central",
    description: null,
    products: [{
      id: productId,
      name: "Polo azul clasico",
      description: null,
      image_url: null,
    }],
  }));

  const reviews = await reviewsService.getReviewsForModeration();

  assert.equal(reviews[0]?.status, "visible");
  assert.equal(reviews[0]?.moderated_at, null);
  assert.equal(reviews[0]?.product_name, "Polo azul clasico");
  assert.equal(reviews[0]?.store_name, "Tienda Central");
});

test("getReviewsForModeration uses safe labels when catalog lookup fails", async () => {
  mock.method(reviewsRepository, "findAllForModeration", async () => [{
    _id: reviewId,
    product_id: productId,
    vendor_id: vendorId,
    rating: 3,
    comment: "Registro sin catalogo",
    created_at: new Date("2026-06-28T00:00:00Z"),
  }]);
  mock.method(vendorRepository, "getVendorProfile", async () => {
    throw new Error("catalog unavailable");
  });

  const reviews = await reviewsService.getReviewsForModeration();

  assert.equal(reviews[0]?.product_name, "Producto no disponible");
  assert.equal(reviews[0]?.store_name, "Tienda no disponible");
});

test("getReviewsForVendor returns only safe store review fields", async () => {
  mock.method(reviewsRepository, "findByVendorId", async () => [{
    _id: reviewId,
    product_id: productId,
    vendor_id: vendorId,
    product_name: "Polo azul",
    store_name: "Tienda Central",
    rating: 4,
    comment: "Buena compra",
    created_at: new Date("2026-06-28T00:00:00Z"),
    status: "visible" as const,
  }]);

  const reviews = await reviewsService.getReviewsForVendor(vendorId);

  assert.equal(reviews[0]?.product_name, "Polo azul");
  assert.equal("moderated_by" in (reviews[0] ?? {}), false);
});

test("removeReview validates identifiers and handles missing reviews", async () => {
  await assert.rejects(
    reviewsService.removeReview("invalid", adminId),
    { status: 400 },
  );

  mock.method(reviewsRepository, "markRemoved", async () => false);
  await assert.rejects(
    reviewsService.removeReview(reviewId.toHexString(), adminId),
    { status: 404 },
  );
});

test("getReviewsByProduct and removeReview reject invalid identifiers", async () => {
  await assert.rejects(
    reviewsService.getReviewsByProduct("invalid"),
    { status: 400 },
  );

  await assert.rejects(
    reviewsService.removeReview(reviewId.toHexString(), "invalid"),
    { status: 403 },
  );
});

test("removeReview delegates a valid moderation request", async () => {
  let capturedAdminId = "";
  mock.method(reviewsRepository, "markRemoved", async (_reviewId, value) => {
    capturedAdminId = value;
    return true;
  });

  await reviewsService.removeReview(reviewId.toHexString(), adminId);

  assert.equal(capturedAdminId, adminId);
});

import assert from "node:assert/strict";
import test from "node:test";
import { ObjectId } from "mongodb";
import type { Review } from "./reviews.types.ts";

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://example.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "anon-key";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const { createReviewsRepository } = await import("./reviews.repository.ts");

const reviewId = new ObjectId();
const storedReview: Review = {
  _id: reviewId,
  product_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  vendor_id: "11111111-2222-3333-4444-555555555555",
  rating: 5,
  comment: "Excelente",
  created_at: new Date("2026-06-28T00:00:00Z"),
  status: "visible",
};

const createFakeDb = () => {
  const state: {
    filters: unknown[];
    update: unknown;
    indexes: unknown[];
  } = {
    filters: [],
    update: null,
    indexes: [],
  };

  const cursor = {
    sort() {
      return cursor;
    },
    limit() {
      return cursor;
    },
    async toArray() {
      return [storedReview];
    },
  };

  const collection = {
    async createIndex(index: unknown) {
      state.indexes.push(index);
      return "index";
    },
    find(filter: unknown) {
      state.filters.push(filter);
      return cursor;
    },
    async insertOne() {
      return { insertedId: reviewId };
    },
    async updateOne(filter: unknown, update: unknown) {
      state.filters.push(filter);
      state.update = update;
      return { matchedCount: 1 };
    },
  };

  return {
    state,
    db: {
      collection() {
        return collection;
      },
    },
  };
};

test("findByProductId hides removed reviews and creates indexes", async () => {
  const { db, state } = createFakeDb();
  const repository = createReviewsRepository(() => db as never);

  const reviews = await repository.findByProductId(storedReview.product_id);

  assert.equal(reviews.length, 1);
  assert.deepEqual(state.filters[0], {
    product_id: storedReview.product_id,
    status: { $ne: "removed" },
  });
  assert.equal(state.indexes.length, 3);
});

test("findAllForModeration returns stored reviews", async () => {
  const { db, state } = createFakeDb();
  const repository = createReviewsRepository(() => db as never);

  const reviews = await repository.findAllForModeration();

  assert.equal(reviews[0]?._id?.toHexString(), reviewId.toHexString());
  assert.deepEqual(state.filters[0], {});
});

test("findByVendorId returns visible reviews for one store", async () => {
  const { db, state } = createFakeDb();
  const repository = createReviewsRepository(() => db as never);

  const reviews = await repository.findByVendorId(storedReview.vendor_id);

  assert.equal(reviews.length, 1);
  assert.deepEqual(state.filters[0], {
    vendor_id: storedReview.vendor_id,
    status: { $ne: "removed" },
  });
});

test("insertOne returns the generated identifier", async () => {
  const { db } = createFakeDb();
  const repository = createReviewsRepository(() => db as never);

  const insertedId = await repository.insertOne(storedReview);

  assert.equal(insertedId, reviewId.toHexString());
});

test("markRemoved stores moderation metadata", async () => {
  const { db, state } = createFakeDb();
  const repository = createReviewsRepository(() => db as never);

  const removed = await repository.markRemoved(
    reviewId.toHexString(),
    "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  );

  assert.equal(removed, true);
  assert.deepEqual(state.filters[0], { _id: reviewId });
  assert.equal(
    (state.update as { $set: { status: string } }).$set.status,
    "removed",
  );
});

test("markRemoved returns false when the review does not exist", async () => {
  const { db } = createFakeDb();
  const collection = (db as { collection(): { updateOne: unknown } }).collection();
  collection.updateOne = async () => ({ matchedCount: 0 });
  const repository = createReviewsRepository(() => db as never);

  const removed = await repository.markRemoved(
    reviewId.toHexString(),
    "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  );

  assert.equal(removed, false);
});

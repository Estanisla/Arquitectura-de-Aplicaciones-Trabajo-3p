import { ObjectId, type Db } from "mongodb";
import { getMongoDb } from "../../lib/mongoClient.js";
import { type Review } from "./reviews.types.js";

const COLLECTION = "reviews";

type DbProvider = () => Db;

export const createReviewsRepository = (
  dbProvider: DbProvider = getMongoDb,
) => {
  let indexesReady: Promise<void> | null = null;

  const getCollection = async () => {
    const collection = dbProvider().collection<Review>(COLLECTION);

    if (!indexesReady) {
      indexesReady = Promise.all([
        collection.createIndex({ product_id: 1, created_at: -1 }),
        collection.createIndex({ vendor_id: 1 }),
        collection.createIndex({ status: 1, created_at: -1 }),
      ])
        .then(() => undefined)
        .catch((error: unknown) => {
          indexesReady = null;
          throw error;
        });
    }

    await indexesReady;
    return collection;
  };

  return {
    async findByProductId(productId: string): Promise<Review[]> {
      const collection = await getCollection();
      return collection
        .find({
          product_id: productId,
          status: { $ne: "removed" },
        })
        .sort({ created_at: -1 })
        .toArray();
    },

    async findAllForModeration(): Promise<Review[]> {
      const collection = await getCollection();
      return collection
        .find({})
        .sort({ created_at: -1 })
        .limit(200)
        .toArray();
    },

    async findByVendorId(vendorId: string): Promise<Review[]> {
      const collection = await getCollection();
      return collection
        .find({
          vendor_id: vendorId,
          status: { $ne: "removed" },
        })
        .sort({ created_at: -1 })
        .limit(200)
        .toArray();
    },

    async insertOne(review: Review): Promise<string> {
      const collection = await getCollection();
      const result = await collection.insertOne(review);
      return result.insertedId.toHexString();
    },

    async markRemoved(reviewId: string, adminId: string): Promise<boolean> {
      const collection = await getCollection();
      const result = await collection.updateOne(
        { _id: new ObjectId(reviewId) },
        {
          $set: {
            status: "removed",
            moderated_at: new Date(),
            moderated_by: adminId,
          },
        },
      );

      return result.matchedCount > 0;
    },
  };
};

export const reviewsRepository = createReviewsRepository();

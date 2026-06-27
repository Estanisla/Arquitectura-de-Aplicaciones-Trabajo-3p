import { type Review } from "./reviews.types.js";
import { getMongoDb } from "../../lib/mongoClient.js";

const COLLECTION = "reviews";

export const reviewsRepository = {
  async findByProductId(productId: string): Promise<Review[]> {
    const db = getMongoDb();
    const docs = await db
      .collection<Review>(COLLECTION)
      .find({ product_id: productId })
      .sort({ created_at: -1 })
      .toArray();
    return docs;
  },

  async insertOne(review: Review): Promise<string> {
    const db = getMongoDb();
    const result = await db.collection<Review>(COLLECTION).insertOne(review);
    return result.insertedId.toHexString();
  },
};

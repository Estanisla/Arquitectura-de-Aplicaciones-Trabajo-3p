import { AppError } from "../../shared/AppError.js";
import { reviewsRepository } from "./reviews.repository.js";
import type { CreateReviewRequest, ReviewResponse } from "./reviews.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toReviewResponse = (review: {
  _id?: { toHexString(): string };
  product_id: string;
  vendor_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}): ReviewResponse => ({
  id: review._id?.toHexString() ?? "",
  product_id: review.product_id,
  vendor_id: review.vendor_id,
  rating: review.rating,
  comment: review.comment,
  created_at: review.created_at.toISOString(),
});

export const reviewsService = {
  async getReviewsByProduct(productId: string): Promise<ReviewResponse[]> {
    if (!UUID_REGEX.test(productId)) {
      throw new AppError("ID de producto invalido", 400);
    }

    const reviews = await reviewsRepository.findByProductId(productId);
    return reviews.map(toReviewResponse);
  },

  async createReview(
    productId: string,
    vendorId: string,
    body: CreateReviewRequest,
  ): Promise<ReviewResponse> {
    const { rating, comment } = body;

    if (!UUID_REGEX.test(productId)) {
      throw new AppError("ID de producto invalido", 400);
    }

    if (!UUID_REGEX.test(vendorId)) {
      throw new AppError("ID de vendedor invalido", 400);
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError("La calificacion debe ser un numero entero entre 1 y 5", 400);
    }

    const trimmedComment = (comment ?? "").trim();
    if (!trimmedComment) {
      throw new AppError("El comentario es requerido", 400);
    }
    if (trimmedComment.length > 1000) {
      throw new AppError("El comentario no puede exceder los 1000 caracteres", 400);
    }

    const review = {
      product_id: productId,
      vendor_id: vendorId,
      rating,
      comment: trimmedComment,
      created_at: new Date(),
    };

    const insertedId = await reviewsRepository.insertOne(review);

    return toReviewResponse({ ...review, _id: { toHexString: () => insertedId } });
  },
};

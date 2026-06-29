import { ObjectId } from "mongodb";
import { AppError } from "../../shared/AppError.js";
import { vendorRepository } from "../vendors/vendor.repository.js";
import { reviewsRepository } from "./reviews.repository.js";
import type {
  CreateReviewRequest,
  ModeratedReviewResponse,
  Review,
  ReviewResponse,
  VendorReviewResponse,
} from "./reviews.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toReviewResponse = (review: Review): ReviewResponse => ({
  id: review._id?.toHexString() ?? "",
  product_id: review.product_id,
  vendor_id: review.vendor_id,
  rating: review.rating,
  comment: review.comment,
  created_at: review.created_at.toISOString(),
});

const toModeratedReviewResponse = (
  review: Review,
  productName: string,
  storeName: string,
): ModeratedReviewResponse => ({
  ...toReviewResponse(review),
  product_name: productName,
  store_name: storeName,
  status: review.status ?? "visible",
  moderated_at: review.moderated_at?.toISOString() ?? null,
});

const resolveReviewNames = async (
  reviews: Review[],
): Promise<Map<string, { productName: string; storeName: string }>> => {
  const unresolvedVendorIds = Array.from(new Set(
    reviews
      .filter((review) => !review.product_name || !review.store_name)
      .map((review) => review.vendor_id),
  ));

  const profiles = await Promise.all(
    unresolvedVendorIds.map(async (vendorId) => {
      try {
        return [vendorId, await vendorRepository.getVendorProfile(vendorId)] as const;
      } catch {
        return [vendorId, null] as const;
      }
    }),
  );

  const profilesByVendor = new Map(profiles);
  const namesByReview = new Map<string, {
    productName: string;
    storeName: string;
  }>();

  for (const review of reviews) {
    const profile = profilesByVendor.get(review.vendor_id);
    const product = profile?.products.find(
      (candidate) => candidate.id === review.product_id,
    );

    namesByReview.set(review._id?.toHexString() ?? "", {
      productName:
        review.product_name ?? product?.name ?? "Producto no disponible",
      storeName:
        review.store_name ?? profile?.display_name ?? "Tienda no disponible",
    });
  }

  return namesByReview;
};

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

    const vendor = await vendorRepository.getVendorProfile(vendorId);
    const product = vendor?.products.find((candidate) => candidate.id === productId);
    if (!vendor || !product) {
      throw new AppError("Producto no encontrado", 404);
    }

    const review: Review = {
      product_id: productId,
      vendor_id: vendorId,
      product_name: product.name,
      store_name: vendor.display_name,
      rating,
      comment: trimmedComment,
      created_at: new Date(),
      status: "visible",
    };

    const insertedId = await reviewsRepository.insertOne(review);

    return {
      ...toReviewResponse(review),
      id: insertedId,
    };
  },

  async getReviewsForModeration(): Promise<ModeratedReviewResponse[]> {
    const reviews = await reviewsRepository.findAllForModeration();
    const namesByReview = await resolveReviewNames(reviews);

    return reviews.map((review) => {
      const names = namesByReview.get(review._id?.toHexString() ?? "");
      return toModeratedReviewResponse(
        review,
        names?.productName ?? "Producto no disponible",
        names?.storeName ?? "Tienda no disponible",
      );
    });
  },

  async getReviewsForVendor(vendorId: string): Promise<VendorReviewResponse[]> {
    if (!UUID_REGEX.test(vendorId)) {
      throw new AppError("ID de vendedor invalido", 400);
    }

    const reviews = await reviewsRepository.findByVendorId(vendorId);
    const namesByReview = await resolveReviewNames(reviews);
    return reviews.map((review) => ({
      ...toReviewResponse(review),
      product_name:
        namesByReview.get(review._id?.toHexString() ?? "")?.productName
        ?? "Producto no disponible",
    }));
  },

  async removeReview(reviewId: string, adminId: string): Promise<void> {
    if (!ObjectId.isValid(reviewId)) {
      throw new AppError("Solicitud invalida", 400);
    }

    if (!UUID_REGEX.test(adminId)) {
      throw new AppError("No autorizado", 403);
    }

    const removed = await reviewsRepository.markRemoved(reviewId, adminId);
    if (!removed) {
      throw new AppError("Resena no encontrada", 404);
    }
  },
};

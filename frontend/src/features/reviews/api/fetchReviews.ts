import type { Review, CreateReviewInput } from "../reviews.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function fetchReviews(productId: string): Promise<Review[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/reviews`
  );

  if (!response.ok) {
    throw new Error("No se pudieron cargar las reseñas de este producto.");
  }

  const data = await response.json();
  return data.reviews as Review[];
}

export async function createReview(
  productId: string,
  input: CreateReviewInput
): Promise<Review> {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo publicar la reseña.");
  }

  const data = await response.json();
  return data.review as Review;
}

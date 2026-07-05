export interface Review {
  id: string;
  productId: string;
  authorName: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  authorName?: string;
  rating: number;
  comment: string;
}

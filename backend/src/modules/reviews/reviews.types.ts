import type { ObjectId } from "mongodb";

export type ReviewStatus = "visible" | "removed";

export type Review = {
  _id?: ObjectId;
  product_id: string;
  vendor_id: string;
  product_name?: string;
  store_name?: string;
  rating: number;
  comment: string;
  created_at: Date;
  status?: ReviewStatus;
  moderated_at?: Date;
  moderated_by?: string;
};

export type ReviewResponse = {
  id: string;
  product_id: string;
  vendor_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export type ModeratedReviewResponse = ReviewResponse & {
  product_name: string;
  store_name: string;
  status: ReviewStatus;
  moderated_at: string | null;
};

export type VendorReviewResponse = ReviewResponse & {
  product_name: string;
};

export type CreateReviewRequest = {
  rating: number;
  comment: string;
};

export type ReviewListResponse = {
  ok: boolean;
  data: ReviewResponse[];
  message?: string;
};

export type CreateReviewResponse = {
  ok: boolean;
  message: string;
  data?: ReviewResponse;
};

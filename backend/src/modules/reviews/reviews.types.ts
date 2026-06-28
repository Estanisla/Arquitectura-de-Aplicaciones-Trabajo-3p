import type { ObjectId } from "mongodb";

export type Review = {
  _id?: ObjectId;
  product_id: string;
  vendor_id: string;
  rating: number;
  comment: string;
  created_at: Date;
};

export type ReviewResponse = {
  id: string;
  product_id: string;
  vendor_id: string;
  rating: number;
  comment: string;
  created_at: string;
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

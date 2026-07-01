import { Router } from "express";
import { reviewsController } from "./reviews.controller.js";

export const reviewsRouter = Router();
export const adminReviewsRouter = Router();

reviewsRouter.get("/:productId/reviews", reviewsController.getProductReviews);
reviewsRouter.post("/:productId/reviews", reviewsController.createProductReview);

adminReviewsRouter.get("/", reviewsController.listReviewsForModeration);
adminReviewsRouter.delete("/:reviewId", reviewsController.removeReview);

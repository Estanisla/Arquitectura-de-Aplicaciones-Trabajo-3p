import { Router } from "express";
import { reviewsController } from "./reviews.controller.js";

export const reviewsRouter = Router();

reviewsRouter.get("/:productId/reviews", reviewsController.getProductReviews);
reviewsRouter.post("/:productId/reviews", reviewsController.createProductReview);

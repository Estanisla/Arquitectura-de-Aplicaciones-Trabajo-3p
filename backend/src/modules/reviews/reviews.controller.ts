import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import { reviewsService } from "./reviews.service.js";

type CreateReviewBody = {
  vendor_id?: string;
  rating?: number;
  comment?: string;
};

export const reviewsController = {
  async getProductReviews(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId ?? "");
      const reviews = await reviewsService.getReviewsByProduct(productId);
      return res.status(200).json({ ok: true, data: reviews });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno del servidor" });
    }
  },

  async createProductReview(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId ?? "");
      const { vendor_id, rating, comment } = req.body as CreateReviewBody;

      const result = await reviewsService.createReview(productId, vendor_id ?? "", {
        rating: rating ?? 0,
        comment: comment ?? "",
      });

      return res.status(201).json({ ok: true, message: "Review creada exitosamente", data: result });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno del servidor" });
    }
  },
};

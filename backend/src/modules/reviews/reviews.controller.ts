import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import {
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
} from "../auth/auth.session.js";
import { reviewsService } from "./reviews.service.js";

type CreateReviewBody = {
  vendor_id?: string;
  rating?: number;
  comment?: string;
};

const publicErrorMessage = (status: number): string => {
  if (status === 400) return "Solicitud invalida";
  if (status === 401 || status === 403) return "No autorizado";
  if (status === 404) return "Recurso no encontrado";
  return "No se pudo completar la solicitud";
};

const sendError = (res: Response, error: unknown) => {
  if (error instanceof AppError) {
    return res
      .status(error.status)
      .json({ ok: false, message: publicErrorMessage(error.status) });
  }

  return res
    .status(500)
    .json({ ok: false, message: "No se pudo completar la solicitud" });
};

const requireAdmin = (req: Request, res: Response): string | null => {
  const userId = readSessionUserIdFromRequest(req);
  const role = readSessionRoleFromRequest(req);

  if (!userId || role !== "admin") {
    res.status(403).json({ ok: false, message: "No autorizado" });
    return null;
  }

  return userId;
};

export const reviewsController = {
  async getProductReviews(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId ?? "");
      const reviews = await reviewsService.getReviewsByProduct(productId);
      return res.status(200).json({ ok: true, data: reviews });
    } catch (error) {
      return sendError(res, error);
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
      return sendError(res, error);
    }
  },

  async listReviewsForModeration(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const reviews = await reviewsService.getReviewsForModeration();
      return res.status(200).json({ ok: true, data: reviews });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async removeReview(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const reviewId = String(req.params.reviewId ?? "");
      await reviewsService.removeReview(reviewId, adminId);
      return res
        .status(200)
        .json({ ok: true, message: "Resena eliminada correctamente" });
    } catch (error) {
      return sendError(res, error);
    }
  },
};

import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import { reviewsService } from "../reviews/reviews.service.js";
import { vendorService } from "./vendor.service.js";

export const vendorController = {
  async list(_req: Request, res: Response) {
    try {
      const vendors = await vendorService.listVendors();
      return res.status(200).json({ vendors });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno" });
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const vendorId = req.params.vendorId as string;
      const vendor = await vendorService.getVendorProfile(vendorId);
      return res.status(200).json({ vendor });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno" });
    }
  },

  async getReviews(req: Request, res: Response) {
    try {
      const vendorId = req.params.vendorId as string;
      const reviews = await reviewsService.getReviewsForVendor(vendorId);
      return res.status(200).json({ ok: true, data: reviews });
    } catch (error) {
      if (error instanceof AppError) {
        return res
          .status(error.status)
          .json({ ok: false, message: error.message });
      }
      return res
        .status(500)
        .json({ ok: false, message: "No se pudo cargar las resenas" });
    }
  },
};

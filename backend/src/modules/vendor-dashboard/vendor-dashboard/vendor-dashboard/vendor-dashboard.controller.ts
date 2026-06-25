import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import { vendorDashboardService } from "./vendor-dashboard.service.js";

export const vendorDashboardController = {
  async getMyProfile(req: Request, res: Response) {
    try {
      const userId = req.vendorUserId as string;
      const profile = await vendorDashboardService.getMyProfile(userId);
      return res.status(200).json({ vendor: profile });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno" });
    }
  },
};

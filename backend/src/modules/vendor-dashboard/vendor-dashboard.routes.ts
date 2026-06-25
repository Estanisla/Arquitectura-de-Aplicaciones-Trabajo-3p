import { Router } from "express";
import { requireVendorSession } from "../../shared/requireVendorSession.js";
import { vendorDashboardController } from "./vendor-dashboard.controller.js";

export const vendorDashboardRouter = Router();

vendorDashboardRouter.get("/me", requireVendorSession, vendorDashboardController.getMyProfile);

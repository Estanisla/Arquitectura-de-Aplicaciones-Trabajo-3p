import { Router } from "express";
import { requireVendorSession } from "../../shared/requireVendorSession.js";
import { vendorDashboardController } from "./vendor-dashboard.controller.js";

export const vendorDashboardRouter = Router();

vendorDashboardRouter.use(requireVendorSession);
vendorDashboardRouter.get("/me", vendorDashboardController.getMyProfile);
vendorDashboardRouter.get("/stores", vendorDashboardController.listStores);
vendorDashboardRouter.get("/stores/:storeId", vendorDashboardController.getStore);
vendorDashboardRouter.patch("/stores/:storeId", vendorDashboardController.updateStore);
vendorDashboardRouter.put(
  "/stores/:storeId/contacts",
  vendorDashboardController.updateContacts,
);
vendorDashboardRouter.post(
  "/stores/:storeId/products",
  vendorDashboardController.createProduct,
);
vendorDashboardRouter.get(
  "/stores/:storeId/reviews",
  vendorDashboardController.getStoreReviews,
);
vendorDashboardRouter.put(
  "/products/:productId",
  vendorDashboardController.updateProduct,
);
vendorDashboardRouter.delete(
  "/products/:productId",
  vendorDashboardController.removeProduct,
);

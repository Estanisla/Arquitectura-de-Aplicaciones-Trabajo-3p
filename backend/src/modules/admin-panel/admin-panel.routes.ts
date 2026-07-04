import { Router } from "express";
import { adminPanelController } from "./admin-panel.controller.js";

export const adminPanelRouter = Router();

adminPanelRouter.post("/vendors", adminPanelController.createVendor);
adminPanelRouter.get("/vendors", adminPanelController.listVendors);
adminPanelRouter.patch("/vendors/:vendorId/deactivate", adminPanelController.deactivateVendor);
adminPanelRouter.delete("/users/:userId", adminPanelController.hardDeleteUser);

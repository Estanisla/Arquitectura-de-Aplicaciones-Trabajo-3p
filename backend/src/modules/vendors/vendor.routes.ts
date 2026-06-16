import { Router } from "express";
import { vendorController } from "./vendor.controller.js";

export const vendorRouter = Router();

vendorRouter.get("/", vendorController.list);
vendorRouter.get("/:vendorId", vendorController.getProfile);

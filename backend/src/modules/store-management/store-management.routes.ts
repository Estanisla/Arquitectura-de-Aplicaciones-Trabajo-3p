import { Router } from "express";
import { storeManagementController } from "./store-management.controller.js";

export const storeManagementRouter = Router();

storeManagementRouter.get("/", storeManagementController.listStores);
storeManagementRouter.post("/", storeManagementController.createStore);
storeManagementRouter.post(
  "/:storeId/members",
  storeManagementController.addMember,
);
storeManagementRouter.patch(
  "/:storeId/members/:username",
  storeManagementController.setMemberActive,
);
storeManagementRouter.put(
  "/:storeId/contacts",
  storeManagementController.updateContacts,
);

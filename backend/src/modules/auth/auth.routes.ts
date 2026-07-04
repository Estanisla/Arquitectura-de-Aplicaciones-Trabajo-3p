import { Router } from "express";
import { authController } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/admin/login", authController.adminLogin);
authRouter.post("/register", authController.register);
authRouter.post("/change-password", authController.changePassword);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.get("/session", authController.session);
authRouter.post("/logout", authController.logout);

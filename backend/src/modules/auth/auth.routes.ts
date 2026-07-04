import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authRateLimit } from "./auth.rate-limit.js";

export const authRouter = Router();

authRouter.post("/login", authRateLimit, authController.login);
authRouter.post("/admin/login", authRateLimit, authController.adminLogin);
authRouter.post("/register", authController.register);
authRouter.post("/change-password", authController.changePassword);
authRouter.get("/session", authController.session);
authRouter.post("/logout", authController.logout);

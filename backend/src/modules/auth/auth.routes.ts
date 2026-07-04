import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authRateLimit } from "./auth.rate-limit.js";

export const authRouter = Router();

// Every POST endpoint on the auth surface is guarded by the shared
// IP-based rate limiter. Credential-guessing paths (login, admin login,
// register) are the obvious targets, but change-password and logout
// stay on the list too — they touch auth state and there is no
// legitimate reason to hit them 5+ times in half an hour.
authRouter.post("/login", authRateLimit, authController.login);
authRouter.post("/admin/login", authRateLimit, authController.adminLogin);
authRouter.post("/register", authRateLimit, authController.register);
authRouter.post("/change-password", authRateLimit, authController.changePassword);
authRouter.get("/session", authController.session);
authRouter.post("/logout", authRateLimit, authController.logout);

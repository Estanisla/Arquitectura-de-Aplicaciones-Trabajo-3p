import { Router } from "express";
import { authController } from "./auth.controller.js";
export const authRouter = Router();
authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);
authRouter.get("/session", authController.session);
authRouter.post("/logout", authController.logout);
//# sourceMappingURL=auth.routes.js.map
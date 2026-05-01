import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

type LoginBody = {
  username?: string;
  password?: string;
};

export const authController = {
  async login(req: Request<unknown, unknown, LoginBody>, res: Response) {
    try {
      const result = await authService.login({
        username: req.body.username ?? "",
        password: req.body.password ?? "",
      });

      if (!result.ok) {
        return res.status(401).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown login error";
      return res.status(500).json({ ok: false, message });
    }
  },
};

import type { Request, Response } from "express";
import {
  clearSessionCookie,
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
  setSessionCookie,
} from "./auth.session.js";
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

      if (result.user_id) {
        setSessionCookie(res, result.user_id, "vendor");
      }

      return res.status(200).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown login error";
      return res.status(500).json({ ok: false, message });
    }
  },

  async register(req: Request<unknown, unknown, LoginBody>, res: Response) {
    try {
      const result = await authService.register({
        username: req.body.username ?? "",
        password: req.body.password ?? "",
      });

      if (!result.ok) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown register error";
      return res.status(500).json({ ok: false, message });
    }
  },

  session(req: Request, res: Response) {
    const userId = readSessionUserIdFromRequest(req);
    const role = readSessionRoleFromRequest(req);

    if (!userId || !role) {
      return res.status(200).json({
        ok: true,
        authenticated: false,
        message: "Sin sesion activa",
      });
    }

    return res.status(200).json({
      ok: true,
      authenticated: true,
      message: "Sesion activa",
      user_id: userId,
      role,
    });
  },

  logout(_req: Request, res: Response) {
    clearSessionCookie(res);
    return res
      .status(200)
      .json({ ok: true, message: "Sesion cerrada", authenticated: false });
  },
};

import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
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

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
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
      setSessionCookie(res, result.user_id!, "vendor");
      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ ok: false, message: "No se pudo iniciar sesion" });
    }
  },

  async adminLogin(req: Request<unknown, unknown, LoginBody>, res: Response) {
    try {
      const result = await authService.adminLogin({
        username: req.body.username ?? "",
        password: req.body.password ?? "",
      });
      if (!result.ok) {
        return res.status(401).json(result);
      }
      setSessionCookie(res, result.admin_id!, "admin");
      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ ok: false, message: "No se pudo iniciar sesion" });
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
    } catch {
      return res.status(500).json({ ok: false, message: "No se pudo completar el registro" });
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

  async changePassword(
    req: Request,
    res: Response,
  ) {
    try {
      const userId = readSessionUserIdFromRequest(req);

      if (!userId) {
        return res.status(401).json({ ok: false, message: "Sesion no valida" });
      }

      const body = req.body as ChangePasswordBody;

      await authService.changePassword(
        userId,
        body.currentPassword ?? "",
        body.newPassword ?? "",
      );

      return res.status(200).json({ ok: true, message: "Contrasena actualizada correctamente" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "No se pudo cambiar la contrasena" });
    }
  },
};

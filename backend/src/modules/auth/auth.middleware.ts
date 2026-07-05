import type { Request, Response, NextFunction } from "express";
import {
  readSessionUserIdFromRequest,
  readSessionRoleFromRequest,
} from "./auth.session.js";
import type { AuthRole } from "./auth.types.js";

export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = readSessionUserIdFromRequest(req);
    const role = readSessionRoleFromRequest(req);

    if (!userId || !role) {
      res.status(401).json({
        ok: false,
        message: "No autenticado",
        authenticated: false,
      });
      return;
    }

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(" / ")}`,
      });
      return;
    }

    req.user = { sub: userId, role };
    next();
  };
}

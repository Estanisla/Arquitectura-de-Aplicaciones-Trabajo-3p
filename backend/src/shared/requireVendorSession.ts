import type { NextFunction, Request, Response } from "express";
import {
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
} from "../modules/auth/auth.session.js";

export const requireVendorSession = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const userId = readSessionUserIdFromRequest(req);
  const role = readSessionRoleFromRequest(req);

  if (!userId || role !== "vendor") {
    res.status(401).json({ ok: false, message: "Sesion de vendedor requerida" });
    return;
  }

  req.vendorUserId = userId;
  next();
};

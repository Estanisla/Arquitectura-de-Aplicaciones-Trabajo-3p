import type { Request, Response } from "express";
import {
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
} from "../modules/auth/auth.session.js";

/**
 * Sync guard for admin-only controller handlers. Returns the admin user id
 * on success or null after sending a 403 response. Kept as a function
 * (not an Express middleware) to preserve the current pattern where each
 * handler decides how to short-circuit on unauthorized access.
 */
export const requireAdmin = (req: Request, res: Response): string | null => {
  const userId = readSessionUserIdFromRequest(req);
  const role = readSessionRoleFromRequest(req);

  if (!userId || role !== "admin") {
    res.status(403).json({ ok: false, message: "No autorizado" });
    return null;
  }

  return userId;
};

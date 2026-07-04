import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import {
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
} from "../auth/auth.session.js";
import { adminPanelService } from "./admin-panel.service.js";

const requireAdmin = (
  req: Request,
  res: Response,
): string | null => {
  const userId = readSessionUserIdFromRequest(req);
  const role = readSessionRoleFromRequest(req);

  if (!userId || !role) {
    res.status(403).json({ ok: false, message: "No autorizado" });
    return null;
  }

  if (role !== "admin") {
    res.status(403).json({ ok: false, message: "Se requieren permisos de administrador" });
    return null;
  }

  return userId;
};

export const adminPanelController = {
  async createVendor(req: Request, res: Response) {
    try {
      const adminId = requireAdmin(req, res);
      if (!adminId) return;

      const result = await adminPanelService.createVendor(adminId, {
        username: req.body.username ?? "",
        tempPassword: req.body.tempPassword ?? "",
        displayName: req.body.displayName ?? "",
        description: req.body.description,
      });

      return res.status(201).json({
        userId: result.userId,
        vendorId: result.vendorId,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno" });
    }
  },

  async listVendors(req: Request, res: Response) {
    try {
      const adminId = requireAdmin(req, res);
      if (!adminId) return;

      const vendors = await adminPanelService.listVendors(adminId);

      return res.status(200).json({ vendors });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno" });
    }
  },

  async deactivateVendor(req: Request, res: Response) {
    try {
      const adminId = requireAdmin(req, res);
      if (!adminId) return;

      await adminPanelService.deactivateVendor(
        adminId,
        req.params.vendorId as string,
      );

      return res.status(200).json({ ok: true, message: "Tienda desactivada" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno" });
    }
  },

  async hardDeleteUser(req: Request, res: Response) {
    try {
      const adminId = requireAdmin(req, res);
      if (!adminId) return;

      const body = req.body as { reason?: string; confirm?: string };
      if (body.confirm !== "ELIMINAR") {
        return res.status(400).json({
          ok: false,
          message: 'Confirma la accion enviando confirm="ELIMINAR"',
        });
      }

      await adminPanelService.hardDeleteUser(
        adminId,
        req.params.userId as string,
        body.reason ?? "",
      );

      return res
        .status(200)
        .json({ ok: true, message: "Usuario eliminado (hard)" });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.status).json({ ok: false, message: error.message });
      }
      return res.status(500).json({ ok: false, message: "Error interno" });
    }
  },
};

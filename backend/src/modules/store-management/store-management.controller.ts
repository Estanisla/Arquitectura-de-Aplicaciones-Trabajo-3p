import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import {
  readSessionRoleFromRequest,
  readSessionUserIdFromRequest,
} from "../auth/auth.session.js";
import { storeManagementService } from "./store-management.service.js";
import type { CreateManagedStoreInput } from "./store-management.types.js";

const requireAdmin = (req: Request, res: Response): string | null => {
  const adminId = readSessionUserIdFromRequest(req);
  const role = readSessionRoleFromRequest(req);

  if (!adminId || role !== "admin") {
    res.status(403).json({ ok: false, message: "No autorizado" });
    return null;
  }

  return adminId;
};

const sendError = (res: Response, error: unknown) => {
  if (error instanceof AppError) {
    const message = error.status === 409
      ? "La tienda o uno de sus usuarios ya existe"
      : "Solicitud invalida";
    return res.status(error.status).json({ ok: false, message });
  }

  return res
    .status(500)
    .json({ ok: false, message: "No se pudo completar la solicitud" });
};

export const storeManagementController = {
  async createStore(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const result = await storeManagementService.createStore(
        adminId,
        req.body as CreateManagedStoreInput,
      );
      return res.status(201).json({
        ok: true,
        message: "Tienda y usuarios creados correctamente",
        storeId: result.storeId,
        emporiumName: result.emporiumName,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async listStores(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const result = await storeManagementService.listStores(adminId);
      return res.status(200).json({ ok: true, data: result });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async addMember(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const body = req.body as { username?: string; tempPassword?: string };
      await storeManagementService.addMember(
        adminId,
        String(req.params.storeId ?? ""),
        body.username ?? "",
        body.tempPassword ?? "",
      );
      return res
        .status(201)
        .json({ ok: true, message: "Usuario agregado correctamente" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async setMemberActive(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const body = req.body as { isActive?: boolean };
      await storeManagementService.setMemberActive(
        adminId,
        String(req.params.storeId ?? ""),
        String(req.params.username ?? ""),
        body.isActive as boolean,
      );
      return res
        .status(200)
        .json({ ok: true, message: "Usuario actualizado correctamente" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async updateContacts(req: Request, res: Response) {
    const adminId = requireAdmin(req, res);
    if (!adminId) return;

    try {
      const body = req.body as {
        contacts?: CreateManagedStoreInput["contacts"];
      };
      await storeManagementService.updateContacts(
        adminId,
        String(req.params.storeId ?? ""),
        body.contacts ?? [],
      );
      return res
        .status(200)
        .json({ ok: true, message: "Contactos actualizados correctamente" });
    } catch (error) {
      return sendError(res, error);
    }
  },
};

import type { Request, Response } from "express";
import { AppError } from "../../shared/AppError.js";
import { vendorDashboardService } from "./vendor-dashboard.service.js";
import type {
  ProductInput,
  StoreContact,
  UpdateStoreProfileInput,
} from "./vendor-dashboard.types.js";

const sendError = (res: Response, error: unknown) => {
  if (error instanceof AppError) {
    const message = error.status === 404
      ? "Recurso no encontrado"
      : "Solicitud invalida";
    return res.status(error.status).json({ ok: false, message });
  }
  return res
    .status(500)
    .json({ ok: false, message: "No se pudo completar la solicitud" });
};

const getUserId = (req: Request): string => req.vendorUserId as string;

export const vendorDashboardController = {
  async listStores(req: Request, res: Response) {
    try {
      const stores = await vendorDashboardService.listManagedStores(
        getUserId(req),
      );
      return res.status(200).json({ ok: true, data: stores });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getStore(req: Request, res: Response) {
    try {
      const store = await vendorDashboardService.getStoreDashboard(
        getUserId(req),
        String(req.params.storeId ?? ""),
      );
      return res.status(200).json({ ok: true, data: store });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getMyProfile(req: Request, res: Response) {
    try {
      const profile = await vendorDashboardService.getMyProfile(getUserId(req));
      return res.status(200).json({ ok: true, data: profile, vendor: profile });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async updateStore(req: Request, res: Response) {
    try {
      await vendorDashboardService.updateStoreProfile(
        getUserId(req),
        String(req.params.storeId ?? ""),
        req.body as UpdateStoreProfileInput,
      );
      return res.status(200).json({ ok: true, message: "Tienda actualizada" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async updateContacts(req: Request, res: Response) {
    try {
      const contacts = (req.body as { contacts?: StoreContact[] }).contacts ?? [];
      await vendorDashboardService.updateStoreContacts(
        getUserId(req),
        String(req.params.storeId ?? ""),
        contacts,
      );
      return res.status(200).json({ ok: true, message: "Contactos actualizados" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async createProduct(req: Request, res: Response) {
    try {
      const productId = await vendorDashboardService.createProduct(
        getUserId(req),
        String(req.params.storeId ?? ""),
        req.body as ProductInput,
      );
      return res.status(201).json({
        ok: true,
        message: "Producto creado",
        productId,
      });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      await vendorDashboardService.updateProduct(
        getUserId(req),
        String(req.params.productId ?? ""),
        req.body as ProductInput,
      );
      return res.status(200).json({ ok: true, message: "Producto actualizado" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async removeProduct(req: Request, res: Response) {
    try {
      await vendorDashboardService.removeProduct(
        getUserId(req),
        String(req.params.productId ?? ""),
      );
      return res.status(200).json({ ok: true, message: "Producto retirado" });
    } catch (error) {
      return sendError(res, error);
    }
  },

  async getStoreReviews(req: Request, res: Response) {
    try {
      const reviews = await vendorDashboardService.getStoreReviews(
        getUserId(req),
        String(req.params.storeId ?? ""),
      );
      return res.status(200).json({ ok: true, data: reviews });
    } catch (error) {
      return sendError(res, error);
    }
  },
};

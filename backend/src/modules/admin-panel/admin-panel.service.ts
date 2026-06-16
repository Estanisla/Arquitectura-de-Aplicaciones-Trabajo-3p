import { AppError } from "../../shared/AppError.js";
import { adminPanelRepository } from "./admin-panel.repository.js";
import type { CreateVendorInput, VendorRow } from "./admin-panel.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const adminPanelService = {
  async createVendor(
    adminId: string,
    input: CreateVendorInput,
  ): Promise<{ userId: string; vendorId: string }> {
    if (!UUID_REGEX.test(adminId)) {
      throw new AppError("ID de admin invalido", 400);
    }

    if (!input.username || input.username.trim().length === 0) {
      throw new AppError("username requerido", 400);
    }

    if (!input.tempPassword || input.tempPassword.length < 6) {
      throw new AppError("La contrasena temporal debe tener al menos 6 caracteres", 400);
    }

    if (!input.displayName || input.displayName.trim().length < 2) {
      throw new AppError("display_name minimo 2 caracteres", 400);
    }

    const result = await adminPanelRepository.createVendor(adminId, {
      ...input,
      username: input.username.trim(),
      displayName: input.displayName.trim(),
    });

    if (!result.ok) {
      if (result.message?.includes("ya existe")) {
        throw new AppError(result.message, 409);
      }
      throw new AppError(result.message ?? "Error al crear vendedor", 400);
    }

    return {
      userId: result.user_id!,
      vendorId: result.vendor_id!,
    };
  },

  async listVendors(adminId: string): Promise<VendorRow[]> {
    if (!UUID_REGEX.test(adminId)) {
      throw new AppError("ID de admin invalido", 400);
    }

    return adminPanelRepository.listVendors(adminId);
  },

  async deactivateVendor(adminId: string, vendorId: string): Promise<void> {
    if (!UUID_REGEX.test(adminId)) {
      throw new AppError("ID de admin invalido", 400);
    }

    if (!UUID_REGEX.test(vendorId)) {
      throw new AppError("ID de vendedor invalido", 400);
    }

    const result = await adminPanelRepository.deactivateVendor(adminId, vendorId);

    if (!result.ok) {
      if (result.message?.includes("no encontrado")) {
        throw new AppError(result.message, 404);
      }
      if (result.message?.includes("no autorizado")) {
        throw new AppError(result.message, 403);
      }
      throw new AppError(result.message ?? "Error al desactivar tienda", 400);
    }
  },
};

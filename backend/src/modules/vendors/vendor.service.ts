import { AppError } from "../../shared/AppError.js";
import { vendorRepository } from "./vendor.repository.js";
import type { VendorListItem, VendorProfile } from "./vendor.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const vendorService = {
  /**
   * Retorna la lista de vendedores disponibles
   * @returns Un arreglo con los vendedores más recientes
   */
  async listVendors(): Promise<VendorListItem[]> {
    return vendorRepository.getVendorList(4);
  },

  /**
   * Obtiene el perfil de un vendedor por su ID
   * @param vendorId - UUID del vendedor
   * @throws AppError 400 si el ID no es un UUID válido
   * @throws AppError 404 si el vendedor no existe
   */
  async getVendorProfile(vendorId: string): Promise<VendorProfile> {
    if (!UUID_REGEX.test(vendorId)) {
      throw new AppError("ID de vendedor invalido", 400);
    }

    const profile = await vendorRepository.getVendorProfile(vendorId);

    if (!profile) {
      throw new AppError("Vendedor no encontrado", 404);
    }

    return profile;
  },
};

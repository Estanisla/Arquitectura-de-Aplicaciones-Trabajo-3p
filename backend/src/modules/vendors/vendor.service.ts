import { AppError } from "../../shared/AppError.js";
import { vendorRepository } from "./vendor.repository.js";
import type { VendorListItem, VendorProfile } from "./vendor.types.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const vendorService = {
  async listVendors(): Promise<VendorListItem[]> {
    return vendorRepository.getVendorList(4);
  },

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

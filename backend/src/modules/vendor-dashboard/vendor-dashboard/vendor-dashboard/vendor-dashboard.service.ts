import { AppError } from "../../shared/AppError.js";
import { vendorDashboardRepository } from "./vendor-dashboard.repository.js";
import type { MyVendorProfile } from "./vendor-dashboard.types.js";

export const vendorDashboardService = {
  async getMyProfile(userId: string): Promise<MyVendorProfile> {
    const profile = await vendorDashboardRepository.getMyVendorProfile(userId);

    if (!profile) {
      throw new AppError("Tienda no encontrada para este vendedor", 404);
    }

    return profile;
  },
};

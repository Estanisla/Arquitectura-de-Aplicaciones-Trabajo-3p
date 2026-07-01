import { AppError } from "../../shared/AppError.js";
import { reviewsService } from "../reviews/reviews.service.js";
import { vendorDashboardRepository } from "./vendor-dashboard.repository.js";
import type {
  ManagedStoreSummary,
  MyVendorProfile,
  ProductInput,
  StoreContact,
  StoreContactChannel,
  UpdateStoreProfileInput,
} from "./vendor-dashboard.types.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTACT_CHANNELS = new Set<StoreContactChannel>([
  "whatsapp",
  "instagram",
  "facebook",
  "email",
  "website",
]);

const validateUuid = (value: string) => {
  if (!UUID_REGEX.test(value)) {
    throw new AppError("Solicitud invalida", 400);
  }
};

const normalizeProfile = (
  input: UpdateStoreProfileInput,
): UpdateStoreProfileInput => {
  const displayName = input.displayName?.trim();
  if (!displayName || displayName.length < 2 || displayName.length > 120) {
    throw new AppError("Solicitud invalida", 400);
  }

  const description = input.description?.trim();
  return {
    displayName,
    ...(description ? { description } : {}),
  };
};

const normalizeProduct = (input: ProductInput): ProductInput => {
  const name = input.name?.trim();
  if (!name || name.length < 2 || name.length > 160) {
    throw new AppError("Solicitud invalida", 400);
  }

  const description = input.description?.trim();
  const imageUrl = input.imageUrl?.trim();
  if (imageUrl && imageUrl.length > 500) {
    throw new AppError("Solicitud invalida", 400);
  }

  return {
    name,
    ...(description ? { description } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(typeof input.isVisible === "boolean"
      ? { isVisible: input.isVisible }
      : {}),
  };
};

const normalizeContacts = (contacts: StoreContact[]): StoreContact[] => {
  if (!Array.isArray(contacts) || contacts.length > 5) {
    throw new AppError("Solicitud invalida", 400);
  }

  const channels = new Set<StoreContactChannel>();
  return contacts.map((contact) => {
    const value = contact.value?.trim();
    if (
      !CONTACT_CHANNELS.has(contact.channel)
      || !value
      || value.length < 3
      || value.length > 300
      || channels.has(contact.channel)
    ) {
      throw new AppError("Solicitud invalida", 400);
    }
    channels.add(contact.channel);
    return { channel: contact.channel, value };
  });
};

const requireStore = async (
  userId: string,
  storeId: string,
): Promise<MyVendorProfile> => {
  validateUuid(userId);
  validateUuid(storeId);
  const store = await vendorDashboardRepository.getStoreDashboard(
    userId,
    storeId,
  );
  if (!store) {
    throw new AppError("Tienda no encontrada", 404);
  }
  return store;
};

export const vendorDashboardService = {
  async listManagedStores(userId: string): Promise<ManagedStoreSummary[]> {
    validateUuid(userId);
    return vendorDashboardRepository.listManagedStores(userId);
  },

  async getStoreDashboard(
    userId: string,
    storeId: string,
  ): Promise<MyVendorProfile> {
    return requireStore(userId, storeId);
  },

  async getMyProfile(userId: string): Promise<MyVendorProfile> {
    validateUuid(userId);
    const stores = await vendorDashboardRepository.listManagedStores(userId);
    const firstStore = stores[0];
    if (!firstStore) {
      throw new AppError("Tienda no encontrada", 404);
    }
    return requireStore(userId, firstStore.store_id);
  },

  async updateStoreProfile(
    userId: string,
    storeId: string,
    input: UpdateStoreProfileInput,
  ): Promise<void> {
    await requireStore(userId, storeId);
    const updated = await vendorDashboardRepository.updateStoreProfile(
      userId,
      storeId,
      normalizeProfile(input),
    );
    if (!updated) throw new AppError("No se pudo actualizar la tienda", 400);
  },

  async updateStoreContacts(
    userId: string,
    storeId: string,
    contacts: StoreContact[],
  ): Promise<void> {
    await requireStore(userId, storeId);
    const updated = await vendorDashboardRepository.updateStoreContacts(
      userId,
      storeId,
      normalizeContacts(contacts),
    );
    if (!updated) throw new AppError("No se pudieron actualizar los contactos", 400);
  },

  async createProduct(
    userId: string,
    storeId: string,
    input: ProductInput,
  ): Promise<string> {
    await requireStore(userId, storeId);
    const productId = await vendorDashboardRepository.createProduct(
      userId,
      storeId,
      normalizeProduct(input),
    );
    if (!productId) throw new AppError("No se pudo crear el producto", 400);
    return productId;
  },

  async updateProduct(
    userId: string,
    productId: string,
    input: ProductInput,
  ): Promise<void> {
    validateUuid(userId);
    validateUuid(productId);
    const updated = await vendorDashboardRepository.updateProduct(
      userId,
      productId,
      normalizeProduct(input),
    );
    if (!updated) throw new AppError("Producto no encontrado", 404);
  },

  async removeProduct(userId: string, productId: string): Promise<void> {
    validateUuid(userId);
    validateUuid(productId);
    const removed = await vendorDashboardRepository.removeProduct(
      userId,
      productId,
    );
    if (!removed) throw new AppError("Producto no encontrado", 404);
  },

  async getStoreReviews(userId: string, storeId: string) {
    await requireStore(userId, storeId);
    return reviewsService.getReviewsForVendor(storeId);
  },
};

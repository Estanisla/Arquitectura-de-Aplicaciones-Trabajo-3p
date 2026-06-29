export type StoreMemberRole = "owner" | "manager";

export type StoreContactChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "email"
  | "website";

export interface StoreContact {
  channel: StoreContactChannel;
  value: string;
}

export interface ManagedStoreSummary {
  store_id: string;
  display_name: string;
  member_role: StoreMemberRole;
}

export interface MyVendorProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at?: string;
}

export interface MyVendorProfile {
  store_id: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  member_role: StoreMemberRole;
  products: MyVendorProduct[];
  contacts: StoreContact[];
}

export interface UpdateStoreProfileInput {
  displayName: string;
  description?: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  imageUrl?: string;
  isVisible?: boolean;
}

export interface VendorDashboardDataSource {
  listManagedStores(userId: string): Promise<ManagedStoreSummary[]>;
  getStoreDashboard(
    userId: string,
    storeId: string,
  ): Promise<MyVendorProfile | null>;
  updateStoreProfile(
    userId: string,
    storeId: string,
    input: UpdateStoreProfileInput,
  ): Promise<boolean>;
  updateStoreContacts(
    userId: string,
    storeId: string,
    contacts: StoreContact[],
  ): Promise<boolean>;
  createProduct(
    userId: string,
    storeId: string,
    input: ProductInput,
  ): Promise<string | null>;
  updateProduct(
    userId: string,
    productId: string,
    input: ProductInput,
  ): Promise<boolean>;
  removeProduct(userId: string, productId: string): Promise<boolean>;
}

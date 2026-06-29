export type StoreMemberRole = "owner" | "manager";

export type StoreContactChannel =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "email"
  | "website";

export interface StoreMemberInput {
  username: string;
  tempPassword: string;
  role: StoreMemberRole;
}

export interface StoreContactInput {
  channel: StoreContactChannel;
  value: string;
}

export interface CreateManagedStoreInput {
  emporiumName: string;
  displayName: string;
  description?: string;
  members: StoreMemberInput[];
  contacts: StoreContactInput[];
}

export interface ManagedStoreMember {
  username: string;
  role: StoreMemberRole;
  is_active: boolean;
  must_change_password: boolean;
}

export interface ManagedStoreContact {
  channel: StoreContactChannel;
  value: string;
}

export interface ManagedStore {
  store_id: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  members: ManagedStoreMember[];
  contacts: ManagedStoreContact[];
}

export interface ManagedStoreCollection {
  emporium_name: string | null;
  stores: ManagedStore[];
}

export interface CreateManagedStoreResult {
  ok: boolean;
  message?: string;
  store_id?: string;
  emporium_name?: string;
}

export interface StoreManagementDataSource {
  createStore(
    adminId: string,
    input: CreateManagedStoreInput,
  ): Promise<CreateManagedStoreResult>;
  listStores(adminId: string): Promise<ManagedStoreCollection>;
  addMember(
    adminId: string,
    storeId: string,
    member: Omit<StoreMemberInput, "role">,
  ): Promise<boolean>;
  setMemberActive(
    adminId: string,
    storeId: string,
    username: string,
    isActive: boolean,
  ): Promise<boolean>;
  updateContacts(
    adminId: string,
    storeId: string,
    contacts: StoreContactInput[],
  ): Promise<boolean>;
}

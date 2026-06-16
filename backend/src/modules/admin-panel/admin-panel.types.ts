export interface VendorRow {
  user_id: string;
  username: string;
  display_name: string;
  vendor_id: string;
  is_active: boolean;
  is_deleted: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface CreateVendorInput {
  username: string;
  tempPassword: string;
  displayName: string;
  description?: string;
}

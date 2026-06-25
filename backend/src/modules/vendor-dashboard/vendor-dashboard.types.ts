export interface MyVendorProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface MyVendorProfile {
  vendor_id: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  products: MyVendorProduct[];
}

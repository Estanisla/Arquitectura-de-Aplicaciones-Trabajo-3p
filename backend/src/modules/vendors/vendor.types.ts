export interface ProductPreview {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

export interface VendorListItem {
  vendor_id: string;
  display_name: string;
  description: string | null;
  products: ProductPreview[];
}

export interface VendorProfile {
  vendor_id: string;
  display_name: string;
  description: string | null;
  products: ProductPreview[];
}

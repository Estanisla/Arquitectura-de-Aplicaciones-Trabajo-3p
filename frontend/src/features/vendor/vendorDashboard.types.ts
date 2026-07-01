export type StoreMemberRole = 'owner' | 'manager'
export type StoreContactChannel =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'email'
  | 'website'

export type ManagedStoreSummary = {
  store_id: string
  display_name: string
  member_role: StoreMemberRole
}

export type VendorProduct = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_visible: boolean
  created_at: string
  updated_at?: string
}

export type StoreContact = {
  channel: StoreContactChannel
  value: string
}

export type VendorStoreDashboard = {
  store_id: string
  display_name: string
  description: string | null
  is_active: boolean
  member_role: StoreMemberRole
  products: VendorProduct[]
  contacts: StoreContact[]
}

export type VendorReview = {
  id: string
  product_id: string
  product_name: string
  rating: number
  comment: string
  created_at: string
}

export type ProductPayload = {
  name: string
  description?: string
  imageUrl?: string
  isVisible?: boolean
}

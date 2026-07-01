export type StoreMemberRole = 'owner' | 'manager'

export type StoreContactChannel =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'email'
  | 'website'

export type StoreMemberInput = {
  username: string
  tempPassword: string
  role: StoreMemberRole
}

export type StoreContactInput = {
  channel: StoreContactChannel
  value: string
}

export type CreateManagedStorePayload = {
  emporiumName: string
  displayName: string
  description?: string
  members: StoreMemberInput[]
  contacts: StoreContactInput[]
}

export type ManagedStore = {
  store_id: string
  display_name: string
  description: string | null
  is_active: boolean
  created_at: string
  members: Array<{
    username: string
    role: StoreMemberRole
    is_active: boolean
    must_change_password: boolean
  }>
  contacts: StoreContactInput[]
}

export type ManagedStoreCollection = {
  emporium_name: string | null
  stores: ManagedStore[]
}

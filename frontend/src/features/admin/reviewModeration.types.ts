export type ReviewModerationStatus = 'visible' | 'removed'

export type AdminReviewItem = {
  id: string
  product_id: string
  vendor_id: string
  product_name: string
  store_name: string
  rating: number
  comment: string
  created_at: string
  status: ReviewModerationStatus
  moderated_at: string | null
}

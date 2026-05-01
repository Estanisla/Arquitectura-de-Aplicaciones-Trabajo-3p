export type VendorLoginRequest = {
  username: string
  password: string
}

export type VendorLoginResult = {
  ok: boolean
  message: string
  user_id?: string
}

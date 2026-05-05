export type AuthRole = 'vendor' | 'admin'

export type VendorAuthRequest = {
  username: string
  password: string
}

export type VendorAuthResult = {
  ok: boolean
  message: string
  user_id?: string
}

export type VendorSessionResult = {
  ok: boolean
  authenticated: boolean
  message: string
  user_id?: string
  role?: AuthRole
}

export type VendorLoginRequest = VendorAuthRequest
export type VendorRegisterRequest = VendorAuthRequest

export type VendorLoginResult = VendorAuthResult
export type VendorRegisterResult = VendorAuthResult


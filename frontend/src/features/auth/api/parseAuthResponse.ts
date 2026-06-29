import type { VendorAuthResult } from '../types'
import { parseJsonResponse } from '../../../shared/errors/publicErrors'

export const parseAuthResponse = async (
  response: Response,
  _context: 'Login' | 'Register',
): Promise<VendorAuthResult> => {
  void _context
  return parseJsonResponse<VendorAuthResult>(response)
}

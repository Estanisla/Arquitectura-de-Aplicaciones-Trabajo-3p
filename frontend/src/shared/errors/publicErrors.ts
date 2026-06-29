export const DEFAULT_ERROR_MESSAGE =
  'No se pudo completar la solicitud. Intenta nuevamente.'

export const DEFAULT_LOAD_ERROR_MESSAGE =
  'No se pudo cargar la informacion. Intenta nuevamente.'

export const DEFAULT_AUTH_ERROR_MESSAGE =
  'No se pudo iniciar sesion. Verifica tus datos e intenta nuevamente.'

export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const rawBody = await response.text()

  if (!rawBody) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  try {
    return JSON.parse(rawBody) as T
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }
}

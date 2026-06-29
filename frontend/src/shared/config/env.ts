const readApiBaseUrl = (): string => {
  const envValue = import.meta.env.VITE_API_BASE_URL
  const trimmed = typeof envValue === 'string' ? envValue.trim() : ''
  return trimmed.replace(/\/+$/, '')
}

export const env = {
  API_BASE_URL: readApiBaseUrl(),
}

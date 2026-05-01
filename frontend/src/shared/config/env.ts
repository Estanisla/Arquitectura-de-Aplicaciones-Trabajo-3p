const defaultApiBaseUrl = 'http://localhost:3001'

const readApiBaseUrl = (): string => {
  const envValue = import.meta.env.VITE_API_BASE_URL
  const trimmed = typeof envValue === 'string' ? envValue.trim() : ''
  const selected = trimmed || defaultApiBaseUrl
  return selected.replace(/\/+$/, '')
}

export const env = {
  API_BASE_URL: readApiBaseUrl(),
}

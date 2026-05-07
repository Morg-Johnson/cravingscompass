const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '')

export const API_BASE_URL = raw.endsWith('/v1') ? raw : `${raw}/v1`

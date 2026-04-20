/**
 * Auth API service — login, register, logout, getCurrentUser.
 * Auth endpoints bypass apiClient to avoid circular token reading on login.
 */
import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirm_password: string
  name?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user?: User
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** Raw fetch for auth endpoints — no Authorization header (user not logged in yet). */
async function authFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    try {
      const err = (await response.json()) as Record<string, unknown>
      // DRF returns errors as {detail: "..."} or {field: ["error"]}
      if (typeof err.detail === 'string') {
        message = err.detail
      } else {
        // Flatten field errors: {email: ["already exists"]} → "email: already exists"
        const fieldErrors = Object.entries(err)
          .map(([field, msgs]) => {
            const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs)
            return `${field}: ${msgStr}`
          })
          .join(' | ')
        if (fieldErrors) message = fieldErrors
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

// ── API ───────────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /api/v1/auth/login/ — returns {access, refresh} */
  login: (data: LoginRequest) =>
    authFetch<AuthResponse>('/auth/login/', data),

  /** POST /api/v1/auth/register/ — returns {access, refresh, user} */
  register: (data: RegisterRequest) =>
    authFetch<AuthResponse>('/auth/register/', data),

  /** POST /api/v1/auth/logout/ — blacklists tokens server-side */
  logout: (refreshToken: string) =>
    apiClient.post<{ detail: string }>('/auth/logout/', { refresh: refreshToken }),

  /** POST /api/v1/auth/token/refresh/ — get new access token */
  refresh: (refreshToken: string) =>
    authFetch<{ access: string }>('/auth/token/refresh/', { refresh: refreshToken }),

  /** GET /api/v1/auth/me/ — fetch current user profile */
  getMe: () =>
    apiClient.get<User>('/auth/me/'),
}

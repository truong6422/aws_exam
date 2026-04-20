/**
 * Thin fetch-based API client.
 *
 * - Prepends /api/v1 to every path.
 * - Attaches Authorization: Bearer <token> from auth-store when present.
 * - On 401, clears auth state and redirects to /login.
 */

// Lazy import to avoid circular dependency (store imports this file,
// so we read the store's raw localStorage value here instead).
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('aws-exam-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

function getStoredRefreshToken(): string | null {
  try {
    const raw = localStorage.getItem('aws-exam-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { refreshToken?: string | null } }
    return parsed?.state?.refreshToken ?? null
  } catch {
    return null
  }
}

function updateStoredToken(newToken: string): void {
  try {
    const raw = localStorage.getItem('aws-exam-auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && parsed.state) {
      parsed.state.token = newToken
      localStorage.setItem('aws-exam-auth', JSON.stringify(parsed))
    }
  } catch {
    // ignore
  }
}

function clearAuthAndRedirect(): void {
  try {
    localStorage.removeItem('aws-exam-auth')
  } catch {
    // ignore
  }
  window.location.replace('/login')
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

// Track if we are currently refreshing to avoid multiple refresh calls
let isRefreshing = false

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  }

  const token = getStoredToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/v1${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    const refreshToken = getStoredRefreshToken()

    // If we have a refresh token and aren't already refreshing, try to get a new access token
    if (refreshToken && !isRefreshing) {
      isRefreshing = true
      try {
        const refreshResponse = await fetch('/api/v1/auth/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (refreshResponse.ok) {
          const { access } = (await refreshResponse.json()) as { access: string }
          updateStoredToken(access)
          isRefreshing = false

          // Retry the original request with the new token
          return request<T>(path, options)
        }
      } catch (err) {
        // Refresh failed
      } finally {
        isRefreshing = false
      }
    }

    // If refresh failed or was not possible, logout
    clearAuthAndRedirect()
    throw new Error('Unauthorized — redirecting to login')
  }

  if (!response.ok) {
    // Try to surface backend error message
    let message = `Request failed: ${response.status}`
    try {
      const err = (await response.json()) as { detail?: string; message?: string }
      message = err.detail ?? err.message ?? message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }

  // 204 No Content — return empty object
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  /** Fetch a DRF list endpoint and unwrap paginated {results:[]}, {data:[]}, or plain array. */
  list: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T[]> =>
    request<{ results: T[] } | { data: T[] } | T[]>(path, { ...options, method: 'GET' })
      .then((res) => {
        if (Array.isArray(res)) return res
        if ('data' in res && Array.isArray(res.data)) return res.data
        if ('results' in res && Array.isArray(res.results)) return res.results
        return []
      }),
}

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

function updateStoredTokens(newAccessToken: string, newRefreshToken?: string): void {
  try {
    const raw = localStorage.getItem('aws-exam-auth')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && parsed.state) {
      parsed.state.token = newAccessToken
      // ROTATE_REFRESH_TOKENS=True: backend trả refresh token mới, phải lưu lại
      if (newRefreshToken) {
        parsed.state.refreshToken = newRefreshToken
      }
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

// Track refresh state and queue concurrent 401 requests
let isRefreshing = false
type RefreshSubscriber = (newToken: string) => void
let refreshSubscribers: RefreshSubscriber[] = []

function subscribeTokenRefresh(cb: RefreshSubscriber): void {
  refreshSubscribers.push(cb)
}

function notifySubscribers(newToken: string): void {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

async function doTokenRefresh(): Promise<string> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) throw new Error('No refresh token')

  const res = await fetch('/api/v1/auth/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  })

  if (!res.ok) throw new Error('Refresh failed')

  // ROTATE_REFRESH_TOKENS=True: backend trả cả refresh token mới
  const data = (await res.json()) as { access: string; refresh?: string }
  updateStoredTokens(data.access, data.refresh)
  return data.access
}

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
    // Nếu đang refresh: xếp hàng chờ, retry với token mới khi xong
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          }
          fetch(`/api/v1${path}`, {
            ...rest,
            headers: retryHeaders,
            body: body !== undefined ? JSON.stringify(body) : undefined,
          })
            .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(`${r.status}`))))
            .then(resolve)
            .catch(reject)
        })
      })
    }

    // Chỉ một request thực hiện refresh, các request khác xếp hàng
    isRefreshing = true
    try {
      const newToken = await doTokenRefresh()
      notifySubscribers(newToken)
      // Retry request gốc
      return request<T>(path, options)
    } catch {
      // Refresh thất bại → logout
      refreshSubscribers = []
      clearAuthAndRedirect()
      throw new Error('Unauthorized — redirecting to login')
    } finally {
      isRefreshing = false
    }
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

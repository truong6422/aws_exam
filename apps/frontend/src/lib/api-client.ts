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
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null } }
    return parsed?.state?.accessToken ?? null
  } catch {
    return null
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

  if (response.status === 401) {
    clearAuthAndRedirect()
    // Throw so callers don't try to read the body
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
}

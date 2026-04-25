// Centralized HTTP client with auth interceptor
let authErrorCallback: (() => void) | null = null

export function onAuthError(callback: () => void) {
  authErrorCallback = callback
}

async function httpFetch<T = any>(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const token = localStorage.getItem('access_token')
  const headers: any = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  // Handle 401 - Unauthorized
  if (response.status === 401) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    if (authErrorCallback) authErrorCallback()
    throw new Error('Unauthorized. Please login again.')
  }

  // Handle other errors
  if (!response.ok) {
    let errorMessage = `HTTP Error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      // Response wasn't JSON
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export const http = {
  get: <T = any>(url: string, options?: RequestInit & { skipAuth?: boolean }) =>
    httpFetch<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: RequestInit & { skipAuth?: boolean }) =>
    httpFetch<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(url: string, body?: any, options?: RequestInit & { skipAuth?: boolean }) =>
    httpFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(url: string, body?: any, options?: RequestInit & { skipAuth?: boolean }) =>
    httpFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(url: string, options?: RequestInit & { skipAuth?: boolean }) =>
    httpFetch<T>(url, { ...options, method: 'DELETE' }),
}

import { http } from './httpClient'
import * as authModule from './auth'

const AUTH_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000'

// Re-export auth functions for backward compatibility
export const loginUser = (email: string, password: string) =>
  authModule.loginUser({ username: email, password })

export const registerUser = (name: string, email: string, password: string) =>
  authModule.signupUser({ full_name: name, email, password })

export function saveAuth(token: string, user: any) {
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
}

export function getToken() {
    return localStorage.getItem('access_token')
}

export function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
}

export async function getMe() {
    return http.get(`${AUTH_BASE}/api/auth/me`)
}

export async function apiCall(endpoint: string, options: RequestInit & { skipAuth?: boolean } = {}) {
    const url = `${AUTH_BASE}/api${endpoint}`
    const method = (options.method || 'POST').toUpperCase()
    const body = options.body ? JSON.parse(options.body as string) : undefined

    if (method === 'GET') return http.get(url, options)
    if (method === 'POST') return http.post(url, body, options)
    if (method === 'PUT') return http.put(url, body, options)
    if (method === 'PATCH') return http.patch(url, body, options)
    if (method === 'DELETE') return http.delete(url, options)

    throw new Error(`Unsupported method: ${method}`)
}

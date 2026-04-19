const AUTH_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function loginUser(email: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    const res = await fetch(`${AUTH_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Login failed')
    return data
}

export async function registerUser(name: string, email: string, password: string) {
    const res = await fetch(`${AUTH_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Registration failed')
    return data
}

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
    return apiCall('/auth/me', { method: 'GET' })
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
    const token = getToken()
    const url = `${AUTH_BASE}/api${endpoint}`
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
}
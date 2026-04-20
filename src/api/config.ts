// Centralized base URLs from environment
const AUTH_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000'
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://flowconnect-backend-production.up.railway.app'

export const api = {
  // Auth
  signup: `${AUTH_BASE}/api/auth/register`,
  login: `${AUTH_BASE}/api/auth/login`,
  me: `${AUTH_BASE}/api/auth/me`,

  // Workflows & Apps
  workflows: `${API_BASE}/api/workflows`,
  apps: `${API_BASE}/api/apps`,
  dashboard: `${API_BASE}/api/dashboard`,

  // Webhook
  webhook: `${API_BASE}/webhook/razorpay`,
}
export const API_BASE = "https://flowconnect-backend-production.up.railway.app";
export const api = {
  signup:    `${API_BASE}/api/auth/register`,
  login:     `${API_BASE}/api/auth/login`,
  me:        `${API_BASE}/api/auth/me`,
  workflows: `${API_BASE}/api/workflows`,
  apps:      `${API_BASE}/api/apps`,
  dashboard: `${API_BASE}/api/dashboard`,
  webhook:   `${API_BASE}/webhook/razorpay`,
};
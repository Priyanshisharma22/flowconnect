export const API_BASE = "http://localhost:8000";

export const api = {
  signup:    `${API_BASE}/api/auth/register`,
  login:     `${API_BASE}/api/auth/login/json`,
  me:        `${API_BASE}/api/auth/me`,
  workflows: `${API_BASE}/api/workflows`,
  apps:      `${API_BASE}/api/apps`,
  dashboard: `${API_BASE}/api/dashboard`,
  webhook:   `${API_BASE}/api/webhook/razorpay`,
};
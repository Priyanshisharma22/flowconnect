import { http } from "./httpClient";
import { api } from "./config";

export async function signupUser(data: {
  full_name: string;
  email: string;
  password: string;
}) {
  return http.post(api.signup, data, { skipAuth: true });
}

export async function loginUser(data: {
  username: string;
  password: string;
}) {
  const AUTH_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:4000";
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);

  const res = await fetch(`${AUTH_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }

  return res.json();
}
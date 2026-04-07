import { api } from "./config";

export async function signupUser(data: {
  full_name: string;
  email: string;
  password: string;
}) {
  const res = await fetch(api.signup, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Signup failed");
  }

  return res.json(); // returns { access_token, token_type, user }
}

export async function loginUser(data: {
  username: string; // FastAPI OAuth2 uses "username" field
  password: string;
}) {
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);

  const res = await fetch(api.login, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }

  return res.json(); // returns { access_token, token_type, user }
}
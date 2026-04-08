import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.AUTH_PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const USERS_FILE = path.join(__dirname, "users.json");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
  };
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ detail: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const user = users.find((item) => item.id === payload.sub);
    if (!user) {
      return res.status(401).json({ detail: "Invalid token user" });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/register", async (req, res) => {
  const full_name = (req.body.full_name || req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!full_name || !email || !password) {
    return res.status(400).json({ detail: "full_name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ detail: "Password must be at least 6 characters" });
  }

  const users = await readUsers();
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ detail: "Email already registered" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = {
    id: randomUUID(),
    full_name,
    email,
    password_hash,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  await writeUsers(users);

  const access_token = createToken(user);
  return res.status(201).json({
    access_token,
    token_type: "bearer",
    user: sanitizeUser(user),
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.username || req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ detail: "username/email and password are required" });
  }

  const users = await readUsers();
  const user = users.find((item) => item.email === email);

  if (!user) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }

  const access_token = createToken(user);
  return res.json({
    access_token,
    token_type: "bearer",
    user: sanitizeUser(user),
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  return res.json(sanitizeUser(req.user));
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

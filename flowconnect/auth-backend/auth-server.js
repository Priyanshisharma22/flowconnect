import "dotenv/config";
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
const USERS_FILE = path.resolve(
  process.cwd(),
  process.env.AUTH_USERS_FILE || "flowconnect/auth-backend/users.json"
);
const WORKFLOWS_FILE = path.resolve(
  process.cwd(),
  process.env.AUTH_WORKFLOWS_FILE || "flowconnect/auth-backend/workflows.local.json"
);
const APPS_FILE = path.resolve(
  process.cwd(),
  process.env.AUTH_APPS_FILE || "flowconnect/auth-backend/apps.local.json"
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function readUsers() {
  return readJsonFile(USERS_FILE, []);
}

async function writeUsers(users) {
  await writeJsonFile(USERS_FILE, users);
}

async function readWorkflows() {
  return readJsonFile(WORKFLOWS_FILE, []);
}

async function writeWorkflows(workflows) {
  await writeJsonFile(WORKFLOWS_FILE, workflows);
}

async function readApps() {
  return readJsonFile(APPS_FILE, []);
}

async function writeApps(apps) {
  await writeJsonFile(APPS_FILE, apps);
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    name: user.full_name,
    created_at: user.created_at,
    plan: user.plan || "free",
  };
}

function inferAppNames(workflow) {
  const apps = new Set();
  const parts = [workflow.trigger, ...(workflow.actions || []).map((action) => action.type)];

  for (const part of parts) {
    if (typeof part !== "string") continue;
    if (part.includes("razorpay")) apps.add("razorpay");
    if (part.includes("whatsapp") || part.includes("invoice")) apps.add("whatsapp");
    if (part.includes("sheet")) apps.add("google_sheets");
    if (part.includes("zoho")) apps.add("zoho");
    if (part.includes("telegram")) apps.add("telegram");
    if (part.includes("instamojo")) apps.add("instamojo");
    if (part.includes("discord")) apps.add("discord");
    if (part.includes("tally")) apps.add("tally");
    if (part.includes("typeform") || part.includes("form")) apps.add("typeform");
  }

  return Array.from(apps);
}

async function syncAppsForWorkflow(userId, workflow) {
  const apps = await readApps();
  const existingKeys = new Set(
    apps
      .filter((item) => item.user_id === userId)
      .map((item) => item.app_name)
  );

  for (const appName of inferAppNames(workflow)) {
    if (existingKeys.has(appName)) continue;

    apps.push({
      id: randomUUID(),
      user_id: userId,
      app_name: appName,
      connected_at: new Date().toISOString(),
    });
  }

  await writeApps(apps);
}

async function computeDashboard(userId) {
  const workflows = (await readWorkflows()).filter((item) => item.user_id === userId);
  const apps = (await readApps()).filter((item) => item.user_id === userId);
  const totalExecutions = workflows.reduce((sum, workflow) => sum + (workflow.run_count || 0), 0);
  const activeWorkflows = workflows.filter((workflow) => workflow.status === "active").length;

  return {
    total_workflows: workflows.length,
    active_workflows: activeWorkflows,
    total_executions: totalExecutions,
    successful_executions: totalExecutions,
    connected_apps: apps.length,
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
    plan: "free",
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

app.put("/api/auth/me", authMiddleware, async (req, res) => {
  const fullName = String(req.body.full_name || req.body.name || "").trim();

  if (!fullName) {
    return res.status(400).json({ detail: "name/full_name is required" });
  }

  const users = await readUsers();
  const nextUsers = users.map((user) =>
    user.id === req.user.id ? { ...user, full_name: fullName } : user
  );
  const updatedUser = nextUsers.find((user) => user.id === req.user.id);

  await writeUsers(nextUsers);
  req.user = updatedUser;

  return res.json(sanitizeUser(updatedUser));
});

app.get("/api/workflows/", authMiddleware, async (req, res) => {
  const workflows = await readWorkflows();
  const userWorkflows = workflows
    .filter((workflow) => workflow.user_id === req.user.id)
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

  return res.json(userWorkflows);
});

app.post("/api/workflows/", authMiddleware, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const trigger = String(req.body.trigger || "").trim();
  const actions = Array.isArray(req.body.actions) ? req.body.actions : [];

  if (!name || !trigger) {
    return res.status(400).json({ detail: "name and trigger are required" });
  }

  const now = new Date().toISOString();
  const workflow = {
    id: randomUUID(),
    user_id: req.user.id,
    name,
    trigger,
    actions,
    status: "inactive",
    run_count: 0,
    created_at: now,
    updated_at: now,
  };

  const workflows = await readWorkflows();
  workflows.push(workflow);
  await writeWorkflows(workflows);
  await syncAppsForWorkflow(req.user.id, workflow);

  return res.status(201).json(workflow);
});

app.patch("/api/workflows/:id/toggle", authMiddleware, async (req, res) => {
  const workflows = await readWorkflows();
  const index = workflows.findIndex(
    (workflow) => workflow.id === req.params.id && workflow.user_id === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({ detail: "Workflow not found" });
  }

  const existing = workflows[index];
  const nextStatus = existing.status === "active" ? "inactive" : "active";
  const updatedWorkflow = {
    ...existing,
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  workflows[index] = updatedWorkflow;
  await writeWorkflows(workflows);

  return res.json(updatedWorkflow);
});

app.get("/api/apps/", authMiddleware, async (req, res) => {
  const apps = await readApps();
  const userApps = apps
    .filter((app) => app.user_id === req.user.id)
    .sort((a, b) => new Date(b.connected_at) - new Date(a.connected_at));

  return res.json(userApps);
});

app.delete("/api/apps/:appName", authMiddleware, async (req, res) => {
  const apps = await readApps();
  const nextApps = apps.filter(
    (app) => !(app.user_id === req.user.id && app.app_name === req.params.appName)
  );

  await writeApps(nextApps);
  return res.json({ ok: true });
});

app.get("/api/dashboard/", authMiddleware, async (req, res) => {
  const dashboard = await computeDashboard(req.user.id);
  return res.json(dashboard);
});

app.get("/api/dashboard/analytics", authMiddleware, async (req, res) => {
  const dateRange = req.query.dateRange || "30days";
  const workflows = (await readWorkflows()).filter((w) => w.user_id === req.user.id);
  
  const now = new Date();
  let threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (dateRange === "7days") threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (dateRange === "all") threshold = new Date(0);

  const dailyData = {};
  workflows.forEach((w) => {
    if (!w.created_at) return;
    const date = new Date(w.created_at).toISOString().split("T")[0];
    if (new Date(date) >= threshold) {
      dailyData[date] = (dailyData[date] || 0) + (w.run_count || 0);
    }
  });

  const executionHistory = Object.entries(dailyData)
    .map(([date, count]) => ({ date, executions: count }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const successCount = workflows.reduce((sum, w) => sum + (w.success_count || 0), 0);
  const failureCount = workflows.reduce((sum, w) => sum + (w.failure_count || 0), 0);

  const mostActiveFlows = workflows
    .sort((a, b) => (b.run_count || 0) - (a.run_count || 0))
    .slice(0, 5)
    .map((w) => ({ name: w.name, executions: w.run_count || 0 }));

  const recentActivity = workflows
    .filter((w) => w.last_executed_at)
    .sort((a, b) => new Date(b.last_executed_at) - new Date(a.last_executed_at))
    .slice(0, 10)
    .map((w) => ({
      id: w.id,
      name: w.name,
      timestamp: w.last_executed_at,
      status: w.status,
      executionCount: w.run_count || 0,
    }));

  const apps = (await readApps()).filter((a) => a.user_id === req.user.id);

  return res.json({
    executionHistory,
    successFailureStats: {
      successful: successCount,
      failed: failureCount,
    },
    mostActiveFlows,
    recentActivity,
    summary: {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter((w) => w.status === "active").length,
      totalExecutions: workflows.reduce((sum, w) => sum + (w.run_count || 0), 0),
      connectedApps: apps.length,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

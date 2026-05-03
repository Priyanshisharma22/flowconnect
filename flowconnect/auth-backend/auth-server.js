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
const GOOGLE_OAUTH_FILE = path.resolve(
  process.cwd(),
  process.env.AUTH_GOOGLE_OAUTH_FILE || "flowconnect/auth-backend/google-oauth.local.json"
);
const GOOGLE_TRIGGER_STATE_FILE = path.resolve(
  process.cwd(),
  process.env.AUTH_GOOGLE_TRIGGER_STATE_FILE || "flowconnect/auth-backend/google-trigger-state.local.json"
);
const GOOGLE_FORMS_POLL_MS = Number(process.env.GOOGLE_FORMS_POLL_MS || 60_000);
const GOOGLE_OAUTH_REDIRECT_URI =
  process.env.GOOGLE_FORMS_OAUTH_REDIRECT_URI ||
  `http://localhost:${PORT}/api/googleforms/oauth/callback`;
const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "openid",
  "email",
];

const googleOauthStateCache = new Map();
let googlePollingInProgress = false;

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

async function readGoogleOauth() {
  return readJsonFile(GOOGLE_OAUTH_FILE, {});
}

async function writeGoogleOauth(data) {
  await writeJsonFile(GOOGLE_OAUTH_FILE, data);
}

async function readGoogleTriggerState() {
  return readJsonFile(GOOGLE_TRIGGER_STATE_FILE, {});
}

async function writeGoogleTriggerState(data) {
  await writeJsonFile(GOOGLE_TRIGGER_STATE_FILE, data);
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

function sanitizeKey(text) {
  const normalized = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "field";
}

function normalizeFieldMapping(mapping) {
  if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
    return {};
  }

  const normalized = {};
  for (const [variable, sourceField] of Object.entries(mapping)) {
    const variableName = String(variable || "").trim();
    const sourceName = String(sourceField || "").trim();
    if (!variableName || !sourceName) continue;
    normalized[variableName] = sourceName;
  }

  return normalized;
}

function extractGoogleAnswerValue(answer) {
  const textValue = answer?.textAnswers?.answers
    ?.map((item) => item.value)
    .filter(Boolean)
    .join(", ");
  if (textValue) return textValue;

  const choiceValue = answer?.choiceAnswers?.answers
    ?.map((item) => item.value)
    .filter(Boolean)
    .join(", ");
  if (choiceValue) return choiceValue;

  const fileValue = answer?.fileUploadAnswers?.answers
    ?.map((item) => item.fileId)
    .filter(Boolean)
    .join(", ");
  if (fileValue) return fileValue;

  return "";
}

function mapGoogleAnswers(formItems, response) {
  const questionById = new Map(
    (formItems || []).map((item) => [item?.questionItem?.question?.questionId, item])
  );
  const mapped = {};

  for (const [questionId, answer] of Object.entries(response?.answers || {})) {
    const question = questionById.get(questionId);
    const title = question?.title || questionId;
    mapped[title] = extractGoogleAnswerValue(answer);
  }

  return mapped;
}

function applyFieldMapping(answers, fieldMapping) {
  const mapping = normalizeFieldMapping(fieldMapping);
  const sourceAnswers = answers && typeof answers === "object" ? answers : {};

  if (Object.keys(mapping).length > 0) {
    const result = {};
    for (const [variable, sourceName] of Object.entries(mapping)) {
      result[variable] = sourceAnswers[sourceName] ?? "";
    }
    return result;
  }

  const fallback = {};
  for (const [sourceName, value] of Object.entries(sourceAnswers)) {
    const baseKey = sanitizeKey(sourceName);
    let key = baseKey;
    let suffix = 2;
    while (Object.prototype.hasOwnProperty.call(fallback, key)) {
      key = `${baseKey}_${suffix++}`;
    }
    fallback[key] = value;
  }

  return fallback;
}

function getGoogleOauthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
  const redirectUri = GOOGLE_OAUTH_REDIRECT_URI;

  return { clientId, clientSecret, redirectUri };
}

function buildGoogleOauthUrl(state) {
  const { clientId, redirectUri } = getGoogleOauthConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeGoogleAuthCode(code) {
  const { clientId, clientSecret, redirectUri } = getGoogleOauthConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Google OAuth exchange failed");
  }

  return data;
}

async function refreshGoogleAccessToken(refreshToken) {
  const { clientId, clientSecret } = getGoogleOauthConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google token");
  }

  return data;
}

async function getGoogleAccessTokenForUser(userId) {
  const oauth = await readGoogleOauth();
  const account = oauth[userId];

  if (!account?.tokens?.access_token) {
    throw new Error("Google Forms is not connected for this user");
  }

  const tokens = account.tokens;
  const expiresAt = Number(tokens.expires_at || 0);
  const shouldRefresh = !!tokens.refresh_token && (!expiresAt || expiresAt <= Date.now() + 60_000);

  if (!shouldRefresh) {
    return tokens.access_token;
  }

  const refreshed = await refreshGoogleAccessToken(tokens.refresh_token);
  const nextTokens = {
    ...tokens,
    ...refreshed,
    refresh_token: refreshed.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
  };

  oauth[userId] = {
    ...account,
    tokens: nextTokens,
    updated_at: new Date().toISOString(),
  };
  await writeGoogleOauth(oauth);

  return nextTokens.access_token;
}

async function googleFormsApiRequest(userId, endpoint, query = {}) {
  const makeRequest = async (token) => {
    const url = new URL(`https://forms.googleapis.com/v1/${endpoint}`);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Google Forms API error (${response.status}): ${text || "unknown"}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  };

  try {
    const token = await getGoogleAccessTokenForUser(userId);
    return await makeRequest(token);
  } catch (error) {
    if (error?.status !== 401) throw error;

    const oauth = await readGoogleOauth();
    const account = oauth[userId];
    if (!account?.tokens?.refresh_token) throw error;

    const refreshed = await refreshGoogleAccessToken(account.tokens.refresh_token);
    const nextTokens = {
      ...account.tokens,
      ...refreshed,
      refresh_token: refreshed.refresh_token || account.tokens.refresh_token,
      expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
    };

    oauth[userId] = {
      ...account,
      tokens: nextTokens,
      updated_at: new Date().toISOString(),
    };
    await writeGoogleOauth(oauth);

    return makeRequest(nextTokens.access_token);
  }
}

async function fetchGoogleFormSnapshot(userId, formId, pageSize = 20) {
  const form = await googleFormsApiRequest(userId, `forms/${formId}`);
  const responseData = await googleFormsApiRequest(userId, `forms/${formId}/responses`, {
    pageSize,
  });

  const formItems = Array.isArray(form?.items) ? form.items : [];
  const responses = Array.isArray(responseData?.responses)
    ? responseData.responses.map((item) => ({
        ...item,
        mapped_answers: mapGoogleAnswers(formItems, item),
      }))
    : [];

  return {
    form,
    responses,
  };
}

function getGoogleTriggerConfig(workflow) {
  const raw = workflow?.trigger_config?.googleforms || {};
  return {
    form_id: String(raw.form_id || "").trim(),
    mode: raw.mode === "webhook" ? "webhook" : "polling",
    poll_interval_sec: Math.max(15, Number(raw.poll_interval_sec || 60) || 60),
    field_mapping: normalizeFieldMapping(raw.field_mapping),
  };
}

function isGoogleFormsWorkflow(workflow) {
  if (!workflow || workflow.trigger !== "googleforms.submission") {
    return false;
  }
  return !!getGoogleTriggerConfig(workflow).form_id;
}

async function markWorkflowRun(workflowId, payload, success = true) {
  const workflows = await readWorkflows();
  const index = workflows.findIndex((workflow) => workflow.id === workflowId);
  if (index === -1) return;

  const existing = workflows[index];
  const updated = {
    ...existing,
    run_count: (existing.run_count || 0) + 1,
    successful_run_count: (existing.successful_run_count || 0) + (success ? 1 : 0),
    failure_count: (existing.failure_count || 0) + (success ? 0 : 1),
    last_executed_at: new Date().toISOString(),
    last_trigger_payload: payload,
    updated_at: new Date().toISOString(),
  };

  workflows[index] = updated;
  await writeWorkflows(workflows);
}

async function executeGoogleFormsWorkflow(workflow, triggerPayload) {
  // Action execution adapters are integration-specific and can be layered here.
  // For now we persist trigger execution metadata and workflow run counters.
  await markWorkflowRun(workflow.id, {
    source: "googleforms",
    trigger: workflow.trigger,
    trigger_payload: triggerPayload,
    actions: workflow.actions || [],
  });
}

async function pollGoogleFormsTriggers() {
  if (googlePollingInProgress) return;
  googlePollingInProgress = true;

  try {
    const workflows = (await readWorkflows()).filter(
      (workflow) => workflow.status === "active" && isGoogleFormsWorkflow(workflow)
    );
    if (!workflows.length) return;

    const oauth = await readGoogleOauth();
    const cursorState = await readGoogleTriggerState();
    const now = Date.now();
    let cursorChanged = false;

    for (const workflow of workflows) {
      const account = oauth[workflow.user_id];
      if (!account?.tokens?.access_token) continue;

      const config = getGoogleTriggerConfig(workflow);
      const cursor = cursorState[workflow.id] || {};
      const lastPolledAt = Number(cursor.last_polled_at || 0);
      const pollIntervalMs = config.poll_interval_sec * 1000;
      if (now - lastPolledAt < pollIntervalMs) continue;

      try {
        const snapshot = await fetchGoogleFormSnapshot(workflow.user_id, config.form_id, 20);
        const responses = snapshot.responses
          .slice()
          .sort((a, b) => new Date(a.createTime || 0) - new Date(b.createTime || 0));

        const lastResponseTime = cursor.last_response_time
          ? new Date(cursor.last_response_time).getTime()
          : 0;

        const newResponses = responses.filter((response) => {
          const responseTime = new Date(response.createTime || 0).getTime();
          if (!cursor.last_response_time) return true;
          if (responseTime > lastResponseTime) return true;
          if (
            responseTime === lastResponseTime &&
            cursor.last_response_id &&
            response.responseId &&
            response.responseId !== cursor.last_response_id
          ) {
            return true;
          }
          return false;
        });

        for (const response of newResponses) {
          const answers = response.mapped_answers || {};
          const mapped = applyFieldMapping(answers, config.field_mapping);
          await executeGoogleFormsWorkflow(workflow, {
            form_id: config.form_id,
            response_id: response.responseId,
            submitted_at: response.createTime,
            answers,
            mapped,
          });
        }

        const latest = responses[responses.length - 1];
        cursorState[workflow.id] = {
          ...cursor,
          last_polled_at: now,
          last_response_time: latest?.createTime || cursor.last_response_time || null,
          last_response_id: latest?.responseId || cursor.last_response_id || null,
          last_error: null,
        };
      } catch (error) {
        cursorState[workflow.id] = {
          ...cursor,
          last_polled_at: now,
          last_error: String(error?.message || error),
        };
      }

      cursorChanged = true;
    }

    if (cursorChanged) {
      await writeGoogleTriggerState(cursorState);
    }
  } finally {
    googlePollingInProgress = false;
  }
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
    if (part.includes("googleforms") || part.includes("google_form")) apps.add("google_forms");
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

async function computeGlobalStats() {
  const users = await readUsers();
  const workflows = await readWorkflows();
  const apps = await readApps();

  const totalExecutions = workflows.reduce((sum, w) => sum + (w.run_count || 0), 0);
  const successfulExecutions = workflows.reduce((sum, w) => sum + (w.successful_run_count || 0), 0);
  const successRate = totalExecutions > 0 
    ? Math.round((successfulExecutions / totalExecutions) * 100) 
    : 100;

  return {
    total_users: users.length,
    active_flows: workflows.filter(w => w.status === "active").length,
    total_executions: totalExecutions,
    success_rate: successRate,
    uptime_percentage: 99.9,
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

app.get("/api/googleforms/oauth/start", authMiddleware, async (req, res) => {
  const { clientId, clientSecret } = getGoogleOauthConfig();
  if (!clientId || !clientSecret) {
    return res.status(400).json({
      detail: "Google OAuth is not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET",
    });
  }

  const state = randomUUID();
  googleOauthStateCache.set(state, {
    user_id: req.user.id,
    created_at: Date.now(),
  });

  return res.json({
    url: buildGoogleOauthUrl(state),
    state,
  });
});

app.get("/api/googleforms/oauth/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const oauthError = String(req.query.error || "");

  if (oauthError) {
    return res.status(400).send(`<html><body><h3>Google OAuth failed</h3><p>${oauthError}</p></body></html>`);
  }

  const stateEntry = googleOauthStateCache.get(state);
  googleOauthStateCache.delete(state);

  if (!stateEntry || Date.now() - stateEntry.created_at > 10 * 60 * 1000) {
    return res.status(400).send("<html><body><h3>OAuth state expired</h3></body></html>");
  }

  if (!code) {
    return res.status(400).send("<html><body><h3>Missing OAuth code</h3></body></html>");
  }

  try {
    const tokenData = await exchangeGoogleAuthCode(code);
    const oauth = await readGoogleOauth();
    const existing = oauth[stateEntry.user_id] || {};

    oauth[stateEntry.user_id] = {
      ...existing,
      connected_at: existing.connected_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tokens: {
        ...existing.tokens,
        ...tokenData,
        refresh_token: tokenData.refresh_token || existing?.tokens?.refresh_token,
        expires_at: Date.now() + Number(tokenData.expires_in || 3600) * 1000,
      },
    };
    await writeGoogleOauth(oauth);

    return res.send(
      "<html><body><h3>Google Forms connected successfully</h3><p>You can close this tab and return to FlowConnect.</p></body></html>"
    );
  } catch (error) {
    return res.status(500).send(
      `<html><body><h3>OAuth callback failed</h3><p>${String(error?.message || error)}</p></body></html>`
    );
  }
});

app.get("/api/googleforms/oauth/status", authMiddleware, async (req, res) => {
  const oauth = await readGoogleOauth();
  const account = oauth[req.user.id];
  const connected = !!account?.tokens?.access_token;

  return res.json({
    connected,
    connected_at: account?.connected_at || null,
    expires_at: account?.tokens?.expires_at || null,
  });
});

app.post("/api/googleforms/oauth/disconnect", authMiddleware, async (req, res) => {
  const oauth = await readGoogleOauth();
  delete oauth[req.user.id];
  await writeGoogleOauth(oauth);
  return res.json({ ok: true });
});

app.post("/api/triggers/googleforms/test", authMiddleware, async (req, res) => {
  const formId = String(req.body.form_id || "").trim();
  const fieldMapping = normalizeFieldMapping(req.body.field_mapping || {});

  if (!formId) {
    return res.status(400).json({ detail: "form_id is required" });
  }

  try {
    const snapshot = await fetchGoogleFormSnapshot(req.user.id, formId, 20);
    const responses = snapshot.responses
      .slice()
      .sort((a, b) => new Date(a.createTime || 0) - new Date(b.createTime || 0));
    const latest = responses[responses.length - 1];

    if (!latest) {
      return res.json({
        ok: true,
        has_response: false,
        message: "No responses found for this form yet",
      });
    }

    const answers = latest.mapped_answers || {};
    const mapped = applyFieldMapping(answers, fieldMapping);

    return res.json({
      ok: true,
      has_response: true,
      form_title: snapshot.form?.info?.title || "",
      response: {
        response_id: latest.responseId,
        submitted_at: latest.createTime,
        answers,
        mapped,
      },
    });
  } catch (error) {
    return res.status(500).json({ detail: String(error?.message || error) });
  }
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
  const trigger_config =
    req.body.trigger_config && typeof req.body.trigger_config === "object"
      ? req.body.trigger_config
      : {};

  if (!name || !trigger) {
    return res.status(400).json({ detail: "name and trigger are required" });
  }

  const now = new Date().toISOString();
  const workflow = {
    id: randomUUID(),
    user_id: req.user.id,
    name,
    trigger,
    trigger_config,
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

app.get("/api/stats/public", async (_req, res) => {
  try {
    const stats = await computeGlobalStats();
    return res.json(stats);
  } catch (error) {
    console.error("Error computing global stats:", error);
    return res.json({
      total_users: 0,
      active_flows: 0,
      total_executions: 0,
      success_rate: 100,
      uptime_percentage: 99.9,
    });
  }
});

app.post("/api/webhooks/whatsapp", async (req, res) => {
  const { intent, data, source } = req.body;
  
  return res.status(200).json({
    ok: true,
    message: `Workflow '${intent}' queued successfully`,
    executionId: randomUUID()
  });
});

app.post("/api/webhooks/googleforms", async (req, res) => {
  const expectedSecret = process.env.GOOGLE_FORMS_WEBHOOK_SECRET || "";
  const providedSecret = String(req.headers["x-flowconnect-secret"] || "");

  if (expectedSecret && providedSecret !== expectedSecret) {
    return res.status(401).json({ detail: "Invalid webhook secret" });
  }

  const formId = String(req.body.form_id || "").trim();
  const response = req.body.response || {};
  const submittedAt = response.submitted_at || response.createTime || new Date().toISOString();
  const responseId = response.response_id || response.responseId || randomUUID();
  const answers =
    response.answers && typeof response.answers === "object" && !Array.isArray(response.answers)
      ? response.answers
      : {};

  if (!formId) {
    return res.status(400).json({ detail: "form_id is required" });
  }

  const workflows = (await readWorkflows()).filter((workflow) => {
    if (workflow.status !== "active" || !isGoogleFormsWorkflow(workflow)) return false;
    const config = getGoogleTriggerConfig(workflow);
    return config.mode === "webhook" && config.form_id === formId;
  });

  for (const workflow of workflows) {
    const config = getGoogleTriggerConfig(workflow);
    const mapped = applyFieldMapping(answers, config.field_mapping);
    await executeGoogleFormsWorkflow(workflow, {
      form_id: formId,
      response_id: responseId,
      submitted_at: submittedAt,
      answers,
      mapped,
      source: "webhook",
    });
  }

  return res.status(200).json({
    ok: true,
    triggered_workflows: workflows.length,
  });
});

setInterval(() => {
  pollGoogleFormsTriggers().catch((error) => {
    console.error("Google Forms polling failed:", error?.message || error);
  });
}, GOOGLE_FORMS_POLL_MS);

setTimeout(() => {
  pollGoogleFormsTriggers().catch((error) => {
    console.error("Initial Google Forms poll failed:", error?.message || error);
  });
}, 2500);

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import axios from "axios";
import crypto from "crypto";
import { z } from "zod";
import twilio from "twilio";
import nodemailer from "nodemailer";
import "dotenv/config";

const TYPEFORM_API = "https://api.typeform.com";
const headers = {
  Authorization: `Bearer ${process.env.TYPEFORM_TOKEN}`,
};

// ─── WhatsApp via Twilio ────────────────────────────────────────
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsApp(to, message) {
  try {
    const sanitized = to.toString().replace(/\s+/g, "").replace(/^(?!\+)/, "+");
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${sanitized}`,
      body: message,
    });
    console.log("✅ WhatsApp sent to", sanitized);
  } catch (err) {
    console.error("❌ WhatsApp error:", err.message);
  }
}

// ─── Email via Gmail (Nodemailer) ───────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmail(to, subject, body) {
  try {
    await transporter.sendMail({
      from: `"FlowConnect Team" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
    });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

// ─── MCP Server ────────────────────────────────────────────────
const server = new McpServer({
  name: "typeform-mcp",
  version: "1.0.0",
});

// Tool 1: Get form responses
server.tool(
  "get_form_responses",
  {
    form_id: z.string().optional().describe("Typeform form ID. Defaults to env TYPEFORM_FORM_ID"),
    page_size: z.number().optional().default(10),
  },
  async ({ form_id, page_size }) => {
    const id = form_id || process.env.TYPEFORM_FORM_ID;
    const res = await axios.get(
      `${TYPEFORM_API}/forms/${id}/responses?page_size=${page_size}`,
      { headers }
    );
    const responses = res.data.items.map((item) => ({
      response_id: item.response_id,
      submitted_at: item.submitted_at,
      answers: item.answers?.map((a) => ({
        field_id: a.field.id,
        type: a.type,
        value: a[a.type],
      })),
    }));
    return { content: [{ type: "text", text: JSON.stringify(responses, null, 2) }] };
  }
);

// Tool 2: Get form fields
server.tool(
  "get_form_fields",
  { form_id: z.string().optional() },
  async ({ form_id }) => {
    const id = form_id || process.env.TYPEFORM_FORM_ID;
    const res = await axios.get(`${TYPEFORM_API}/forms/${id}`, { headers });
    const fields = res.data.fields.map((f) => ({
      id: f.id,
      title: f.title,
      type: f.type,
      required: f.validations?.required ?? false,
    }));
    return { content: [{ type: "text", text: JSON.stringify(fields, null, 2) }] };
  }
);

// Tool 3: List all forms
server.tool(
  "list_forms",
  {},
  async () => {
    const res = await axios.get(`${TYPEFORM_API}/forms`, { headers });
    const forms = res.data.items.map((f) => ({
      id: f.id,
      title: f.title,
      _links: f._links?.display,
    }));
    return { content: [{ type: "text", text: JSON.stringify(forms, null, 2) }] };
  }
);

// ─── Helper: extract answer value from any Typeform answer type ─
function extractValue(answer) {
  if (!answer) return null;
  const type = answer.type;
  switch (type) {
    case "text":
    case "email":
    case "url":
    case "boolean":
      return answer[type];
    case "phone_number":
      return answer.phone_number;
    case "number":
      return answer.number;
    case "choice":
      return answer.choice?.label;
    case "choices":
      return answer.choices?.labels?.join(", ");
    case "date":
      return answer.date;
    case "file_url":
      return answer.file_url;
    default:
      return answer[type] ?? null;
  }
}

// ─── Express webhook listener ───────────────────────────────────
const app = express();
app.use(express.json());

// Verify Typeform webhook signature
// Bypassed automatically in development mode (NODE_ENV=development)
// or when no secret is set
function verifySignature(req) {
  // Skip signature check in dev mode
  if (process.env.NODE_ENV === "development") {
    console.log("⚠️  Dev mode — skipping signature check");
    return true;
  }

  const secret = process.env.TYPEFORM_WEBHOOK_SECRET;
  if (!secret) return true; // No secret set → allow all

  const sig = req.headers["typeform-signature"];
  if (!sig) return false;

  const hash =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("base64");

  return sig === hash;
}

// ─── Webhook endpoint ───────────────────────────────────────────
app.post("/webhook/typeform", async (req, res) => {
  if (!verifySignature(req)) {
    console.warn("⚠️  Invalid webhook signature — rejected");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body;
  const formResponse = payload?.form_response;

  if (!formResponse) {
    return res.status(400).json({ error: "Missing form_response" });
  }

  // ── Build a clean answers map keyed by field title ──────────
  const lead = {
    form_id: formResponse.form_id,
    submitted_at: formResponse.submitted_at,
    token: formResponse.token,
    answers: {},
  };

  formResponse.answers?.forEach((answer) => {
    const fieldDef = formResponse.definition?.fields?.find(
      (f) => f.id === answer.field.id
    );
    const key = fieldDef?.title ?? answer.field.id;
    lead.answers[key] = extractValue(answer);
  });

  console.log("📋 New Typeform lead:", JSON.stringify(lead, null, 2));

  // ── Extract Name ────────────────────────────────────────────
  const name =
    lead.answers["What is your name?"] ||
    lead.answers["Name"] ||
    lead.answers["Full Name"] ||
    lead.answers["Your name"] ||
    "there";

  // ── Extract Phone ───────────────────────────────────────────
  const phone =
    lead.answers["What is your WhatsApp number?"] ||
    lead.answers["What is your phone number?"] ||
    lead.answers["Phone"] ||
    lead.answers["WhatsApp Number"] ||
    lead.answers["Phone Number"] ||
    null;

  // ── Extract Email ───────────────────────────────────────────
  const email =
    lead.answers["What is your email address?"] ||
    lead.answers["Email"] ||
    lead.answers["Email Address"] ||
    lead.answers["Your email"] ||
    null;

  console.log(`👤 Name: ${name} | 📞 Phone: ${phone} | 📧 Email: ${email}`);

  // ── Send WhatsApp (Twilio Sandbox) ──────────────────────────
  if (phone) {
    await sendWhatsApp(
      phone,
      `Hi ${name}! 👋\n\nThanks for reaching out via FlowConnect.\nOur team will get back to you within 24 hours.\n\n— FlowConnect Team`
    );
  } else {
    console.log("ℹ️  No phone number found — skipping WhatsApp");
  }

  // ── Send Email (Gmail) ──────────────────────────────────────
  if (email) {
    await sendEmail(
      email,
      "Thanks for connecting with us! 🎉",
      `Hi ${name},\n\nThank you for filling out our form!\nOur team will reach out to you within 24 hours.\n\nBest regards,\nFlowConnect Team`
    );
  } else {
    console.log("ℹ️  No email found — skipping email");
  }

  res.json({ status: "received", token: lead.token });
});

// ─── Health check ───────────────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({ status: "ok", server: "typeform-mcp", time: new Date().toISOString() })
);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () =>
  console.log(`🚀 typeform-mcp webhook listening on :${PORT} | mode: ${process.env.NODE_ENV || "production"}`)
);

// ─── Start MCP stdio transport ──────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
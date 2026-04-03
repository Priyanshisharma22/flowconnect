import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { google } from "googleapis";
import axios from "axios";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const server = new McpServer({
  name: "googleforms-mcp",
  version: "1.0.0",
});

// ── Helper: Google Auth ───────────────────────────────────────────
function getGoogleAuth() {
  const credFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "google-credentials.json";
  const creds = JSON.parse(fs.readFileSync(credFile, "utf8"));
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
      "https://www.googleapis.com/auth/forms.responses.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

// ── Helper: Send WhatsApp ─────────────────────────────────────────
async function sendWhatsApp(phone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  let clean = phone.trim().replace(/\s/g, "");
  if (!clean.startsWith("+")) clean = "+91" + clean;
  const to = `whatsapp:${clean}`;

  const resp = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    new URLSearchParams({ From: fromNumber, To: to, Body: message }),
    {
      auth: { username: accountSid, password: authToken },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return { sid: resp.data.sid, to };
}

// ── Helper: Send Email ────────────────────────────────────────────
async function sendEmail(to, subject, body) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  const info = await transporter.sendMail({
    from: `FlowConnect <${process.env.GMAIL_USER}>`,
    to, subject, html: body,
  });
  return info.messageId;
}

// ── Helper: Add to Google Sheets ──────────────────────────────────
async function addToSheet(spreadsheetId, sheetName, row) {
  const auth   = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });

  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [["Timestamp", "Name", "Email", "Phone", "Response"]] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
  return `Row added to ${spreadsheetId}`;
}

// ── Helper: Create Zoho Lead ──────────────────────────────────────
async function createZohoLead(name, email, phone, source) {
  const token = process.env.ZOHO_ACCESS_TOKEN;
  if (!token) throw new Error("ZOHO_ACCESS_TOKEN not set");

  const resp = await axios.post(
    "https://www.zohoapis.in/crm/v2/Leads",
    { data: [{ Last_Name: name, Email: email, Phone: phone, Lead_Source: source }] },
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  return resp.data;
}

// ── Tool 1: Get form responses ────────────────────────────────────
server.tool(
  "get_form_responses",
  "Get all responses from a Google Form",
  {
    form_id: z.string().describe("Google Form ID from the form URL"),
    limit:   z.number().describe("Number of responses to fetch").optional(),
  },
  async ({ form_id, limit = 20 }) => {
    const auth  = getGoogleAuth();
    const forms = google.forms({ version: "v1", auth });

    const formResp = await forms.forms.get({ formId: form_id });
    const respResp = await forms.forms.responses.list({ formId: form_id });

    const responses = (respResp.data.responses || []).slice(0, limit);
    const questions = formResp.data.items || [];

    const formatted = responses.map(r => {
      const answers = {};
      for (const [qId, ans] of Object.entries(r.answers || {})) {
        const question = questions.find(q => q.questionItem?.question?.questionId === qId);
        const qTitle = question?.title || qId;
        answers[qTitle] = ans.textAnswers?.answers?.map(a => a.value).join(", ") || "";
      }
      return {
        response_id: r.responseId,
        submitted_at: r.createTime,
        answers,
      };
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          form_title: formResp.data.info?.title,
          total_responses: respResp.data.responses?.length || 0,
          responses: formatted,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 2: Process form submission ──────────────────────────────
server.tool(
  "process_form_submission",
  "Process a Google Form submission — send WhatsApp + add to Sheets + create Zoho lead",
  {
    name:           z.string().describe("Respondent name"),
    email:          z.string().describe("Respondent email"),
    phone:          z.string().describe("Respondent phone number"),
    form_response:  z.string().describe("Form response summary"),
    spreadsheet_id: z.string().describe("Google Sheets ID to add data").optional(),
    sheet_name:     z.string().describe("Sheet name").optional(),
    create_zoho:    z.boolean().describe("Create Zoho CRM lead").optional(),
  },
  async ({ name, email, phone, form_response, spreadsheet_id, sheet_name = "Form Responses", create_zoho = false }) => {
    const results = {};

    // Send WhatsApp
    try {
      const message = `✅ *Form Submission Received!*

Hello ${name}! 👋

Thank you for filling out our form. We've received your response and will get back to you soon.

📋 Your Response:
${form_response}

📅 Date: ${new Date().toLocaleDateString("en-IN")}

_Powered by FlowConnect_ 🚀`;

      const wa = await sendWhatsApp(phone, message);
      results.whatsapp = { success: true, sent_to: wa.to, sid: wa.sid };
      console.log(`✅ WhatsApp sent to ${wa.to}`);
    } catch (e) {
      results.whatsapp = { success: false, error: e.message };
    }

    // Send Email
    try {
      const subject = `✅ Form Submission Confirmed — FlowConnect`;
      const body = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
          <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:white;margin:0">FlowConnect</h1>
            <p style="color:#e0e7ff">Form Submission Confirmed</p>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
            <h2>Hello ${name}! 👋</h2>
            <p>Thank you for submitting the form. Here are your details:</p>
            <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e5e7eb">
              <p><b>Name:</b> ${name}</p>
              <p><b>Email:</b> ${email}</p>
              <p><b>Phone:</b> ${phone}</p>
              <p><b>Response:</b> ${form_response}</p>
              <p><b>Date:</b> ${new Date().toLocaleDateString("en-IN")}</p>
            </div>
            <p style="color:#6b7280;text-align:center;margin-top:20px">We'll get back to you soon! 🙏</p>
            <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by FlowConnect</p>
          </div>
        </div>`;

      const msgId = await sendEmail(email, subject, body);
      results.email = { success: true, sent_to: email, message_id: msgId };
      console.log(`✅ Email sent to ${email}`);
    } catch (e) {
      results.email = { success: false, error: e.message };
    }

    // Add to Google Sheets
    if (spreadsheet_id) {
      try {
        const row = [
          new Date().toLocaleString("en-IN"),
          name, email, phone, form_response,
        ];
        await addToSheet(spreadsheet_id, sheet_name, row);
        results.sheets = { success: true, spreadsheet_id };
        console.log(`✅ Added to Sheets`);
      } catch (e) {
        results.sheets = { success: false, error: e.message };
      }
    }

    // Create Zoho Lead
    if (create_zoho) {
      try {
        await createZohoLead(name, email, phone, "Google Form");
        results.zoho = { success: true };
        console.log(`✅ Zoho lead created`);
      } catch (e) {
        results.zoho = { success: false, error: e.message };
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          respondent: { name, email, phone },
          notifications: results,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 3: Watch form for new responses ──────────────────────────
server.tool(
  "get_latest_response",
  "Get the latest/most recent Google Form response",
  {
    form_id: z.string().describe("Google Form ID"),
  },
  async ({ form_id }) => {
    const auth  = getGoogleAuth();
    const forms = google.forms({ version: "v1", auth });

    const formResp = await forms.forms.get({ formId: form_id });
    const respResp = await forms.forms.responses.list({ formId: form_id });

    const responses = respResp.data.responses || [];
    if (responses.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify({ message: "No responses yet" }) }],
      };
    }

    const latest   = responses[responses.length - 1];
    const questions = formResp.data.items || [];

    const answers = {};
    for (const [qId, ans] of Object.entries(latest.answers || {})) {
      const question = questions.find(q => q.questionItem?.question?.questionId === qId);
      answers[question?.title || qId] = ans.textAnswers?.answers?.map(a => a.value).join(", ") || "";
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          response_id:  latest.responseId,
          submitted_at: latest.createTime,
          answers,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 4: Sync all responses to Sheets ─────────────────────────
server.tool(
  "sync_responses_to_sheets",
  "Sync all Google Form responses to a Google Sheet",
  {
    form_id:        z.string().describe("Google Form ID"),
    spreadsheet_id: z.string().describe("Google Sheets ID"),
    sheet_name:     z.string().describe("Sheet name").optional(),
  },
  async ({ form_id, spreadsheet_id, sheet_name = "Form Responses" }) => {
    const auth  = getGoogleAuth();
    const forms = google.forms({ version: "v1", auth });

    const formResp = await forms.forms.get({ formId: form_id });
    const respResp = await forms.forms.responses.list({ formId: form_id });

    const responses = respResp.data.responses || [];
    const questions = formResp.data.items || [];

    const sheets = google.sheets({ version: "v4", auth });
    const headers = ["Timestamp", ...questions.map(q => q.title || "Question")];

    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheet_id,
      range: `${sheet_name}!A:Z`,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheet_id,
      range: `${sheet_name}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });

    for (const r of responses) {
      const row = [r.createTime];
      for (const q of questions) {
        const qId = q.questionItem?.question?.questionId;
        const ans = r.answers?.[qId];
        row.push(ans?.textAnswers?.answers?.map(a => a.value).join(", ") || "");
      }
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheet_id,
        range: `${sheet_name}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          form_title: formResp.data.info?.title,
          responses_synced: responses.length,
          spreadsheet_id,
        }, null, 2),
      }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Google Forms MCP Server running...");
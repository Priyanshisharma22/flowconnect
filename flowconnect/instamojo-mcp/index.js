import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const headers = {
  "X-Api-Key":    process.env.INSTAMOJO_API_KEY,
  "X-Auth-Token": process.env.INSTAMOJO_AUTH_TOKEN,
  "Content-Type": "application/json",
};

const BASE_URL = process.env.INSTAMOJO_BASE_URL || "https://www.instamojo.com/api/1.1";

const server = new McpServer({
  name: "instamojo-mcp",
  version: "1.0.0",
});

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

// ── Helper: Send Email via Gmail ──────────────────────────────────
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
    to,
    subject,
    html: body,
  });
  return info.messageId;
}

// ── Tool 1: Get all payments ──────────────────────────────────────
server.tool(
  "get_payments",
  "Get all Instamojo payments with optional limit",
  {
    limit: z.number().describe("Number of payments to fetch (default 20)").optional(),
  },
  async ({ limit = 20 }) => {
    const resp = await axios.get(`${BASE_URL}/payments/`, {
      headers,
      params: { limit },
    });

    const payments = resp.data.payments || [];
    const total = payments
      .filter(p => p.status === "Credit")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          total_payments: payments.length,
          successful: payments.filter(p => p.status === "Credit").length,
          total_amount: `Rs.${total.toFixed(2)}`,
          payments: payments.map(p => ({
            id: p.payment_id,
            amount: `Rs.${p.amount}`,
            status: p.status,
            buyer: p.buyer,
            buyer_email: p.buyer_email,
            buyer_phone: p.buyer_phone,
            purpose: p.purpose,
            date: p.created_at,
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 2: Get payment by ID ─────────────────────────────────────
server.tool(
  "get_payment_by_id",
  "Get details of a specific Instamojo payment",
  {
    payment_id: z.string().describe("Instamojo payment ID"),
  },
  async ({ payment_id }) => {
    const resp = await axios.get(`${BASE_URL}/payments/${payment_id}/`, { headers });
    const p = resp.data.payment;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: p.payment_id,
          amount: `Rs.${p.amount}`,
          status: p.status,
          buyer: p.buyer,
          buyer_email: p.buyer_email,
          buyer_phone: p.buyer_phone,
          purpose: p.purpose,
          fees: p.fees,
          date: p.created_at,
          link: p.payment_request,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 3: Get payment links ─────────────────────────────────────
server.tool(
  "get_payment_links",
  "Get all Instamojo payment links/requests",
  {
    limit: z.number().describe("Number of payment links to fetch").optional(),
  },
  async ({ limit = 20 }) => {
    const resp = await axios.get(`${BASE_URL}/payment-requests/`, {
      headers,
      params: { limit },
    });

    const links = resp.data.payment_requests || [];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          total_links: links.length,
          links: links.map(l => ({
            id: l.id,
            purpose: l.purpose,
            amount: `Rs.${l.amount}`,
            status: l.status,
            shorturl: l.shorturl,
            payments: l.payments?.length || 0,
            created: l.created_at,
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 4: Create payment link ───────────────────────────────────
server.tool(
  "create_payment_link",
  "Create a new Instamojo payment link",
  {
    purpose:  z.string().describe("Purpose/description of payment"),
    amount:   z.number().describe("Amount in rupees"),
    name:     z.string().describe("Your name or business name"),
    email:    z.string().describe("Your email").optional(),
    phone:    z.string().describe("Your phone number").optional(),
    send_sms: z.boolean().describe("Send SMS to buyer").optional(),
  },
  async ({ purpose, amount, name, email, phone, send_sms = false }) => {
    const resp = await axios.post(
      `${BASE_URL}/payment-requests/`,
      { purpose, amount, buyer_name: name, email, phone, send_sms },
      { headers }
    );

    const link = resp.data.payment_request;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          payment_link: link.longurl,
          short_link: link.shorturl,
          id: link.id,
          purpose: link.purpose,
          amount: `Rs.${link.amount}`,
          expires: link.expires_at,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 5: Get today's summary ───────────────────────────────────
server.tool(
  "get_todays_summary",
  "Get today's Instamojo payment summary",
  {},
  async () => {
    const resp = await axios.get(`${BASE_URL}/payments/`, {
      headers,
      params: { limit: 100 },
    });

    const allPayments = resp.data.payments || [];
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = allPayments.filter(p => p.created_at?.startsWith(today));
    const captured = todayPayments.filter(p => p.status === "Credit");
    const total = captured.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          date: today,
          total_payments: todayPayments.length,
          successful: captured.length,
          failed: todayPayments.length - captured.length,
          total_amount: `Rs.${total.toFixed(2)}`,
          payments: captured.map(p => ({
            id: p.payment_id,
            amount: `Rs.${p.amount}`,
            buyer: p.buyer,
            purpose: p.purpose,
            time: p.created_at,
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 6: Search payment ────────────────────────────────────────
server.tool(
  "search_payment",
  "Search Instamojo payments by buyer email or phone",
  {
    query: z.string().describe("Email or phone number to search"),
  },
  async ({ query }) => {
    const resp = await axios.get(`${BASE_URL}/payments/`, {
      headers,
      params: { limit: 100 },
    });

    const payments = resp.data.payments || [];
    const results = payments.filter(p =>
      p.buyer_email?.includes(query) ||
      p.buyer_phone?.includes(query) ||
      p.buyer?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query,
          found: results.length,
          payments: results.map(p => ({
            id: p.payment_id,
            amount: `Rs.${p.amount}`,
            status: p.status,
            buyer: p.buyer,
            email: p.buyer_email,
            phone: p.buyer_phone,
            purpose: p.purpose,
            date: p.created_at,
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 7: Send summary to WhatsApp ─────────────────────────────
server.tool(
  "send_summary_whatsapp",
  "Get today's Instamojo summary and send to WhatsApp",
  {
    phone: z.string().describe("WhatsApp phone number e.g. +918755735767"),
  },
  async ({ phone }) => {
    const resp = await axios.get(`${BASE_URL}/payments/`, {
      headers,
      params: { limit: 100 },
    });

    const allPayments = resp.data.payments || [];
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = allPayments.filter(p => p.created_at?.startsWith(today));
    const captured = todayPayments.filter(p => p.status === "Credit");
    const total = captured.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const message = `💰 *Instamojo Daily Report*
📅 Date: ${today}

✅ Successful: ${captured.length}
❌ Failed: ${todayPayments.length - captured.length}
💵 Total Revenue: *Rs.${total.toFixed(2)}*

${captured.slice(0, 5).map((p, i) =>
  `${i + 1}. ${p.buyer || "Customer"} — Rs.${p.amount}`
).join("\n")}

_Powered by FlowConnect_ 🚀`;

    const wa = await sendWhatsApp(phone, message);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          sent_to: wa.to,
          message_sid: wa.sid,
          summary: {
            date: today,
            successful: captured.length,
            total_amount: `Rs.${total.toFixed(2)}`,
          },
        }, null, 2),
      }],
    };
  }
);

// ── Tool 8: Send payment confirmation email ───────────────────────
server.tool(
  "send_payment_email",
  "Send payment confirmation email to a customer",
  {
    to_email:    z.string().describe("Customer email address"),
    buyer_name:  z.string().describe("Customer name"),
    amount:      z.number().describe("Payment amount"),
    purpose:     z.string().describe("Payment purpose"),
    payment_id:  z.string().describe("Instamojo payment ID"),
  },
  async ({ to_email, buyer_name, amount, purpose, payment_id }) => {
    const subject = `✅ Payment Confirmed — Rs.${amount} | FlowConnect`;
    const body = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
        <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:white;margin:0">FlowConnect</h1>
          <p style="color:#e0e7ff;margin:5px 0">Payment Confirmation</p>
        </div>
        <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
          <h2 style="color:#111827">Hello ${buyer_name}! 👋</h2>
          <p style="color:#6b7280">Your payment has been received successfully.</p>
          <div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb">
            <table style="width:100%">
              <tr><td style="color:#6b7280;padding:8px 0">Payment ID</td><td style="font-weight:bold">${payment_id}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0">Amount</td><td style="font-weight:bold;color:#6366f1">Rs.${amount}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0">Purpose</td><td style="font-weight:bold">${purpose}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0">Date</td><td style="font-weight:bold">${new Date().toLocaleDateString("en-IN")}</td></tr>
              <tr><td style="color:#6b7280;padding:8px 0">Status</td><td style="color:green;font-weight:bold">✅ Confirmed</td></tr>
            </table>
          </div>
          <p style="color:#6b7280;text-align:center">Thank you for your payment! 🙏</p>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Powered by FlowConnect</p>
        </div>
      </div>`;

    const msgId = await sendEmail(to_email, subject, body);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          message_id: msgId,
          sent_to: to_email,
          subject,
        }, null, 2),
      }],
    };
  }
);

// ── Tool 9: Full payment flow (WhatsApp + Email) ──────────────────
server.tool(
  "notify_payment_complete",
  "Send both WhatsApp and Email notification after Instamojo payment",
  {
    payment_id: z.string().describe("Instamojo payment ID"),
  },
  async ({ payment_id }) => {
    const resp = await axios.get(`${BASE_URL}/payments/${payment_id}/`, { headers });
    const p = resp.data.payment;

    const results = {};

    // Send WhatsApp
    if (p.buyer_phone) {
      try {
        const message = `✅ *Payment Confirmed!*

Hello ${p.buyer}! 👋
Your payment is confirmed.

💵 Amount: *Rs.${p.amount}*
📦 Purpose: ${p.purpose}
🆔 Payment ID: ${p.payment_id}
📅 Date: ${new Date().toLocaleDateString("en-IN")}

Thank you! 🙏
_FlowConnect_`;

        const wa = await sendWhatsApp(p.buyer_phone, message);
        results.whatsapp = { success: true, sent_to: wa.to };
      } catch (e) {
        results.whatsapp = { success: false, error: e.message };
      }
    }

    // Send Email
    if (p.buyer_email) {
      try {
        const subject = `✅ Payment Confirmed — Rs.${p.amount}`;
        const body = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
            <div style="background:#6366f1;padding:20px;border-radius:8px 8px 0 0;text-align:center">
              <h1 style="color:white;margin:0">FlowConnect</h1>
            </div>
            <div style="background:#f9fafb;padding:30px;border-radius:0 0 8px 8px">
              <h2>Hello ${p.buyer}! 👋</h2>
              <p>Payment ID: <b>${p.payment_id}</b></p>
              <p>Amount: <b style="color:#6366f1">Rs.${p.amount}</b></p>
              <p>Purpose: <b>${p.purpose}</b></p>
              <p>Status: <b style="color:green">✅ Confirmed</b></p>
              <p style="color:#9ca3af;font-size:12px">Powered by FlowConnect</p>
            </div>
          </div>`;

        const msgId = await sendEmail(p.buyer_email, subject, body);
        results.email = { success: true, sent_to: p.buyer_email, message_id: msgId };
      } catch (e) {
        results.email = { success: false, error: e.message };
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          payment_id,
          buyer: p.buyer,
          amount: `Rs.${p.amount}`,
          notifications: results,
        }, null, 2),
      }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Instamojo MCP Server running...");
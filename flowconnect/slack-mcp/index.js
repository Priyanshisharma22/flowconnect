#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  process.stderr.write("ERROR: SLACK_WEBHOOK_URL not set in .env\n");
  process.exit(1);
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "send_message",
    description: "Send a plain text message to a Slack channel via webhook.",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Message text to send to Slack channel.",
        },
        emoji: {
          type: "string",
          description: "Optional emoji icon for the bot e.g. ':rocket:'",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "send_payment_alert",
    description:
      "Send a rich formatted payment alert to Slack. Perfect for startup teams monitoring revenue.",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Payment amount in rupees.",
        },
        customer_name: {
          type: "string",
          description: "Name of the customer.",
        },
        plan: {
          type: "string",
          description: "Plan or product purchased.",
        },
        payment_id: {
          type: "string",
          description: "Payment/transaction ID.",
        },
      },
      required: ["amount", "customer_name"],
    },
  },
  {
    name: "send_notification",
    description:
      "Send a general notification to Slack (new signup, form submit, new order etc).",
    inputSchema: {
      type: "object",
      properties: {
        event_type: {
          type: "string",
          description: "Type of event e.g. 'New Signup', 'Form Submitted'.",
        },
        details: {
          type: "string",
          description: "Details about the event.",
        },
        color: {
          type: "string",
          description: "Sidebar color: 'good' (green), 'warning' (yellow), 'danger' (red), or hex like '#0099ff'.",
        },
      },
      required: ["event_type", "details"],
    },
  },
  {
    name: "send_block",
    description: "Send a rich Block Kit message to Slack with sections and fields.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Bold title of the message.",
        },
        body: {
          type: "string",
          description: "Main body text.",
        },
        fields: {
          type: "array",
          description: "Optional array of {title, value} fields shown in two columns.",
        },
      },
      required: ["title", "body"],
    },
  },
];

// ─── API calls ────────────────────────────────────────────────────────────────

async function sendWebhook(payload) {
  const resp = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Slack webhook error: ${resp.status} - ${text}`);
  }

  return { success: true };
}

async function sendMessage({ message, emoji }) {
  await sendWebhook({
    text: message,
    icon_emoji: emoji || ":zap:",
    username: "FlowConnect",
  });
  return {
    success: true,
    message: "Message sent to Slack successfully",
  };
}

async function sendPaymentAlert({ amount, customer_name, plan, payment_id }) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendWebhook({
    username: "FlowConnect Payments",
    icon_emoji: ":money_with_wings:",
    attachments: [
      {
        color: "good",
        title: "💰 New Payment Received!",
        fields: [
          { title: "👤 Customer", value: customer_name, short: true },
          { title: "💵 Amount", value: `₹${amount}`, short: true },
          ...(plan ? [{ title: "📦 Plan", value: plan, short: true }] : []),
          ...(payment_id ? [{ title: "🔖 Payment ID", value: payment_id, short: true }] : []),
          { title: "⏰ Time", value: now, short: false },
        ],
        footer: "FlowConnect Payment System",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
  return {
    success: true,
    message: `Payment alert sent to Slack for ₹${amount} from ${customer_name}`,
  };
}

async function sendNotification({ event_type, details, color }) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendWebhook({
    username: "FlowConnect Alerts",
    icon_emoji: ":bell:",
    attachments: [
      {
        color: color || "#0099ff",
        title: `🔔 ${event_type}`,
        text: details,
        fields: [{ title: "⏰ Time", value: now, short: false }],
        footer: "FlowConnect Notification System",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  });
  return {
    success: true,
    message: `Notification sent to Slack: ${event_type}`,
  };
}

async function sendBlock({ title, body, fields }) {
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: title, emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: body },
    },
  ];

  if (fields && fields.length > 0) {
    blocks.push({
      type: "section",
      fields: fields.map((f) => ({
        type: "mrkdwn",
        text: `*${f.title}*\n${f.value}`,
      })),
    });
  }

  blocks.push({ type: "divider" });

  await sendWebhook({
    username: "FlowConnect",
    icon_emoji: ":zap:",
    blocks,
  });

  return { success: true, message: "Block message sent to Slack" };
}

// ─── MCP stdio transport ──────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

async function handleRequest(req) {
  const { id, method, params } = req;

  if (method === "initialize") {
    return send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "slack-mcp", version: "1.0.0" },
      },
    });
  }

  if (method === "notifications/initialized") return;

  if (method === "tools/list") {
    return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      let result;
      if (name === "send_message") result = await sendMessage(args);
      else if (name === "send_payment_alert") result = await sendPaymentAlert(args);
      else if (name === "send_notification") result = await sendNotification(args);
      else if (name === "send_block") result = await sendBlock(args);
      else throw new Error(`Unknown tool: ${name}`);

      return send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        },
      });
    } catch (err) {
      process.stderr.write(`Tool error: ${err.message}\n`);
      return send({
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: `Error: ${err.message}` }],
          isError: true,
        },
      });
    }
  }

  if (id !== undefined) {
    return send({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
}

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    handleRequest(req).catch((err) =>
      process.stderr.write(`Unhandled error: ${err.message}\n`)
    );
  } catch (e) {
    process.stderr.write(`JSON parse error: ${e.message}\n`);
  }
});

process.stderr.write("Slack MCP server started\n");
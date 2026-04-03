#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  process.stderr.write("ERROR: DISCORD_WEBHOOK_URL not set in .env\n");
  process.exit(1);
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "send_message",
    description: "Send a plain text message to a Discord channel via webhook.",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Message text to send to Discord channel.",
        },
        username: {
          type: "string",
          description: "Optional bot display name override.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "send_payment_alert",
    description:
      "Send a rich embedded payment alert to Discord. Great for sales monitoring in creator communities.",
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
    name: "send_embed",
    description:
      "Send a rich embedded message to Discord with title, description, color and fields.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Embed title.",
        },
        description: {
          type: "string",
          description: "Embed description/body text.",
        },
        color: {
          type: "number",
          description:
            "Embed color as decimal (e.g. 5763719 for green, 15548997 for red, 3447003 for blue).",
        },
        fields: {
          type: "array",
          description: "Optional array of {name, value, inline} fields.",
        },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "send_notification",
    description:
      "Send a general notification alert to Discord (new signup, form submit, etc).",
    inputSchema: {
      type: "object",
      properties: {
        event_type: {
          type: "string",
          description:
            "Type of event e.g. 'New Signup', 'Form Submitted', 'New Order'.",
        },
        details: {
          type: "string",
          description: "Details about the event.",
        },
      },
      required: ["event_type", "details"],
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
    throw new Error(`Discord webhook error: ${resp.status} - ${text}`);
  }

  return { success: true };
}

async function sendMessage({ message, username }) {
  await sendWebhook({
    content: message,
    username: username || "FlowConnect",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
  });
  return {
    success: true,
    message: `Message sent to Discord successfully`,
  };
}

async function sendPaymentAlert({ amount, customer_name, plan, payment_id }) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendWebhook({
    username: "FlowConnect Payments",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    embeds: [
      {
        title: "💰 New Payment Received!",
        color: 5763719, // green
        fields: [
          { name: "👤 Customer", value: customer_name, inline: true },
          { name: "💵 Amount", value: `₹${amount}`, inline: true },
          ...(plan ? [{ name: "📦 Plan", value: plan, inline: true }] : []),
          ...(payment_id
            ? [{ name: "🔖 Payment ID", value: `\`${payment_id}\``, inline: false }]
            : []),
          { name: "⏰ Time", value: now, inline: false },
        ],
        footer: { text: "FlowConnect Payment System" },
        timestamp: new Date().toISOString(),
      },
    ],
  });
  return {
    success: true,
    message: `Payment alert sent to Discord for ₹${amount} from ${customer_name}`,
  };
}

async function sendEmbed({ title, description, color, fields }) {
  await sendWebhook({
    username: "FlowConnect",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    embeds: [
      {
        title,
        description,
        color: color || 3447003,
        fields: fields || [],
        timestamp: new Date().toISOString(),
        footer: { text: "FlowConnect" },
      },
    ],
  });
  return { success: true, message: `Embed sent to Discord` };
}

async function sendNotification({ event_type, details }) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  await sendWebhook({
    username: "FlowConnect Alerts",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/2936/2936886.png",
    embeds: [
      {
        title: `🔔 ${event_type}`,
        description: details,
        color: 3447003, // blue
        fields: [{ name: "⏰ Time", value: now, inline: false }],
        timestamp: new Date().toISOString(),
        footer: { text: "FlowConnect Notification System" },
      },
    ],
  });
  return {
    success: true,
    message: `Notification sent to Discord: ${event_type}`,
  };
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
        serverInfo: { name: "discord-mcp", version: "1.0.0" },
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
      else if (name === "send_embed") result = await sendEmbed(args);
      else if (name === "send_notification") result = await sendNotification(args);
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

process.stderr.write("Discord MCP server started\n");
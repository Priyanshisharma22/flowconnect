#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  process.stderr.write("ERROR: TELEGRAM_BOT_TOKEN not set in .env\n");
  process.exit(1);
}

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "send_message",
    description:
      "Send a text message to a Telegram chat, group, or channel. Use for alerts, notifications, and updates.",
    inputSchema: {
      type: "object",
      properties: {
        chat_id: {
          type: "string",
          description:
            "Telegram chat ID or @channel_username. For groups use negative ID like -1001234567890.",
        },
        message: {
          type: "string",
          description: "Message text to send. Supports Markdown formatting.",
        },
        parse_mode: {
          type: "string",
          description: "Optional: 'Markdown' or 'HTML' for formatted messages.",
        },
      },
      required: ["chat_id", "message"],
    },
  },
  {
    name: "send_payment_alert",
    description:
      "Send a formatted payment/sales alert to a Telegram chat. Perfect for business sales monitoring.",
    inputSchema: {
      type: "object",
      properties: {
        chat_id: {
          type: "string",
          description: "Telegram chat ID or @channel_username.",
        },
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
      required: ["chat_id", "amount", "customer_name"],
    },
  },
  {
    name: "get_bot_info",
    description: "Get information about the Telegram bot (name, username, ID).",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_updates",
    description:
      "Get recent messages/updates sent to the bot. Useful to find chat IDs.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ─── API calls ────────────────────────────────────────────────────────────────

async function apiCall(method, body = {}) {
  const resp = await fetch(`${BASE_URL}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
  return data.result;
}

async function sendMessage({ chat_id, message, parse_mode }) {
  const result = await apiCall("sendMessage", {
    chat_id,
    text: message,
    parse_mode: parse_mode || "Markdown",
  });
  return {
    success: true,
    message_id: result.message_id,
    chat_id: result.chat.id,
    message: `Message sent successfully to ${chat_id}`,
  };
}

async function sendPaymentAlert({ chat_id, amount, customer_name, plan, payment_id }) {
  const text =
    `💰 *New Payment Received!*\n\n` +
    `👤 *Customer:* ${customer_name}\n` +
    `💵 *Amount:* ₹${amount}\n` +
    (plan ? `📦 *Plan:* ${plan}\n` : "") +
    (payment_id ? `🔖 *Payment ID:* \`${payment_id}\`\n` : "") +
    `⏰ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

  const result = await apiCall("sendMessage", {
    chat_id,
    text,
    parse_mode: "Markdown",
  });

  return {
    success: true,
    message_id: result.message_id,
    message: `Payment alert sent to ${chat_id}`,
  };
}

async function getBotInfo() {
  const result = await apiCall("getMe");
  return {
    success: true,
    id: result.id,
    name: result.first_name,
    username: `@${result.username}`,
    message: `Bot: ${result.first_name} (@${result.username})`,
  };
}

async function getUpdates() {
  const result = await apiCall("getUpdates");
  const chats = result.map((u) => ({
    chat_id: u.message?.chat?.id,
    chat_type: u.message?.chat?.type,
    chat_title: u.message?.chat?.title || u.message?.chat?.first_name,
    from: u.message?.from?.first_name,
    text: u.message?.text,
  }));
  return {
    success: true,
    updates_count: result.length,
    chats,
    message: `Found ${result.length} recent updates`,
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
        serverInfo: { name: "telegram-mcp", version: "1.0.0" },
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
      else if (name === "get_bot_info") result = await getBotInfo();
      else if (name === "get_updates") result = await getUpdates();
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

process.stderr.write("Telegram MCP server started\n");
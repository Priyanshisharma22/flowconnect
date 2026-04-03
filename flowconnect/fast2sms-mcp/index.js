#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

if (!FAST2SMS_API_KEY) {
  process.stderr.write("ERROR: FAST2SMS_API_KEY not set in .env\n");
  process.exit(1);
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "send_sms",
    description:
      "Send SMS to Indian mobile numbers via Fast2SMS. Works for alerts, OTP, and notifications. No opt-in needed. Cost: Rs.0.15 per SMS.",
    inputSchema: {
      type: "object",
      properties: {
        numbers: {
          type: "string",
          description:
            "10-digit Indian mobile number(s). Single: '9876543210' or comma-separated for bulk: '9876543210,9123456789'. Do NOT include +91 prefix.",
        },
        message: {
          type: "string",
          description:
            "SMS text message. Keep under 160 characters for 1 credit per number.",
        },
        sender_id: {
          type: "string",
          description:
            "Optional 6-char sender ID (e.g. FLWCNT). Only works if approved on your Fast2SMS account.",
        },
      },
      required: ["numbers", "message"],
    },
  },
  {
    name: "check_balance",
    description:
      "Check remaining wallet balance (in Rs.) in your Fast2SMS account.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ─── API calls ────────────────────────────────────────────────────────────────

async function sendSMS({ numbers, message, sender_id }) {
  const phone = Array.isArray(numbers) ? numbers.join(",") : String(numbers);
  const cleaned = phone.replace(/\s/g, "");

  const body = new URLSearchParams({
    route: "q",
    numbers: cleaned,
    message: message,
    flash: "0",
  });

  if (sender_id) body.set("sender_id", sender_id);

  process.stderr.write(`Sending SMS to: ${cleaned}\n`);

  const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: FAST2SMS_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
    },
    body: body.toString(),
  });

  const data = await resp.json();
  process.stderr.write(`Fast2SMS response: ${JSON.stringify(data)}\n`);

  if (!data.return) {
    throw new Error(`Fast2SMS API error: ${JSON.stringify(data)}`);
  }

  const count = cleaned.split(",").length;
  return {
    success: true,
    request_id: data.request_id,
    message: `SMS sent successfully to ${cleaned}`,
    numbers_count: count,
    estimated_cost: `Rs.${(count * 0.15).toFixed(2)}`,
    api_response: data,
  };
}

async function checkBalance() {
  const resp = await fetch("https://www.fast2sms.com/dev/wallet", {
    method: "GET",
    headers: {
      authorization: FAST2SMS_API_KEY,
      "cache-control": "no-cache",
    },
  });

  const data = await resp.json();
  process.stderr.write(`Balance response: ${JSON.stringify(data)}\n`);

  if (!data.return) {
    throw new Error(`Fast2SMS wallet error: ${JSON.stringify(data)}`);
  }

  return {
    success: true,
    wallet_balance: `Rs.${data.wallet}`,
    sms_remaining: Math.floor(data.wallet / 0.15),
    message: `Wallet has Rs.${data.wallet} (~${Math.floor(data.wallet / 0.15)} SMS remaining)`,
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
        serverInfo: { name: "fast2sms-mcp", version: "1.0.0" },
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
      if (name === "send_sms") result = await sendSMS(args);
      else if (name === "check_balance") result = await checkBalance();
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

process.stderr.write("Fast2SMS MCP server started\n");
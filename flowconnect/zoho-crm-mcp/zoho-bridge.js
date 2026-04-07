// zoho-bridge.js
// Run: node zoho-bridge.js
// This wraps your MCP stdio server with an HTTP API so the frontend can call it.

require("dotenv").config();
const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

const PORT = process.env.ZOHO_BRIDGE_PORT || 3001;

// ─── MCP caller (same pattern as your existing client.js) ────────────────────
function callZohoMCP(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, "index.js")], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "inherit"],
    });

    let buffer = "";
    let initialized = false;
    let done = false;

    function finish(result, error) {
      if (done) return;
      done = true;
      child.kill();
      if (error) reject(error);
      else resolve(result);
    }

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          // Step 1: initialize response → send tool call
          if (!initialized && msg.id === 1 && msg.result?.serverInfo) {
            initialized = true;
            child.stdin.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: { name: toolName, arguments: args },
              }) + "\n"
            );
          }

          // Step 2: tool call response
          if (msg.id === 2) {
            if (msg.result?.isError) {
              finish(null, new Error(msg.result.content[0].text));
            } else {
              finish(JSON.parse(msg.result.content[0].text));
            }
          }

          // RPC error
          if (msg.error) {
            finish(null, new Error(msg.error.message));
          }
        } catch (e) {
          // ignore parse errors on partial lines
        }
      }
    });

    child.on("error", (err) => finish(null, err));
    child.on("close", (code) => {
      if (!done && code !== 0 && code !== null) {
        finish(null, new Error(`MCP process exited with code ${code}`));
      }
    });

    // Send initialize
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "zoho-bridge", version: "1.0.0" },
          capabilities: {},
        },
      }) + "\n"
    );

    // 15s timeout
    setTimeout(() => {
      finish(null, new Error("Zoho MCP timeout after 15s"));
    }, 15000);
  });
}

// ─── Route each HTTP call to the right tool ───────────────────────────────────
async function routeTool(toolName, body) {
  switch (toolName) {
    case "create_lead":
      return callZohoMCP("create_lead", {
        first_name:  body.first_name  || undefined,
        last_name:   body.last_name,
        email:       body.email,
        phone:       body.phone       || undefined,
        company:     body.company     || undefined,
        lead_source: body.lead_source || "Web",
        amount:      body.amount      ? Number(body.amount) : undefined,
        description: body.description || undefined,
      });

    case "create_contact":
      return callZohoMCP("create_contact", {
        first_name:   body.first_name   || undefined,
        last_name:    body.last_name,
        email:        body.email,
        phone:        body.phone        || undefined,
        account_name: body.account_name || undefined,
        description:  body.description  || undefined,
      });

    case "create_deal":
      return callZohoMCP("create_deal", {
        deal_name:    body.deal_name,
        amount:       body.amount ? Number(body.amount) : undefined,
        stage:        body.stage || "Qualification",
        contact_name: body.contact_name || undefined,
        account_name: body.account_name || undefined,
        closing_date: body.closing_date || undefined,
        description:  body.description  || undefined,
      });

    case "create_task":
      return callZohoMCP("create_task", {
        subject:     body.subject,
        due_date:    body.due_date    || undefined,
        status:      body.status      || "Not Started",
        priority:    body.priority    || "Medium",
        description: body.description || undefined,
      });

    case "search_leads":
      return callZohoMCP("search_leads", {
        email: body.email || undefined,
        name:  body.name  || undefined,
      });

    case "update_lead":
      return callZohoMCP("update_lead", {
        lead_id: body.lead_id,
        fields:  body.fields,
      });

    case "get_leads":
      return callZohoMCP("get_leads", {
        per_page: body.per_page ? Number(body.per_page) : 10,
      });

    default:
      throw new Error(`Unknown Zoho tool: ${toolName}`);
  }
}

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "zoho-bridge" }));
    return;
  }

  // POST /zoho/:tool
  const match = req.url.match(/^\/zoho\/([a-z_]+)$/);
  if (req.method === "POST" && match) {
    const toolName = match[1];
    let body = "";

    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const result = await routeTool(toolName, parsed);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error(`[zoho-bridge] Error on ${toolName}:`, err.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`\n✅ Zoho CRM bridge running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Tools:  POST http://localhost:${PORT}/zoho/<tool_name>\n`);
  console.log("   Available tools:");
  ["create_lead","create_contact","create_deal","create_task","search_leads","update_lead","get_leads"].forEach(t =>
    console.log(`     • /zoho/${t}`)
  );
});
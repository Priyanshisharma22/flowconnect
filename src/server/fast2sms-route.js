import express from "express";
import { spawn } from "child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.post("/sms", async (req, res) => {
  const { numbers, message, sender_id } = req.body;

  if (!numbers || !message) {
    return res.status(400).json({ error: "numbers and message are required" });
  }

  const cleaned = numbers
    .split(",")
    .map((n) => n.trim().replace(/^\+91/, "").replace(/\D/g, ""))
    .join(",");

  try {
    const result = await callFast2SMSMCP(cleaned, message, sender_id);
    return res.json(result);
  } catch (err) {
    console.error("[SMS] Error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

router.get("/sms/balance", async (_req, res) => {
  try {
    const result = await callFast2SMSMCPBalance();
    return res.json(result);
  } catch (err) {
    console.error("[SMS Balance] Error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

function callFast2SMSMCP(numbers, message, sender_id) {
  return new Promise((resolve, reject) => {
    const mcpPath = path.join(__dirname, "../../flowconnect/fast2sms-mcp/index.js");
    const child = spawn("node", [mcpPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let buffer = "";
    let initialized = false;
    let done = false;

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "pravah-server", version: "1.0.0" },
          capabilities: {},
        },
      }) + "\n"
    );

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          if (!initialized && msg.id === 1 && msg.result?.serverInfo) {
            initialized = true;
            const smsCall = JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "send_sms",
                arguments: {
                  numbers,
                  message,
                  ...(sender_id && { sender_id }),
                },
              },
            });
            child.stdin.write(smsCall + "\n");
            return;
          }

          if (initialized && msg.id === 2 && !done) {
            done = true;
            child.kill();
            if (msg.error) {
              reject(new Error(msg.error.message || "SMS failed"));
            } else if (msg.result?.isError) {
              let errorMsg = msg.result.content[0].text;
              try {
                const jsonStart = errorMsg.indexOf('{');
                if (jsonStart !== -1) {
                  const jsonStr = errorMsg.substring(jsonStart);
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.message) {
                    errorMsg = parsed.message;
                  }
                }
              } catch (e) {
                // Ignore parse errors, fallback to original message
              }
              errorMsg = errorMsg.replace(/^Error:\s*/, '').replace(/^Fast2SMS API error:\s*/, '');
              reject(new Error(errorMsg));
            } else {
              try {
                resolve(JSON.parse(msg.result.content[0].text));
              } catch (e) {
                resolve({ success: true, raw: msg.result.content[0].text });
              }
            }
          }
        } catch {
          // Ignore non-JSON output from the child process.
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      console.error("[MCP stderr]:", chunk.toString());
    });

    child.on("close", (code) => {
      if (!done) {
        done = true;
        reject(new Error(`MCP process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

function callFast2SMSMCPBalance() {
  return new Promise((resolve, reject) => {
    const mcpPath = path.join(__dirname, "../../flowconnect/fast2sms-mcp/index.js");
    const child = spawn("node", [mcpPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let buffer = "";
    let initialized = false;
    let done = false;

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "pravah-server", version: "1.0.0" },
          capabilities: {},
        },
      }) + "\n"
    );

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          if (!initialized && msg.id === 1 && msg.result?.serverInfo) {
            initialized = true;
            const balanceCall = JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "check_balance",
                arguments: {},
              },
            });
            child.stdin.write(balanceCall + "\n");
            return;
          }

          if (initialized && msg.id === 2 && !done) {
            done = true;
            child.kill();
            if (msg.error) {
              reject(new Error(msg.error.message || "Balance check failed"));
            } else if (msg.result?.isError) {
              let errorMsg = msg.result.content[0].text;
              try {
                const jsonStart = errorMsg.indexOf('{');
                if (jsonStart !== -1) {
                  const jsonStr = errorMsg.substring(jsonStart);
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.message) {
                    errorMsg = parsed.message;
                  }
                }
              } catch (e) {
                // Ignore parse errors, fallback to original message
              }
              errorMsg = errorMsg.replace(/^Error:\s*/, '').replace(/^Fast2SMS API error:\s*/, '');
              reject(new Error(errorMsg));
            } else {
              try {
                resolve(JSON.parse(msg.result.content[0].text));
              } catch (e) {
                resolve({ success: true, raw: msg.result.content[0].text });
              }
            }
          }
        } catch {
          // Ignore non-JSON output from the child process.
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      console.error("[MCP stderr]:", chunk.toString());
    });

    child.on("close", (code) => {
      if (!done) {
        done = true;
        reject(new Error(`MCP process exited with code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

export default router;

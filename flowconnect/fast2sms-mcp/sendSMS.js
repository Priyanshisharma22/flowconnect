// sendSMS.js
// Helper to call the Fast2SMS MCP server from your webhook handler.
// Usage: const { callFast2SMS } = require("../fast2sms-mcp/sendSMS");

require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");

/**
 * Send SMS via Fast2SMS MCP server
 * @param {string} numbers  - 10-digit number(s), comma-separated for bulk. No +91.
 * @param {string} message  - SMS text (keep under 160 chars)
 * @returns {Promise<object>} - result object with success, request_id, cost
 */
function callFast2SMS(numbers, message) {
  return new Promise((resolve, reject) => {
    // Strip +91 prefix automatically if user passes full number
    const cleaned = numbers
      .split(",")
      .map((n) => n.trim().replace(/^\+91/, "").replace(/\D/g, ""))
      .join(",");

    process.stderr.write(`[Fast2SMS] Calling MCP for: ${cleaned}\n`);

    const child = spawn("node", [path.join(__dirname, "index.js")], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "inherit"], // inherit stderr so logs show in your terminal
    });

    let buffer = "";
    let initialized = false;
    let done = false;

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          // Step 1: server responded to initialize → send tools/call
          if (!initialized && msg.id === 1 && msg.result?.serverInfo) {
            initialized = true;
            child.stdin.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                  name: "send_sms",
                  arguments: { numbers: cleaned, message },
                },
              }) + "\n"
            );
          }

          // Step 2: tools/call response
          if (msg.id === 2 && !done) {
            done = true;
            child.kill();
            if (msg.result?.isError) {
              reject(new Error(msg.result.content[0].text));
            } else {
              try {
                resolve(JSON.parse(msg.result.content[0].text));
              } catch {
                resolve({ success: true, raw: msg.result.content[0].text });
              }
            }
          }
        } catch (e) {
          // skip non-JSON lines
        }
      }
    });

    child.on("error", (err) => {
      if (!done) {
        done = true;
        reject(new Error(`MCP spawn error: ${err.message}`));
      }
    });

    child.on("close", (code) => {
      if (!done && code !== 0 && code !== null) {
        done = true;
        reject(new Error(`MCP process exited with code ${code}`));
      }
    });

    // Send initialize handshake
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "flowconnect", version: "1.0.0" },
          capabilities: {},
        },
      }) + "\n"
    );

    // Safety timeout — 15 seconds
    setTimeout(() => {
      if (!done) {
        done = true;
        child.kill();
        reject(new Error("Fast2SMS MCP timed out after 15s"));
      }
    }, 15000);
  });
}

/**
 * Check Fast2SMS wallet balance
 * @returns {Promise<object>} - { wallet_balance, sms_remaining }
 */
function checkFast2SMSBalance() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, "index.js")], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "inherit"],
    });

    let buffer = "";
    let initialized = false;
    let done = false;

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
            child.stdin.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: { name: "check_balance", arguments: {} },
              }) + "\n"
            );
          }

          if (msg.id === 2 && !done) {
            done = true;
            child.kill();
            if (msg.result?.isError) {
              reject(new Error(msg.result.content[0].text));
            } else {
              resolve(JSON.parse(msg.result.content[0].text));
            }
          }
        } catch (e) {}
      }
    });

    child.on("error", (err) => { if (!done) { done = true; reject(err); } });
    child.on("close", (code) => {
      if (!done && code !== 0 && code !== null) {
        done = true;
        reject(new Error(`Process exited: ${code}`));
      }
    });

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "flowconnect", version: "1.0.0" },
          capabilities: {},
        },
      }) + "\n"
    );

    setTimeout(() => {
      if (!done) { done = true; child.kill(); reject(new Error("Timeout")); }
    }, 15000);
  });
}

module.exports = { callFast2SMS, checkFast2SMSBalance };
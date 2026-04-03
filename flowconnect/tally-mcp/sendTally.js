require("dotenv").config({ quiet: true });
const { spawn } = require("child_process");
const path = require("path");

function callTally(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [path.join(__dirname, "index.js")], {
      env: { ...process.env },
      stdio: ["pipe", "pipe", "inherit"],
    });

    let buffer = "";
    let initialized = false;
    let done = false;

    function finish(fn) {
      if (done) return;
      done = true;
      child.kill();
      fn();
    }

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete trailing line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          // Step 1: server acknowledged initialize → send the actual tool call
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

          // Step 2: tool result received → resolve/reject and clean up
          if (msg.id === 2) {
            finish(() => {
              if (msg.result?.isError) {
                reject(new Error(msg.result.content[0].text));
              } else {
                try {
                  resolve(JSON.parse(msg.result.content[0].text));
                } catch (e) {
                  resolve(msg.result.content[0].text);
                }
              }
            });
          }
        } catch (e) {
          // malformed JSON line — ignore and keep reading
        }
      }
    });

    child.on("error", (err) => {
      finish(() => reject(err));
    });

    child.on("close", (code) => {
      // Only treat non-zero exit as error if we haven't resolved yet.
      // code === null means we killed it ourselves after success — ignore.
      if (!done && code !== null && code !== 0) {
        finish(() => reject(new Error(`index.js exited with code ${code}`)));
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

    // Global timeout — kill and reject if Tally never responds
    setTimeout(() => {
      finish(() => reject(new Error(`Timeout: '${toolName}' did not respond within 15s. Is Tally open?`)));
    }, 15000);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

const createSalesVoucher = (
  party_name,
  amount,
  narration,
  voucher_date,
  sales_ledger,
  cash_ledger
) =>
  callTally("create_sales_voucher", {
    party_name,
    amount,
    narration,
    voucher_date,
    sales_ledger,
    cash_ledger,
  });

const createReceiptVoucher = (
  party_name,
  amount,
  narration,
  voucher_date,
  bank_ledger
) =>
  callTally("create_receipt_voucher", {
    party_name,
    amount,
    narration,
    voucher_date,
    bank_ledger,
  });

const createLedger = (ledger_name, group_name, opening_balance) =>
  callTally("create_ledger", { ledger_name, group_name, opening_balance });

const getLedgerBalance = (ledger_name) =>
  callTally("get_ledger_balance", { ledger_name });

const getCompanyInfo = () => callTally("get_company_info", {});

const createPaymentVoucher = (
  party_name,
  amount,
  narration,
  voucher_date,
  bank_ledger
) =>
  callTally("create_payment_voucher", {
    party_name,
    amount,
    narration,
    voucher_date,
    bank_ledger,
  });

module.exports = {
  createSalesVoucher,
  createReceiptVoucher,
  createLedger,
  getLedgerBalance,
  getCompanyInfo,
  createPaymentVoucher,
};
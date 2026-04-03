require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");

function callAirtable(toolName, args) {
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
                params: { name: toolName, arguments: args },
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

const addPayment = (customer_name, amount, plan, payment_id, email, status, phone) =>
  callAirtable("add_payment", { customer_name, amount, plan, payment_id, email, status, phone });

const getPayments = (max_records, filter_status) =>
  callAirtable("get_payments", { max_records, filter_status });

const addRecord = (table_name, fields) =>
  callAirtable("add_record", { table_name, fields });

const getRecords = (table_name, max_records) =>
  callAirtable("get_records", { table_name, max_records });

const updateRecord = (table_name, record_id, fields) =>
  callAirtable("update_record", { table_name, record_id, fields });

const searchRecords = (table_name, field_name, search_value) =>
  callAirtable("search_records", { table_name, field_name, search_value });

module.exports = { addPayment, getPayments, addRecord, getRecords, updateRecord, searchRecords };

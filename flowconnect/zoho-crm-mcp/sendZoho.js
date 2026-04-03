require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");

function callZoho(toolName, args) {
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
            child.stdin.write(JSON.stringify({
              jsonrpc: "2.0", id: 2,
              method: "tools/call",
              params: { name: toolName, arguments: args },
            }) + "\n");
          }
          if (msg.id === 2 && !done) {
            done = true;
            child.kill();
            if (msg.result?.isError) reject(new Error(msg.result.content[0].text));
            else resolve(JSON.parse(msg.result.content[0].text));
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

    child.stdin.write(JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        clientInfo: { name: "flowconnect", version: "1.0.0" },
        capabilities: {},
      },
    }) + "\n");

    setTimeout(() => {
      if (!done) { done = true; child.kill(); reject(new Error("Timeout")); }
    }, 15000);
  });
}

const createLead = (first_name, last_name, email, phone, company, lead_source, amount, description) =>
  callZoho("create_lead", { first_name, last_name, email, phone, company, lead_source, amount, description });

const createContact = (first_name, last_name, email, phone, account_name, description) =>
  callZoho("create_contact", { first_name, last_name, email, phone, account_name, description });

const createDeal = (deal_name, amount, stage, contact_name, account_name, closing_date) =>
  callZoho("create_deal", { deal_name, amount, stage, contact_name, account_name, closing_date });

const createTask = (subject, due_date, status, priority, description) =>
  callZoho("create_task", { subject, due_date, status, priority, description });

const searchLeads = (email, name) =>
  callZoho("search_leads", { email, name });

const updateLead = (lead_id, fields) =>
  callZoho("update_lead", { lead_id, fields });

const getLeads = (per_page) =>
  callZoho("get_leads", { per_page });

module.exports = { createLead, createContact, createDeal, createTask, searchLeads, updateLead, getLeads };
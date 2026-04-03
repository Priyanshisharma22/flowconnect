#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  process.stderr.write("ERROR: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN must be set\n");
  process.exit(1);
}

let accessToken = null;
let tokenExpiry = 0;

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "create_lead",
    description: "Create a new lead in Zoho CRM after payment or form submission.",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string", description: "Lead's first name." },
        last_name: { type: "string", description: "Lead's last name." },
        email: { type: "string", description: "Lead's email address." },
        phone: { type: "string", description: "Lead's phone number." },
        company: { type: "string", description: "Lead's company name." },
        lead_source: { type: "string", description: "Source: 'Web', 'Payment', 'Razorpay', 'Typeform', etc." },
        amount: { type: "number", description: "Payment amount if from payment." },
        description: { type: "string", description: "Additional notes about the lead." },
      },
      required: ["last_name", "email"],
    },
  },
  {
    name: "create_contact",
    description: "Create a new contact in Zoho CRM for a paying customer.",
    inputSchema: {
      type: "object",
      properties: {
        first_name: { type: "string", description: "Contact's first name." },
        last_name: { type: "string", description: "Contact's last name." },
        email: { type: "string", description: "Contact's email." },
        phone: { type: "string", description: "Contact's phone." },
        account_name: { type: "string", description: "Company/account name." },
        description: { type: "string", description: "Notes about the contact." },
      },
      required: ["last_name", "email"],
    },
  },
  {
    name: "create_deal",
    description: "Create a new deal/opportunity in Zoho CRM.",
    inputSchema: {
      type: "object",
      properties: {
        deal_name: { type: "string", description: "Name of the deal." },
        amount: { type: "number", description: "Deal amount in rupees." },
        stage: { type: "string", description: "Deal stage: 'Qualification', 'Value Proposition', 'Closed Won', 'Closed Lost'." },
        contact_name: { type: "string", description: "Associated contact name." },
        account_name: { type: "string", description: "Associated account/company." },
        closing_date: { type: "string", description: "Expected closing date YYYY-MM-DD." },
        description: { type: "string", description: "Deal description." },
      },
      required: ["deal_name", "stage"],
    },
  },
  {
    name: "create_task",
    description: "Create a follow-up task in Zoho CRM.",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Task subject/title." },
        due_date: { type: "string", description: "Due date YYYY-MM-DD." },
        status: { type: "string", description: "Task status: 'Not Started', 'In Progress', 'Completed'." },
        priority: { type: "string", description: "Priority: 'High', 'Medium', 'Low'." },
        description: { type: "string", description: "Task description." },
      },
      required: ["subject"],
    },
  },
  {
    name: "search_leads",
    description: "Search for leads in Zoho CRM by email or name.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Email to search for." },
        name: { type: "string", description: "Name to search for." },
      },
      required: [],
    },
  },
  {
    name: "update_lead",
    description: "Update an existing lead in Zoho CRM.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "Zoho CRM lead ID." },
        fields: { type: "object", description: "Fields to update as key-value pairs." },
      },
      required: ["lead_id", "fields"],
    },
  },
  {
    name: "get_leads",
    description: "Get list of recent leads from Zoho CRM.",
    inputSchema: {
      type: "object",
      properties: {
        per_page: { type: "number", description: "Number of leads to fetch (default 10)." },
      },
      required: [],
    },
  },
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  process.stderr.write("Refreshing Zoho access token...\n");

  const resp = await fetch("https://accounts.zoho.in/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });

  const data = await resp.json();
  process.stderr.write(`Token response: ${JSON.stringify(data)}\n`);

  if (!data.access_token) {
    throw new Error(`Failed to get Zoho access token: ${JSON.stringify(data)}`);
  }

  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function zohoAPI(method, endpoint, body = null) {
  const token = await getAccessToken();
  const options = {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const resp = await fetch(`https://www.zohoapis.in/crm/v2/${endpoint}`, options);
  const data = await resp.json();

  if (data.status === "error" || (data.code && data.code !== 0)) {
    throw new Error(`Zoho API error: ${JSON.stringify(data)}`);
  }
  return data;
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function createLead({ first_name, last_name, email, phone, company, lead_source, amount, description }) {
  const data = await zohoAPI("POST", "Leads", {
    data: [{
      First_Name: first_name || "",
      Last_Name: last_name,
      Email: email,
      Phone: phone || "",
      Company: company || "",
      Lead_Source: lead_source || "Web",
      Annual_Revenue: amount || 0,
      Description: description || "",
    }],
  });

  const lead = data.data?.[0];
  return {
    success: lead?.code === "SUCCESS",
    lead_id: lead?.details?.id,
    message: `Lead created for ${first_name || ""} ${last_name} (${email})`,
    details: lead?.details,
  };
}

async function createContact({ first_name, last_name, email, phone, account_name, description }) {
  const data = await zohoAPI("POST", "Contacts", {
    data: [{
      First_Name: first_name || "",
      Last_Name: last_name,
      Email: email,
      Phone: phone || "",
      Account_Name: account_name || "",
      Description: description || "",
    }],
  });

  const contact = data.data?.[0];
  return {
    success: contact?.code === "SUCCESS",
    contact_id: contact?.details?.id,
    message: `Contact created for ${first_name || ""} ${last_name}`,
    details: contact?.details,
  };
}

async function createDeal({ deal_name, amount, stage, contact_name, account_name, closing_date, description }) {
  const today = new Date();
  today.setDate(today.getDate() + 30);
  const defaultClose = today.toISOString().split("T")[0];

  const data = await zohoAPI("POST", "Deals", {
    data: [{
      Deal_Name: deal_name,
      Amount: amount || 0,
      Stage: stage || "Qualification",
      Contact_Name: contact_name || "",
      Account_Name: account_name || "",
      Closing_Date: closing_date || defaultClose,
      Description: description || "",
    }],
  });

  const deal = data.data?.[0];
  return {
    success: deal?.code === "SUCCESS",
    deal_id: deal?.details?.id,
    message: `Deal '${deal_name}' created - Stage: ${stage}`,
    details: deal?.details,
  };
}

async function createTask({ subject, due_date, status, priority, description }) {
  const today = new Date();
  today.setDate(today.getDate() + 7);
  const defaultDue = today.toISOString().split("T")[0];

  const data = await zohoAPI("POST", "Tasks", {
    data: [{
      Subject: subject,
      Due_Date: due_date || defaultDue,
      Status: status || "Not Started",
      Priority: priority || "Medium",
      Description: description || "",
    }],
  });

  const task = data.data?.[0];
  return {
    success: task?.code === "SUCCESS",
    task_id: task?.details?.id,
    message: `Task '${subject}' created`,
    details: task?.details,
  };
}

async function searchLeads({ email, name }) {
  let endpoint = "Leads/search?";
  if (email) endpoint += `email=${encodeURIComponent(email)}`;
  else if (name) endpoint += `word=${encodeURIComponent(name)}`;

  const data = await zohoAPI("GET", endpoint);
  return {
    success: true,
    total: data.data?.length || 0,
    leads: data.data || [],
    message: `Found ${data.data?.length || 0} leads`,
  };
}

async function updateLead({ lead_id, fields }) {
  const data = await zohoAPI("PUT", `Leads/${lead_id}`, {
    data: [fields],
  });

  const lead = data.data?.[0];
  return {
    success: lead?.code === "SUCCESS",
    lead_id,
    message: `Lead ${lead_id} updated successfully`,
    details: lead?.details,
  };
}

async function getLeads({ per_page }) {
  const data = await zohoAPI("GET", `Leads?per_page=${per_page || 10}&sort_by=Created_Time&sort_order=desc`);
  return {
    success: true,
    total: data.data?.length || 0,
    leads: data.data?.map((l) => ({
      id: l.id,
      name: `${l.First_Name || ""} ${l.Last_Name}`,
      email: l.Email,
      phone: l.Phone,
      company: l.Company,
      source: l.Lead_Source,
      created: l.Created_Time,
    })) || [],
    message: `Found ${data.data?.length || 0} leads`,
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
        serverInfo: { name: "zoho-crm-mcp", version: "1.0.0" },
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
      if (name === "create_lead") result = await createLead(args);
      else if (name === "create_contact") result = await createContact(args);
      else if (name === "create_deal") result = await createDeal(args);
      else if (name === "create_task") result = await createTask(args);
      else if (name === "search_leads") result = await searchLeads(args);
      else if (name === "update_lead") result = await updateLead(args);
      else if (name === "get_leads") result = await getLeads(args);
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

process.stderr.write("Zoho CRM MCP server started\n");
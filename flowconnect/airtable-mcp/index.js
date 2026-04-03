#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Payments";

if (!API_KEY || !BASE_ID) {
  process.stderr.write("ERROR: AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in .env\n");
  process.exit(1);
}

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "add_payment",
    description:
      "Add a new payment record to Airtable. Stores customer name, amount, plan, payment ID, status and timestamp.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Name of the customer." },
        email: { type: "string", description: "Customer email address." },
        amount: { type: "number", description: "Payment amount in rupees." },
        plan: { type: "string", description: "Plan or product purchased." },
        payment_id: { type: "string", description: "Payment/transaction ID." },
        status: { type: "string", description: "Payment status: 'Success', 'Failed', 'Pending'." },
        phone: { type: "string", description: "Customer phone number." },
      },
      required: ["customer_name", "amount"],
    },
  },
  {
    name: "get_payments",
    description: "Get list of payment records from Airtable with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        max_records: { type: "number", description: "Maximum number of records to fetch (default 10)." },
        filter_status: { type: "string", description: "Filter by status: 'Success', 'Failed', 'Pending'." },
      },
      required: [],
    },
  },
  {
    name: "add_record",
    description: "Add any custom record to any Airtable table with custom fields.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the Airtable table." },
        fields: { type: "object", description: "Key-value pairs of fields to add." },
      },
      required: ["table_name", "fields"],
    },
  },
  {
    name: "get_records",
    description: "Get records from any Airtable table.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the Airtable table." },
        max_records: { type: "number", description: "Maximum records to fetch (default 10)." },
      },
      required: ["table_name"],
    },
  },
  {
    name: "update_record",
    description: "Update an existing record in Airtable by record ID.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the Airtable table." },
        record_id: { type: "string", description: "Airtable record ID (starts with 'rec')." },
        fields: { type: "object", description: "Fields to update." },
      },
      required: ["table_name", "record_id", "fields"],
    },
  },
  {
    name: "search_records",
    description: "Search for records in Airtable by field value.",
    inputSchema: {
      type: "object",
      properties: {
        table_name: { type: "string", description: "Name of the Airtable table." },
        field_name: { type: "string", description: "Field name to search in." },
        search_value: { type: "string", description: "Value to search for." },
      },
      required: ["table_name", "field_name", "search_value"],
    },
  },
];

// ─── API calls ────────────────────────────────────────────────────────────────

async function airtableRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);

  const resp = await fetch(`${BASE_URL}/${endpoint}`, options);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(`Airtable API error: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data;
}

async function addPayment({ customer_name, email, amount, plan, payment_id, status, phone }) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const data = await airtableRequest("POST", encodeURIComponent(TABLE_NAME), {
    records: [
      {
        fields: {
          "Customer Name": customer_name,
          ...(email && { Email: email }),
          Amount: amount,
          ...(plan && { Plan: plan }),
          ...(payment_id && { "Payment ID": payment_id }),
          Status: status || "Success",
          ...(phone && { Phone: phone }),
          "Created At": now,
        },
      },
    ],
  });

  return {
    success: true,
    record_id: data.records[0].id,
    message: `Payment record added for ${customer_name} - ₹${amount}`,
    record: data.records[0].fields,
  };
}

async function getPayments({ max_records, filter_status }) {
  let endpoint = `${encodeURIComponent(TABLE_NAME)}?maxRecords=${max_records || 10}&sort[0][field]=Created At&sort[0][direction]=desc`;
  if (filter_status) {
    endpoint += `&filterByFormula=${encodeURIComponent(`{Status}="${filter_status}"`)}`;
  }

  const data = await airtableRequest("GET", endpoint);
  return {
    success: true,
    total: data.records.length,
    records: data.records.map((r) => ({ id: r.id, ...r.fields })),
    message: `Found ${data.records.length} payment records`,
  };
}

async function addRecord({ table_name, fields }) {
  const data = await airtableRequest("POST", encodeURIComponent(table_name), {
    records: [{ fields }],
  });
  return {
    success: true,
    record_id: data.records[0].id,
    message: `Record added to ${table_name}`,
    record: data.records[0].fields,
  };
}

async function getRecords({ table_name, max_records }) {
  const endpoint = `${encodeURIComponent(table_name)}?maxRecords=${max_records || 10}`;
  const data = await airtableRequest("GET", endpoint);
  return {
    success: true,
    total: data.records.length,
    records: data.records.map((r) => ({ id: r.id, ...r.fields })),
    message: `Found ${data.records.length} records in ${table_name}`,
  };
}

async function updateRecord({ table_name, record_id, fields }) {
  const data = await airtableRequest("PATCH", `${encodeURIComponent(table_name)}/${record_id}`, {
    fields,
  });
  return {
    success: true,
    record_id: data.id,
    message: `Record ${record_id} updated in ${table_name}`,
    record: data.fields,
  };
}

async function searchRecords({ table_name, field_name, search_value }) {
  const formula = encodeURIComponent(`SEARCH("${search_value}",{${field_name}})`);
  const endpoint = `${encodeURIComponent(table_name)}?filterByFormula=${formula}`;
  const data = await airtableRequest("GET", endpoint);
  return {
    success: true,
    total: data.records.length,
    records: data.records.map((r) => ({ id: r.id, ...r.fields })),
    message: `Found ${data.records.length} records matching "${search_value}"`,
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
        serverInfo: { name: "airtable-mcp", version: "1.0.0" },
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
      if (name === "add_payment") result = await addPayment(args);
      else if (name === "get_payments") result = await getPayments(args);
      else if (name === "add_record") result = await addRecord(args);
      else if (name === "get_records") result = await getRecords(args);
      else if (name === "update_record") result = await updateRecord(args);
      else if (name === "search_records") result = await searchRecords(args);
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

process.stderr.write("Airtable MCP server started\n");
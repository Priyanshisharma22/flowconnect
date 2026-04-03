import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const auth = {
  username: process.env.RAZORPAY_KEY_ID,
  password: process.env.RAZORPAY_KEY_SECRET,
};

const BASE_URL = "https://api.razorpay.com/v1";

const server = new McpServer({
  name: "razorpay-mcp",
  version: "1.0.0",
});

// ── Tool 1: Get today's payments ──────────────────────────────────
server.tool(
  "get_todays_payments",
  "Get all payments received today with total amount",
  {},
  async () => {
    const now = Math.floor(Date.now() / 1000);
    const startOfDay = now - (now % 86400);

    const resp = await axios.get(`${BASE_URL}/payments`, {
      auth,
      params: { from: startOfDay, to: now, count: 100 },
    });

    const payments = resp.data.items || [];
    const total = payments.reduce((sum, p) => sum + p.amount, 0) / 100;
    const captured = payments.filter(p => p.status === "captured");

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          date: new Date().toLocaleDateString("en-IN"),
          total_payments: payments.length,
          captured_payments: captured.length,
          total_amount: `Rs.${total.toFixed(2)}`,
          payments: captured.map(p => ({
            id: p.id,
            amount: `Rs.${(p.amount / 100).toFixed(2)}`,
            method: p.method,
            email: p.email,
            contact: p.contact,
            status: p.status,
            time: new Date(p.created_at * 1000).toLocaleTimeString("en-IN"),
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 2: Get payments by date range ────────────────────────────
server.tool(
  "get_payments_by_range",
  "Get payments between two dates",
  {
    from_date: z.string().describe("Start date in YYYY-MM-DD format"),
    to_date: z.string().describe("End date in YYYY-MM-DD format"),
  },
  async ({ from_date, to_date }) => {
    const from = Math.floor(new Date(from_date).getTime() / 1000);
    const to   = Math.floor(new Date(to_date).getTime() / 1000) + 86400;

    const resp = await axios.get(`${BASE_URL}/payments`, {
      auth,
      params: { from, to, count: 100 },
    });

    const payments = resp.data.items || [];
    const total = payments.reduce((sum, p) => sum + p.amount, 0) / 100;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          from: from_date,
          to: to_date,
          total_payments: payments.length,
          total_amount: `Rs.${total.toFixed(2)}`,
          payments: payments.map(p => ({
            id: p.id,
            amount: `Rs.${(p.amount / 100).toFixed(2)}`,
            method: p.method,
            status: p.status,
            email: p.email,
            contact: p.contact,
            date: new Date(p.created_at * 1000).toLocaleDateString("en-IN"),
          })),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 3: Get single payment details ────────────────────────────
server.tool(
  "get_payment_details",
  "Get details of a specific payment by ID",
  {
    payment_id: z.string().describe("Razorpay payment ID e.g. pay_ABC123"),
  },
  async ({ payment_id }) => {
    const resp = await axios.get(`${BASE_URL}/payments/${payment_id}`, { auth });
    const p = resp.data;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          id: p.id,
          amount: `Rs.${(p.amount / 100).toFixed(2)}`,
          currency: p.currency,
          status: p.status,
          method: p.method,
          email: p.email,
          contact: p.contact,
          description: p.description,
          created_at: new Date(p.created_at * 1000).toLocaleString("en-IN"),
        }, null, 2),
      }],
    };
  }
);

// ── Tool 4: Get payment summary stats ─────────────────────────────
server.tool(
  "get_payment_summary",
  "Get payment summary - total revenue, success rate, top methods",
  {
    days: z.number().describe("Number of past days to analyze e.g. 7, 30"),
  },
  async ({ days }) => {
    const now   = Math.floor(Date.now() / 1000);
    const from  = now - days * 86400;

    const resp = await axios.get(`${BASE_URL}/payments`, {
      auth,
      params: { from, to: now, count: 100 },
    });

    const payments = resp.data.items || [];
    const captured = payments.filter(p => p.status === "captured");
    const failed   = payments.filter(p => p.status === "failed");
    const total    = captured.reduce((sum, p) => sum + p.amount, 0) / 100;

    const methodCount = {};
    captured.forEach(p => {
      methodCount[p.method] = (methodCount[p.method] || 0) + 1;
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          period: `Last ${days} days`,
          total_transactions: payments.length,
          successful: captured.length,
          failed: failed.length,
          success_rate: `${((captured.length / payments.length) * 100).toFixed(1)}%`,
          total_revenue: `Rs.${total.toFixed(2)}`,
          payment_methods: methodCount,
        }, null, 2),
      }],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Razorpay MCP Server running...");
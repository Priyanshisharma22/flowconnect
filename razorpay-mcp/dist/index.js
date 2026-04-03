"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const BASE_URL = "https://api.razorpay.com/v1";
const razorpay = axios_1.default.create({
    baseURL: BASE_URL,
    auth: { username: RAZORPAY_KEY_ID, password: RAZORPAY_KEY_SECRET },
    headers: { "Content-Type": "application/json" },
});
const server = new index_js_1.Server({ name: "razorpay-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_payments",
                description: "Get list of recent payments from Razorpay",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Number of payments to fetch (default 10)" },
                        from: { type: "number", description: "Unix timestamp filter from date" },
                        to: { type: "number", description: "Unix timestamp filter to date" },
                    },
                },
            },
            {
                name: "get_payment_by_id",
                description: "Get details of a specific payment by ID",
                inputSchema: {
                    type: "object",
                    properties: {
                        payment_id: { type: "string", description: "Razorpay payment ID e.g. pay_ABC123" },
                    },
                    required: ["payment_id"],
                },
            },
            {
                name: "get_payment_summary",
                description: "Get summary: total count, revenue, success rate",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Number of payments to analyze (default 50)" },
                    },
                },
            },
            {
                name: "get_total_revenue",
                description: "Calculate total revenue from payments",
                inputSchema: {
                    type: "object",
                    properties: {
                        from: { type: "number", description: "Unix timestamp start date" },
                        to: { type: "number", description: "Unix timestamp end date" },
                    },
                },
            },
            {
                name: "check_payment_status",
                description: "Check if a payment was successful or failed",
                inputSchema: {
                    type: "object",
                    properties: {
                        payment_id: { type: "string", description: "Razorpay payment ID to check" },
                    },
                    required: ["payment_id"],
                },
            },
            {
                name: "get_refunds",
                description: "Get refunds for a specific payment",
                inputSchema: {
                    type: "object",
                    properties: {
                        payment_id: { type: "string", description: "Razorpay payment ID" },
                    },
                    required: ["payment_id"],
                },
            },
            {
                name: "create_refund",
                description: "Create a refund for a payment",
                inputSchema: {
                    type: "object",
                    properties: {
                        payment_id: { type: "string", description: "Payment ID to refund" },
                        amount: { type: "number", description: "Amount in paise (100 paise = 1 rupee)" },
                        reason: { type: "string", description: "Reason: customer_request, fraud, duplicate" },
                    },
                    required: ["payment_id"],
                },
            },
            {
                name: "get_orders",
                description: "Get list of recent Razorpay orders",
                inputSchema: {
                    type: "object",
                    properties: {
                        count: { type: "number", description: "Number of orders to fetch (default 10)" },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "get_payments": {
                const params = { count: args?.count || 10 };
                if (args?.from)
                    params.from = args.from;
                if (args?.to)
                    params.to = args.to;
                const { data } = await razorpay.get("/payments", { params });
                const payments = data.items.map((p) => ({
                    id: p.id,
                    amount: `Rs.${p.amount / 100}`,
                    status: p.status,
                    method: p.method,
                    email: p.email,
                    contact: p.contact,
                    created: new Date(p.created_at * 1000).toLocaleString("en-IN"),
                }));
                return {
                    content: [{ type: "text", text: JSON.stringify({ total: data.count, payments }, null, 2) }],
                };
            }
            case "get_payment_by_id": {
                const { data: p } = await razorpay.get(`/payments/${args?.payment_id}`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                id: p.id,
                                amount: `Rs.${p.amount / 100}`,
                                status: p.status,
                                method: p.method,
                                email: p.email,
                                contact: p.contact,
                                created: new Date(p.created_at * 1000).toLocaleString("en-IN"),
                                notes: p.notes,
                            }, null, 2),
                        }],
                };
            }
            case "get_payment_summary": {
                const { data } = await razorpay.get("/payments", { params: { count: args?.count || 50 } });
                const items = data.items;
                const captured = items.filter((p) => p.status === "captured");
                const failed = items.filter((p) => p.status === "failed");
                const totalAmt = captured.reduce((s, p) => s + p.amount, 0);
                const methods = {};
                items.forEach((p) => { methods[p.method] = (methods[p.method] || 0) + 1; });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                total_payments: items.length,
                                successful: captured.length,
                                failed: failed.length,
                                success_rate: `${Math.round((captured.length / items.length) * 100)}%`,
                                total_revenue: `Rs.${totalAmt / 100}`,
                                payment_methods: methods,
                            }, null, 2),
                        }],
                };
            }
            case "get_total_revenue": {
                const params = { count: 100 };
                if (args?.from)
                    params.from = args.from;
                if (args?.to)
                    params.to = args.to;
                const { data } = await razorpay.get("/payments", { params });
                const captured = data.items.filter((p) => p.status === "captured");
                const total = captured.reduce((s, p) => s + p.amount, 0);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                total_payments: data.count,
                                successful: captured.length,
                                total_revenue: `Rs.${total / 100}`,
                                average_payment: captured.length > 0 ? `Rs.${Math.round(total / captured.length / 100)}` : "Rs.0",
                            }, null, 2),
                        }],
                };
            }
            case "check_payment_status": {
                const { data: p } = await razorpay.get(`/payments/${args?.payment_id}`);
                const statusMap = {
                    captured: "Payment successful",
                    failed: "Payment failed",
                    created: "Payment pending",
                    refunded: "Payment refunded",
                };
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                payment_id: p.id,
                                status: p.status,
                                message: statusMap[p.status] || p.status,
                                amount: `Rs.${p.amount / 100}`,
                                paid_by: p.email || p.contact,
                            }, null, 2),
                        }],
                };
            }
            case "get_refunds": {
                const { data } = await razorpay.get(`/payments/${args?.payment_id}/refunds`);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(data.items.map((r) => ({
                                id: r.id,
                                amount: `Rs.${r.amount / 100}`,
                                status: r.status,
                                created: new Date(r.created_at * 1000).toLocaleString("en-IN"),
                            })), null, 2),
                        }],
                };
            }
            case "create_refund": {
                const body = {};
                if (args?.amount)
                    body.amount = args.amount;
                if (args?.reason)
                    body.notes = { reason: args.reason };
                const { data } = await razorpay.post(`/payments/${args?.payment_id}/refund`, body);
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify({
                                refund_id: data.id,
                                amount: `Rs.${data.amount / 100}`,
                                status: data.status,
                                message: "Refund created successfully",
                            }, null, 2),
                        }],
                };
            }
            case "get_orders": {
                const { data } = await razorpay.get("/orders", { params: { count: args?.count || 10 } });
                return {
                    content: [{
                            type: "text",
                            text: JSON.stringify(data.items.map((o) => ({
                                id: o.id,
                                amount: `Rs.${o.amount / 100}`,
                                status: o.status,
                                created: new Date(o.created_at * 1000).toLocaleString("en-IN"),
                            })), null, 2),
                        }],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.response?.data?.error?.description || error.message}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Razorpay MCP Server running!");
}
main().catch(console.error);

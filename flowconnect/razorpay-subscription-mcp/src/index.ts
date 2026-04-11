import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const KEY_ID     = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

const api = axios.create({
  baseURL: "https://api.razorpay.com/v1",
  auth: { username: KEY_ID, password: KEY_SECRET },
  headers: { "Content-Type": "application/json" },
});

interface RazorpayToolArgs {
  count?: number;
  status?: string;
  subscription_id?: string;
  cancel_at_cycle_end?: boolean;
  pause_at?: string;
  resume_at?: string;
  days?: number;
  plan_id?: string;
  total_count?: number;
  quantity?: number;
  customer_notify?: boolean;
  notes?: Record<string, unknown>;
}

interface RazorpaySubscriptionItem {
  id: string;
  plan_id?: string;
  status?: string;
  current_start?: number;
  current_end?: number;
  paid_count?: number;
  total_count?: number;
  quantity?: number;
  remaining_count?: number;
  ended_at?: number;
  notes?: unknown;
}

interface RazorpayInvoiceItem {
  id: string;
  status?: string;
  amount?: number;
  date?: number;
}

interface RazorpayPlanItem {
  id: string;
  item?: {
    name?: string;
    amount?: number;
  };
  interval?: string;
  period?: string;
}

interface RazorpayListResponse<T> {
  count: number;
  items: T[];
}

function formatDateFromUnixSeconds(value?: number) {
  return value ? new Date(value * 1000).toLocaleDateString("en-IN") : null;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.description || error.message || "Unknown error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

const server = new Server(
  { name: "razorpay-subscription-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── LIST ALL TOOLS ───────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_all_subscriptions",
      description: "Get list of all Razorpay subscriptions with status",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of subscriptions to fetch (default 10)" },
          status: { type: "string", description: "Filter by status: created, authenticated, active, paused, halted, cancelled, completed, expired" },
        },
      },
    },
    {
      name: "get_subscription_by_id",
      description: "Get details of a specific subscription",
      inputSchema: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "Razorpay subscription ID e.g. sub_ABC123" },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "get_subscription_invoices",
      description: "Get all invoices/payments for a subscription",
      inputSchema: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "Subscription ID to get invoices for" },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "cancel_subscription",
      description: "Cancel a subscription immediately or at end of billing cycle",
      inputSchema: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "Subscription ID to cancel" },
          cancel_at_cycle_end: { type: "boolean", description: "If true, cancel at end of current cycle. If false, cancel immediately." },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "pause_subscription",
      description: "Pause an active subscription",
      inputSchema: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "Subscription ID to pause" },
          pause_at: { type: "string", description: "When to pause: 'now' or 'cycle_end'" },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "resume_subscription",
      description: "Resume a paused subscription",
      inputSchema: {
        type: "object",
        properties: {
          subscription_id: { type: "string", description: "Subscription ID to resume" },
          resume_at: { type: "string", description: "When to resume: 'now'" },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "get_subscription_summary",
      description: "Get summary: active count, revenue, failed payments, churn rate",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of subscriptions to analyze (default 50)" },
        },
      },
    },
    {
      name: "get_expiring_subscriptions",
      description: "Get subscriptions expiring in next N days — for sending renewal reminders",
      inputSchema: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days ahead to check (default 7)" },
        },
      },
    },
    {
      name: "get_failed_subscriptions",
      description: "Get subscriptions with failed payments that need attention",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of failed subscriptions to fetch" },
        },
      },
    },
    {
      name: "create_subscription",
      description: "Create a new subscription for a plan",
      inputSchema: {
        type: "object",
        properties: {
          plan_id: { type: "string", description: "Razorpay plan ID e.g. plan_ABC123" },
          total_count: { type: "number", description: "Total billing cycles (e.g. 12 for annual)" },
          quantity: { type: "number", description: "Number of items (default 1)" },
          customer_notify: { type: "boolean", description: "Send Razorpay notification to customer (default true)" },
          notes: { type: "object", description: "Additional notes e.g. {customer_name: 'Rahul'}" },
        },
        required: ["plan_id", "total_count"],
      },
    },
    {
      name: "get_all_plans",
      description: "Get all subscription plans you have created",
      inputSchema: {
        type: "object",
        properties: {
          count: { type: "number", description: "Number of plans to fetch (default 10)" },
        },
      },
    },
    {
      name: "get_subscription_revenue",
      description: "Calculate total recurring revenue (MRR/ARR) from active subscriptions",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

// ── HANDLE TOOL CALLS ────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request: { params: { name: string; arguments?: RazorpayToolArgs } }) => {
  const { name, arguments: args } = request.params;
  const toolArgs = args as RazorpayToolArgs | undefined;

  try {
    switch (name) {

      // ── Get all subscriptions ──────────────────────────────────
      case "get_all_subscriptions": {
        const params: Record<string, string | number> = { count: toolArgs?.count || 10 };
        if (toolArgs?.status) params.status = toolArgs.status;

        const { data } = await api.get<RazorpayListResponse<RazorpaySubscriptionItem>>("/subscriptions", { params });
        const subs = data.items.map((s) => ({
          id:            s.id,
          plan_id:       s.plan_id,
          status:        s.status,
          current_start: formatDateFromUnixSeconds(s.current_start),
          current_end:   formatDateFromUnixSeconds(s.current_end),
          paid_count:    s.paid_count,
          total_count:   s.total_count,
          quantity:      s.quantity,
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ total: data.count, subscriptions: subs }, null, 2),
          }],
        };
      }

      // ── Get subscription by ID ─────────────────────────────────
      case "get_subscription_by_id": {
        const { data: s } = await api.get<RazorpaySubscriptionItem>(`/subscriptions/${toolArgs?.subscription_id}`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id:            s.id,
              plan_id:       s.plan_id,
              status:        s.status,
              paid_count:    s.paid_count,
              total_count:   s.total_count,
              remaining:     s.remaining_count,
              current_start: formatDateFromUnixSeconds(s.current_start),
              current_end:   formatDateFromUnixSeconds(s.current_end),
              ended_at:      formatDateFromUnixSeconds(s.ended_at),
              notes:         s.notes,
            }, null, 2),
          }],
        };
      }

      // ── Get subscription invoices ──────────────────────────────
      case "get_subscription_invoices": {
        const { data } = await api.get<RazorpayListResponse<RazorpayInvoiceItem>>(`/subscriptions/${toolArgs?.subscription_id}/invoices`);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data.items.map((inv) => ({
              id:      inv.id,
              status:  inv.status,
              amount:  `Rs.${(inv.amount || 0) / 100}`,
              date:    formatDateFromUnixSeconds(inv.date),
            })), null, 2),
          }],
        };
      }

      // ── Cancel subscription ────────────────────────────────────
      case "cancel_subscription": {
        const { data } = await api.post(
          `/subscriptions/${toolArgs?.subscription_id}/cancel`,
          { cancel_at_cycle_end: toolArgs?.cancel_at_cycle_end ? 1 : 0 }
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id:      data.id,
              status:  data.status,
              message: toolArgs?.cancel_at_cycle_end
                ? "Subscription will cancel at end of current cycle"
                : "Subscription cancelled immediately",
            }, null, 2),
          }],
        };
      }

      // ── Pause subscription ─────────────────────────────────────
      case "pause_subscription": {
        const { data } = await api.post(
          `/subscriptions/${toolArgs?.subscription_id}/pause`,
          { pause_at: toolArgs?.pause_at || "now" }
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id:      data.id,
              status:  data.status,
              message: "Subscription paused successfully",
            }, null, 2),
          }],
        };
      }

      // ── Resume subscription ────────────────────────────────────
      case "resume_subscription": {
        const { data } = await api.post(
          `/subscriptions/${toolArgs?.subscription_id}/resume`,
          { resume_at: toolArgs?.resume_at || "now" }
        );
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id:      data.id,
              status:  data.status,
              message: "Subscription resumed successfully",
            }, null, 2),
          }],
        };
      }

      // ── Get subscription summary ───────────────────────────────
      case "get_subscription_summary": {
        const { data } = await api.get<RazorpayListResponse<RazorpaySubscriptionItem>>("/subscriptions", {
          params: { count: toolArgs?.count || 50 }
        });
        const items     = data.items;
        const active    = items.filter((s) => s.status === "active");
        const halted    = items.filter((s) => s.status === "halted");
        const cancelled = items.filter((s) => s.status === "cancelled");
        const paused    = items.filter((s) => s.status === "paused");

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              total_subscriptions: items.length,
              active:              active.length,
              halted_failed:       halted.length,
              cancelled:           cancelled.length,
              paused:              paused.length,
              health_rate:         `${Math.round((active.length / items.length) * 100)}%`,
              churn_rate:          `${Math.round((cancelled.length / items.length) * 100)}%`,
            }, null, 2),
          }],
        };
      }

      // ── Get expiring subscriptions ─────────────────────────────
      case "get_expiring_subscriptions": {
        const days      = Number(toolArgs?.days) || 7;
        const now       = Math.floor(Date.now() / 1000);
        const future    = now + (days * 24 * 60 * 60);
        const { data }  = await api.get<RazorpayListResponse<RazorpaySubscriptionItem>>("/subscriptions", {
          params: { count: 100, status: "active" }
        });

        const expiring = data.items.filter((s) =>
          s.current_end && s.current_end >= now && s.current_end <= future
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              expiring_in_days: days,
              count: expiring.length,
              subscriptions: expiring.map((s) => ({
                id:          s.id,
                expires_on:  new Date((s.current_end ?? now) * 1000).toLocaleDateString("en-IN"),
                days_left:   Math.ceil(((s.current_end ?? now) - now) / 86400),
                paid_count:  s.paid_count,
              })),
            }, null, 2),
          }],
        };
      }

      // ── Get failed subscriptions ───────────────────────────────
      case "get_failed_subscriptions": {
        const { data } = await api.get<RazorpayListResponse<RazorpaySubscriptionItem>>("/subscriptions", {
          params: { count: toolArgs?.count || 20, status: "halted" }
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              failed_count: data.count,
              subscriptions: data.items.map((s) => ({
                id:          s.id,
                plan_id:     s.plan_id,
                paid_count:   s.paid_count,
                total_count: s.total_count,
                notes:        s.notes,
              })),
            }, null, 2),
          }],
        };
      }

      // ── Create subscription ────────────────────────────────────
      case "create_subscription": {
        const body: Record<string, string | number | Record<string, unknown>> = {
          plan_id:         toolArgs?.plan_id || "",
          total_count:     toolArgs?.total_count || 0,
          quantity:        toolArgs?.quantity || 1,
          customer_notify: toolArgs?.customer_notify !== false ? 1 : 0,
        };
        if (toolArgs?.notes) body.notes = toolArgs.notes;

        const { data } = await api.post("/subscriptions", body);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              subscription_id: data.id,
              status:          data.status,
              short_url:       data.short_url,
              message:         "Subscription created! Share short_url with customer to activate.",
            }, null, 2),
          }],
        };
      }

      // ── Get all plans ──────────────────────────────────────────
      case "get_all_plans": {
        const { data } = await api.get<RazorpayListResponse<RazorpayPlanItem>>("/plans", {
          params: { count: toolArgs?.count || 10 }
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify(data.items.map((p) => ({
              id:       p.id,
              name:     p.item?.name,
              amount:   `Rs.${(p.item?.amount || 0) / 100}`,
              interval: p.interval,
              period:   p.period,
            })), null, 2),
          }],
        };
      }

      // ── Get subscription revenue (MRR) ─────────────────────────
      case "get_subscription_revenue": {
        const [subsData, plansData] = await Promise.all([
          api.get<RazorpayListResponse<RazorpaySubscriptionItem>>("/subscriptions", { params: { count: 100, status: "active" } }),
          api.get<RazorpayListResponse<RazorpayPlanItem>>("/plans",         { params: { count: 100 } }),
        ]);

        const planMap: Record<string, number> = {};
        plansData.data.items.forEach((p) => {
          planMap[p.id] = p.item?.amount || 0;
        });

        const activeSubs = subsData.data.items;
        const mrr = activeSubs.reduce((sum: number, s) => {
          return sum + (s.plan_id ? (planMap[s.plan_id] || 0) : 0);
        }, 0);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              active_subscriptions: activeSubs.length,
              mrr:  `Rs.${mrr / 100}`,
              arr:  `Rs.${(mrr * 12) / 100}`,
              avg_revenue_per_sub: activeSubs.length > 0
                ? `Rs.${Math.round(mrr / activeSubs.length / 100)}`
                : "Rs.0",
            }, null, 2),
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

  } catch (error: unknown) {
    return {
      content: [{
        type: "text",
        text: `Error: ${getErrorMessage(error)}`,
      }],
      isError: true,
    };
  }
});

// ── START ────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Razorpay Subscription MCP running!");
}

main().catch(console.error);
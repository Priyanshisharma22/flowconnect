import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "../styles/BuilderPage.css";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type NodeTypes,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Clock,
  Zap,
  Blocks,
  ArrowLeft,
  Play,
  Save,
  Plus,
  Layout,
  Mail,
  MessageSquare,
  Repeat,
  Image,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader,
  LogIn,
  CreditCard,
  Link as LinkIcon,
  FileText,
  Send,
  IndianRupee,
  Search,
  BarChart2,
  PauseCircle,
  PlayCircle,
  XCircle,
  Bot,
  Users,
  UserPlus,
  Briefcase,
  ListChecks,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiCall, getToken } from "../api/client";
import { addPayment } from "../api/airtable";
import { sendNotification, sendPaymentAlert } from "../api/discord";
import { sendSMS } from "../api/fast2sms";
import {
  createInstamojoLink,
  notifyInstamojoPaymentComplete,
  sendInstamojoDailySummaryWhatsApp,
} from "../api/instamojo";
import {
  processPaymentInvoice,
  sendWhatsAppInvoice,
  sendEmailInvoice,
  sendWhatsAppDirect,
} from "../api/invoice";
import {
  getRazorpayTodaysPayments,
  getRazorpayPaymentsByRange,
  getRazorpayPaymentDetails,
  getRazorpayPaymentSummary,
} from "../api/razorpay";
import {
  getAllSubscriptions,
  getSubscriptionById,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionSummary,
  getExpiringSubscriptions,
  getFailedSubscriptions,
  createSubscription,
  getAllPlans,
  getSubscriptionRevenue,
} from "../api/razorpay-subscriptions";
import {
  getBotInfo,
  getUpdates,
  sendTelegramMessage,
  sendTelegramPaymentAlert,
} from "../api/telegram";

// ── Zoho CRM Bridge ─────────────────────────────────────────────────────────
const ZOHO_BRIDGE =
  (import.meta as any).env?.VITE_ZOHO_BRIDGE_URL || "http://localhost:3001";

async function callZohoBridge(tool: string, body: Record<string, any> = {}) {
  const resp = await fetch(`${ZOHO_BRIDGE}/zoho/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok || data.error)
    throw new Error(data.error || `Zoho bridge error (${resp.status})`);
  return data;
}

// ── Color palette ─────────────────────────────────────────────────────────────
const COLORS = {
  violet: {
    bg: "#8b5cf6",
    light: "#ede9fe",
    border: "#7c3aed",
    text: "#5b21b6",
  },
  cyan: { bg: "#06b6d4", light: "#cffafe", border: "#0891b2", text: "#164e63" },
  emerald: {
    bg: "#10b981",
    light: "#d1fae5",
    border: "#059669",
    text: "#064e3b",
  },
  rose: { bg: "#f43f5e", light: "#ffe4e6", border: "#e11d48", text: "#9f1239" },
  amber: {
    bg: "#f59e0b",
    light: "#fef3c7",
    border: "#d97706",
    text: "#92400e",
  },
  indigo: {
    bg: "#6366f1",
    light: "#eef2ff",
    border: "#4f46e5",
    text: "#312e81",
  },
  teal: { bg: "#14b8a6", light: "#ccfbf1", border: "#0d9488", text: "#134e4a" },
  orange: {
    bg: "#f97316",
    light: "#ffedd5",
    border: "#ea580c",
    text: "#7c2d12",
  },
  pink: { bg: "#ec4899", light: "#fce7f3", border: "#db2777", text: "#831843" },
  blue: { bg: "#3b82f6", light: "#dbeafe", border: "#2563eb", text: "#1e3a8a" },
  sky: { bg: "#0ea5e9", light: "#e0f2fe", border: "#0284c7", text: "#0c4a6e" },
  green: {
    bg: "#22c55e",
    light: "#dcfce7",
    border: "#16a34a",
    text: "#14532d",
  },
  lime: { bg: "#84cc16", light: "#f7fee7", border: "#65a30d", text: "#365314" },
  red: { bg: "#ef4444", light: "#fee2e2", border: "#dc2626", text: "#7f1d1d" },
  yellow: {
    bg: "#eab308",
    light: "#fefce8",
    border: "#ca8a04",
    text: "#713f12",
  },
};

type ColorKey = keyof typeof COLORS;

// ── Trigger & Action definitions ─────────────────────────────────────────────
const triggers = [
  {
    id: "t1",
    label: "Payment Alert",
    desc: "Razorpay trigger",
    icon: Zap,
    color: "violet" as ColorKey,
    trigger_key: "razorpay.payment.captured",
    group: "Payments",
  },
  {
    id: "t2",
    label: "Schedule",
    desc: "Run periodically",
    icon: Clock,
    color: "cyan" as ColorKey,
    trigger_key: "schedule",
    group: "General",
  },
  {
    id: "t3",
    label: "Google Forms Submission",
    desc: "Trigger when a Google Form is submitted",
    icon: TrendingUp,
    color: "emerald" as ColorKey,
    trigger_key: "googleforms.submission",
    group: "General",
  },
  {
    id: "t4",
    label: "CRM Event",
    desc: "Zoho / Freshworks",
    icon: DollarSign,
    color: "rose" as ColorKey,
    trigger_key: "crm.event",
    group: "CRM",
  },
  {
    id: "t5",
    label: "Webhook",
    desc: "Custom API endpoint",
    icon: Layout,
    color: "amber" as ColorKey,
    trigger_key: "webhook",
    group: "General",
  },
  {
    id: "t6",
    label: "Instamojo Payment",
    desc: "Payment received on Instamojo",
    icon: CreditCard,
    color: "indigo" as ColorKey,
    trigger_key: "instamojo.payment.captured",
    group: "Payments",
  },
  {
    id: "t7",
    label: "Instamojo Daily",
    desc: "Daily Instamojo report",
    icon: TrendingUp,
    color: "teal" as ColorKey,
    trigger_key: "instamojo.daily.summary",
    group: "Payments",
  },
  {
    id: "t8",
    label: "Invoice Generated",
    desc: "After PDF invoice is created",
    icon: FileText,
    color: "orange" as ColorKey,
    trigger_key: "invoice.generated",
    group: "Invoice",
  },
  {
    id: "t9",
    label: "Invoice Sent",
    desc: "After invoice email/WA sent",
    icon: Send,
    color: "pink" as ColorKey,
    trigger_key: "invoice.sent",
    group: "Invoice",
  },
  {
    id: "t10",
    label: "Razorpay Captured",
    desc: "Payment captured on Razorpay",
    icon: IndianRupee,
    color: "blue" as ColorKey,
    trigger_key: "razorpay.payment.captured.mcp",
    group: "Payments",
  },
  {
    id: "t11",
    label: "Razorpay Daily",
    desc: "Daily Razorpay analytics",
    icon: BarChart2,
    color: "sky" as ColorKey,
    trigger_key: "razorpay.daily.summary",
    group: "Payments",
  },
  {
    id: "t12",
    label: "Subscription Created",
    desc: "New subscription started",
    icon: Repeat,
    color: "teal" as ColorKey,
    trigger_key: "subscription.created",
    group: "Subscriptions",
  },
  {
    id: "t13",
    label: "Subscription Halted",
    desc: "Subscription payment failed/halted",
    icon: XCircle,
    color: "rose" as ColorKey,
    trigger_key: "subscription.halted",
    group: "Subscriptions",
  },
  {
    id: "t14",
    label: "Subscription Expiring",
    desc: "Subscription expiring soon",
    icon: Clock,
    color: "amber" as ColorKey,
    trigger_key: "subscription.expiring",
    group: "Subscriptions",
  },
  {
    id: "t15",
    label: "Subscription Cancelled",
    desc: "Subscription was cancelled",
    icon: XCircle,
    color: "red" as ColorKey,
    trigger_key: "subscription.cancelled",
    group: "Subscriptions",
  },
  {
    id: "t20",
    label: "Tally Form Submit",
    desc: "Tally MCP form submission",
    icon: TrendingUp,
    color: "yellow" as ColorKey,
    trigger_key: "tally.form.submit",
    group: "General",
  },
  {
    id: "t16",
    label: "Telegram Message",
    desc: "New message received by bot",
    icon: Bot,
    color: "sky" as ColorKey,
    trigger_key: "telegram.message",
    group: "Telegram",
  },
  {
    id: "t17",
    label: "Telegram Command",
    desc: "/command sent to bot",
    icon: Bot,
    color: "blue" as ColorKey,
    trigger_key: "telegram.command",
    group: "Telegram",
  },
  {
    id: "t18",
    label: "Zoho: Lead Created",
    desc: "New lead created in Zoho CRM",
    icon: UserPlus,
    color: "green" as ColorKey,
    trigger_key: "zoho.lead.created",
    group: "CRM",
  },
  {
    id: "t19",
    label: "Zoho: Deal Updated",
    desc: "Deal stage changed in Zoho CRM",
    icon: Briefcase,
    color: "lime" as ColorKey,
    trigger_key: "zoho.deal.updated",
    group: "CRM",
  },
];

const actions = [
  {
    id: "a1",
    label: "WhatsApp",
    desc: "Send WhatsApp message",
    icon: MessageSquare,
    color: "blue" as ColorKey,
    action_key: "send_whatsapp",
    group: "Messaging",
  },
  {
    id: "a2",
    label: "Sheets Row",
    desc: "Add to Google Sheets",
    icon: Repeat,
    color: "violet" as ColorKey,
    action_key: "update_sheet",
    group: "General",
  },
  {
    id: "a3",
    label: "Zoho Lead",
    desc: "Create CRM lead",
    icon: DollarSign,
    color: "rose" as ColorKey,
    action_key: "add_zoho_lead",
    group: "CRM",
  },
  {
    id: "a4",
    label: "Send Email",
    desc: "Gmail / Outlook",
    icon: Mail,
    color: "emerald" as ColorKey,
    action_key: "send_email",
    group: "Messaging",
  },
  {
    id: "a5",
    label: "SMS Alert",
    desc: "Fast2SMS / Twilio",
    icon: Image,
    color: "pink" as ColorKey,
    action_key: "send_sms",
    group: "Messaging",
  },
  {
    id: "a6",
    label: "API Call",
    desc: "Custom HTTP Request",
    icon: Blocks,
    color: "orange" as ColorKey,
    action_key: "api_call",
    group: "General",
  },
  {
    id: "a7",
    label: "Send Gmail",
    desc: "Gmail confirmation",
    icon: Mail,
    color: "teal" as ColorKey,
    action_key: "send_gmail",
    group: "Messaging",
  },
  {
    id: "a8",
    label: "Schedule Call",
    desc: "Google Calendar",
    icon: Clock,
    color: "blue" as ColorKey,
    action_key: "schedule_meeting",
    group: "General",
  },
  {
    id: "a9",
    label: "Instamojo: Notify",
    desc: "WhatsApp + Email after payment",
    icon: CreditCard,
    color: "indigo" as ColorKey,
    action_key: "instamojo_notify_complete",
    group: "Instamojo",
  },
  {
    id: "a10",
    label: "Instamojo: WA Report",
    desc: "Send daily summary on WhatsApp",
    icon: MessageSquare,
    color: "teal" as ColorKey,
    action_key: "instamojo_summary_whatsapp",
    group: "Instamojo",
  },
  {
    id: "a11",
    label: "Instamojo: Create Link",
    desc: "Generate payment link",
    icon: LinkIcon,
    color: "amber" as ColorKey,
    action_key: "instamojo_create_link",
    group: "Instamojo",
  },
  {
    id: "a12",
    label: "Invoice: Full Flow",
    desc: "PDF + WhatsApp + Email",
    icon: FileText,
    color: "orange" as ColorKey,
    action_key: "invoice_full_flow",
    group: "Invoice",
  },
  {
    id: "a13",
    label: "Invoice: WhatsApp",
    desc: "Send invoice via WhatsApp",
    icon: MessageSquare,
    color: "green" as ColorKey,
    action_key: "invoice_whatsapp",
    group: "Invoice",
  },
  {
    id: "a14",
    label: "Invoice: Email",
    desc: "Email PDF invoice to customer",
    icon: Mail,
    color: "sky" as ColorKey,
    action_key: "invoice_email",
    group: "Invoice",
  },
  {
    id: "a15",
    label: "Invoice: WA Direct",
    desc: "Send custom WhatsApp message",
    icon: Send,
    color: "lime" as ColorKey,
    action_key: "invoice_wa_direct",
    group: "Invoice",
  },
  {
    id: "a16",
    label: "Razorpay: Today",
    desc: "Fetch today's payments",
    icon: IndianRupee,
    color: "blue" as ColorKey,
    action_key: "razorpay_todays_payments",
    group: "Razorpay",
  },
  {
    id: "a17",
    label: "Razorpay: Date Range",
    desc: "Fetch payments by date range",
    icon: Search,
    color: "sky" as ColorKey,
    action_key: "razorpay_payments_range",
    group: "Razorpay",
  },
  {
    id: "a18",
    label: "Razorpay: Lookup",
    desc: "Fetch single payment details",
    icon: Search,
    color: "violet" as ColorKey,
    action_key: "razorpay_payment_detail",
    group: "Razorpay",
  },
  {
    id: "a19",
    label: "Razorpay: Analytics",
    desc: "Revenue stats & method breakdown",
    icon: BarChart2,
    color: "indigo" as ColorKey,
    action_key: "razorpay_payment_summary",
    group: "Razorpay",
  },
  {
    id: "a20",
    label: "Sub: List All",
    desc: "Fetch all subscriptions",
    icon: Repeat,
    color: "teal" as ColorKey,
    action_key: "sub_list_all",
    group: "Subscriptions",
  },
  {
    id: "a21",
    label: "Sub: Lookup",
    desc: "Fetch subscription by ID",
    icon: Search,
    color: "cyan" as ColorKey,
    action_key: "sub_lookup",
    group: "Subscriptions",
  },
  {
    id: "a22",
    label: "Sub: Cancel",
    desc: "Cancel a subscription",
    icon: XCircle,
    color: "rose" as ColorKey,
    action_key: "sub_cancel",
    group: "Subscriptions",
  },
  {
    id: "a23",
    label: "Sub: Pause",
    desc: "Pause an active subscription",
    icon: PauseCircle,
    color: "amber" as ColorKey,
    action_key: "sub_pause",
    group: "Subscriptions",
  },
  {
    id: "a24",
    label: "Sub: Resume",
    desc: "Resume a paused subscription",
    icon: PlayCircle,
    color: "emerald" as ColorKey,
    action_key: "sub_resume",
    group: "Subscriptions",
  },
  {
    id: "a25",
    label: "Sub: Summary",
    desc: "Health & churn summary",
    icon: BarChart2,
    color: "sky" as ColorKey,
    action_key: "sub_summary",
    group: "Subscriptions",
  },
  {
    id: "a26",
    label: "Sub: Expiring Soon",
    desc: "Subscriptions expiring in N days",
    icon: Clock,
    color: "orange" as ColorKey,
    action_key: "sub_expiring",
    group: "Subscriptions",
  },
  {
    id: "a27",
    label: "Sub: Failed/Halted",
    desc: "Fetch failed subscriptions",
    icon: AlertCircle,
    color: "red" as ColorKey,
    action_key: "sub_failed",
    group: "Subscriptions",
  },
  {
    id: "a28",
    label: "Sub: Create",
    desc: "Create a new subscription",
    icon: Plus,
    color: "green" as ColorKey,
    action_key: "sub_create",
    group: "Subscriptions",
  },
  {
    id: "a29",
    label: "Sub: Plans",
    desc: "List all subscription plans",
    icon: FileText,
    color: "violet" as ColorKey,
    action_key: "sub_plans",
    group: "Subscriptions",
  },
  {
    id: "a30",
    label: "Sub: Revenue (MRR/ARR)",
    desc: "Calculate recurring revenue",
    icon: TrendingUp,
    color: "indigo" as ColorKey,
    action_key: "sub_revenue",
    group: "Subscriptions",
  },
  {
    id: "a31",
    label: "Telegram: Send Message",
    desc: "Send text to a chat/group/channel",
    icon: Bot,
    color: "sky" as ColorKey,
    action_key: "telegram_send_message",
    group: "Telegram",
  },
  {
    id: "a32",
    label: "Telegram: Payment Alert",
    desc: "Send formatted payment alert",
    icon: Bot,
    color: "blue" as ColorKey,
    action_key: "telegram_payment_alert",
    group: "Telegram",
  },
  {
    id: "a33",
    label: "Telegram: Bot Info",
    desc: "Get bot name, username, ID",
    icon: Bot,
    color: "cyan" as ColorKey,
    action_key: "telegram_bot_info",
    group: "Telegram",
  },
  {
    id: "a34",
    label: "Telegram: Get Updates",
    desc: "Fetch recent messages / chat IDs",
    icon: Bot,
    color: "indigo" as ColorKey,
    action_key: "telegram_get_updates",
    group: "Telegram",
  },
  {
    id: "a35",
    label: "Zoho: Create Lead",
    desc: "Add new lead to Zoho CRM",
    icon: UserPlus,
    color: "green" as ColorKey,
    action_key: "zoho_create_lead",
    group: "Zoho CRM",
  },
  {
    id: "a36",
    label: "Zoho: Create Contact",
    desc: "Add paying customer as contact",
    icon: Users,
    color: "emerald" as ColorKey,
    action_key: "zoho_create_contact",
    group: "Zoho CRM",
  },
  {
    id: "a37",
    label: "Zoho: Create Deal",
    desc: "Create opportunity/deal",
    icon: Briefcase,
    color: "lime" as ColorKey,
    action_key: "zoho_create_deal",
    group: "Zoho CRM",
  },
  {
    id: "a38",
    label: "Zoho: Create Task",
    desc: "Create follow-up task",
    icon: ListChecks,
    color: "yellow" as ColorKey,
    action_key: "zoho_create_task",
    group: "Zoho CRM",
  },
  {
    id: "a39",
    label: "Zoho: Search Leads",
    desc: "Search CRM leads by email/name",
    icon: Search,
    color: "teal" as ColorKey,
    action_key: "zoho_search_leads",
    group: "Zoho CRM",
  },
  {
    id: "a40",
    label: "Zoho: Update Lead",
    desc: "Update an existing lead",
    icon: UserPlus,
    color: "cyan" as ColorKey,
    action_key: "zoho_update_lead",
    group: "Zoho CRM",
  },
  {
    id: "a41",
    label: "Zoho: Get Leads",
    desc: "Fetch recent leads list",
    icon: Users,
    color: "sky" as ColorKey,
    action_key: "zoho_get_leads",
    group: "Zoho CRM",
  },
];

// ── Custom Node Components ────────────────────────────────────────────────────
interface NodeData {
  label: string;
  desc: string;
  color: ColorKey;
  nodeType: "trigger" | "action";
  icon: React.ComponentType<{ size?: number }>;
  isSelected?: boolean;
  onRemove?: (id: string) => void;
}

const TriggerNode = ({
  id,
  data,
  selected,
}: {
  id: string;
  data: NodeData;
  selected: boolean;
}) => {
  const colors = COLORS[data.color] || COLORS.violet;
  const Icon = data.icon;

  return (
    <div
      className={`trigger-node ${selected ? 'selected' : ''}`}
      style={{
        border: `2px solid ${selected ? colors.bg : colors.border}`,
      }}
    >
      <div
        className="trigger-node-header"
        style={{
          background: `linear-gradient(135deg, ${colors.bg}, ${colors.border})`,
        }}
      >
        <div className="trigger-node-icon-container">
          <Icon size={15} />
        </div>
        <div className="trigger-node-content">
          <div className="trigger-node-label-type">
            TRIGGER
          </div>
          <div className="trigger-node-label">
            {data.label}
          </div>
        </div>
        <Zap size={14} color="rgba(255,255,255,0.7)" />
      </div>
      <div
        className="trigger-node-desc"
        style={{
          background: colors.light,
        }}
      >
        {data.desc}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="trigger-node-handle"
        style={{
          background: colors.bg,
          boxShadow: `0 0 0 2px ${colors.bg}`,
        }}
      />
    </div>
  );
};

const ActionNode = ({
  id,
  data,
  selected,
}: {
  id: string;
  data: NodeData;
  selected: boolean;
}) => {
  const colors = COLORS[data.color] || COLORS.blue;
  const Icon = data.icon;

  return (
    <div
      className={`action-node ${selected ? 'selected' : ''}`}
      style={{
        border: `2px solid ${selected ? colors.bg : "#e5e7eb"}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="action-node-handle action-node-handle-top"
        style={{
          background: colors.bg,
          boxShadow: `0 0 0 2px ${colors.bg}`,
        }}
      />
      <div
        className="action-node-header"
        style={{
          borderBottom: `1px solid ${colors.light}`,
        }}
      >
        <div
          className="action-node-icon-container"
          style={{
            background: colors.light,
            border: `1.5px solid ${colors.border}30`,
          }}
        >
          <Icon size={15} />
        </div>
        <div className="action-node-content">
          <div
            className="action-node-label-type"
            style={{
              color: colors.text,
            }}
          >
            ACTION
          </div>
          <div className="action-node-label">
            {data.label}
          </div>
        </div>
        <button
          onClick={() => data.onRemove?.(id)}
          onMouseDown={(e) => e.stopPropagation()}
          className="action-node-remove-btn"
          title="Remove node"
        >
          <Trash2 size={12} color="#ef4444" />
        </button>
      </div>
      <div className="action-node-desc">
        {data.desc}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="action-node-handle"
        style={{
          background: colors.bg,
          boxShadow: `0 0 0 2px ${colors.bg}`,
        }}
      />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  trigger: TriggerNode as any,
  action: ActionNode as any,
};

// ── Config Interfaces ─────────────────────────────────────────────────────────
interface InstamojoConfig {
  payment_id: string;
  whatsapp_phone: string;
  link_purpose: string;
  link_amount: string;
  link_name: string;
}
interface InvoiceConfig {
  payment_id: string;
  amount: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name: string;
  company_name: string;
  send_email: boolean;
  send_whatsapp: boolean;
  invoice_number: string;
  pdf_path: string;
  wa_message: string;
}
interface RazorpayConfig {
  from_date: string;
  to_date: string;
  payment_id: string;
  days: number;
}
interface SubscriptionConfig {
  list_count: number;
  list_status: string;
  subscription_id: string;
  cancel_at_cycle_end: boolean;
  pause_at: "now" | "cycle_end";
  expiring_days: number;
  failed_count: number;
  plan_id: string;
  total_count: number;
  quantity: number;
  customer_notify: boolean;
  note_name: string;
  note_email: string;
  plans_count: number;
}
interface TelegramConfig {
  chat_id: string;
  message: string;
  parse_mode: string;
  amount: string;
  customer_name: string;
  plan: string;
  payment_id: string;
}
interface ZohoConfig {
  lead_first_name: string;
  lead_last_name: string;
  lead_email: string;
  lead_phone: string;
  lead_company: string;
  lead_source: string;
  lead_amount: string;
  lead_description: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  contact_account_name: string;
  contact_description: string;
  deal_name: string;
  deal_amount: string;
  deal_stage: string;
  deal_contact_name: string;
  deal_account_name: string;
  deal_closing_date: string;
  deal_description: string;
  task_subject: string;
  task_due_date: string;
  task_status: string;
  task_priority: string;
  task_description: string;
  search_email: string;
  search_name: string;
  update_lead_id: string;
  update_fields: string;
  get_leads_count: number;
}
interface GoogleFormsTriggerConfig {
  form_id: string;
  mode: "polling" | "webhook";
  poll_interval_sec: number;
  field_mapping_text: string;
}

const defaultInvoiceConfig: InvoiceConfig = {
  payment_id: "",
  amount: "",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  product_name: "",
  company_name: "Pravah",
  send_email: true,
  send_whatsapp: true,
  invoice_number: "",
  pdf_path: "",
  wa_message: "",
};
const defaultRazorpayConfig: RazorpayConfig = {
  from_date: "",
  to_date: "",
  payment_id: "",
  days: 7,
};
const defaultSubscriptionConfig: SubscriptionConfig = {
  list_count: 10,
  list_status: "",
  subscription_id: "",
  cancel_at_cycle_end: false,
  pause_at: "now",
  expiring_days: 7,
  failed_count: 20,
  plan_id: "",
  total_count: 12,
  quantity: 1,
  customer_notify: true,
  note_name: "",
  note_email: "",
  plans_count: 10,
};
const defaultTelegramConfig: TelegramConfig = {
  chat_id: "",
  message: "",
  parse_mode: "Markdown",
  amount: "",
  customer_name: "",
  plan: "",
  payment_id: "",
};
const defaultZohoConfig: ZohoConfig = {
  lead_first_name: "",
  lead_last_name: "",
  lead_email: "",
  lead_phone: "",
  lead_company: "",
  lead_source: "Web",
  lead_amount: "",
  lead_description: "",
  contact_first_name: "",
  contact_last_name: "",
  contact_email: "",
  contact_phone: "",
  contact_account_name: "",
  contact_description: "",
  deal_name: "",
  deal_amount: "",
  deal_stage: "Qualification",
  deal_contact_name: "",
  deal_account_name: "",
  deal_closing_date: "",
  deal_description: "",
  task_subject: "",
  task_due_date: "",
  task_status: "Not Started",
  task_priority: "Medium",
  task_description: "",
  search_email: "",
  search_name: "",
  update_lead_id: "",
  update_fields: "{}",
  get_leads_count: 10,
};
const defaultGoogleFormsTriggerConfig: GoogleFormsTriggerConfig = {
  form_id: "",
  mode: "polling",
  poll_interval_sec: 60,
  field_mapping_text: "lead_name=Full Name\nlead_email=Email\nlead_phone=Phone Number",
};

// ── Sidebar group helper ──────────────────────────────────────────────────────
function groupItems<T extends { group: string }>(
  items: T[],
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

// ── Sidebar Item ──────────────────────────────────────────────────────────────
const SidebarItem = ({
  item,
  isSelected,
  onDragStart,
  onClick,
}: {
  item: (typeof triggers)[0] | (typeof actions)[0];
  isSelected: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
}) => {
  const colors = COLORS[item.color];
  const Icon = item.icon;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 10,
        cursor: "grab",
        border: isSelected
          ? `1.5px solid ${colors.bg}`
          : "1.5px solid transparent",
        background: isSelected ? colors.light : "#fff",
        marginBottom: 4,
        transition: "all 0.15s ease",
        position: "relative",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = "#f9fafb";
          (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.background = "#fff";
          (e.currentTarget as HTMLElement).style.borderColor = "transparent";
        }
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: colors.light,
          border: `1px solid ${colors.border}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={colors.bg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1f2937",
            lineHeight: 1.3,
          }}
        >
          {item.label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.desc}
        </div>
      </div>
      {isSelected && (
        <CheckCircle size={14} color={colors.bg} style={{ flexShrink: 0 }} />
      )}
    </div>
  );
};

// ── Main Builder (inner, needs ReactFlowProvider context) ─────────────────────
function BuilderInner() {
  const navigate = useNavigate();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [selectedTab, setSelectedTab] = useState<"triggers" | "actions">(
    "triggers",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isAuthed, setIsAuthed] = useState(!!getToken());
  const [showMinimap, setShowMinimap] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Configs
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {name}, your payment of ₹{amount} has been received! 🎉\nPayment ID: {payment_id}\nThank you 🙏",
  );
  const [toNumber, setToNumber] = useState("");
  const [instaConfig, setInstaConfig] = useState<InstamojoConfig>({
    payment_id: "",
    whatsapp_phone: "",
    link_purpose: "",
    link_amount: "",
    link_name: "",
  });
  const [invoiceConfig, setInvoiceConfig] =
    useState<InvoiceConfig>(defaultInvoiceConfig);
  const [rzpConfig, setRzpConfig] = useState<RazorpayConfig>(
    defaultRazorpayConfig,
  );
  const [subConfig, setSubConfig] = useState<SubscriptionConfig>(
    defaultSubscriptionConfig,
  );
  const [tgConfig, setTgConfig] = useState<TelegramConfig>(
    defaultTelegramConfig,
  );
  const [zohoConfig, setZohoConfig] = useState<ZohoConfig>(defaultZohoConfig);
  const [googleTriggerConfig, setGoogleTriggerConfig] =
    useState<GoogleFormsTriggerConfig>(defaultGoogleFormsTriggerConfig);
  const [googleOauthConnected, setGoogleOauthConnected] = useState(false);
  const [googleOauthLoading, setGoogleOauthLoading] = useState(false);
  const [googleTriggerTesting, setGoogleTriggerTesting] = useState(false);
  const [googleTriggerTestResult, setGoogleTriggerTestResult] =
    useState<any>(null);

  // Result states
  const [instaResult, setInstaResult] = useState<any>(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [rzpResult, setRzpResult] = useState<any>(null);
  const [rzpLoading, setRzpLoading] = useState(false);
  const [subResult, setSubResult] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [tgResult, setTgResult] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [zohoResult, setZohoResult] = useState<any>(null);
  const [zohoLoading, setZohoLoading] = useState(false);

  const nodeIdCounter = useRef(1);

  // Derived state from nodes
  const triggerNode = useMemo(
    () => nodes.find((n) => n.type === "trigger"),
    [nodes],
  );
  const actionNodes = useMemo(
    () => nodes.filter((n) => n.type === "action"),
    [nodes],
  );

  const selectedTrigger = useMemo(() => {
    if (!triggerNode) return triggers[0];
    return (
      triggers.find((t) => t.id === triggerNode.data.itemId) || triggers[0]
    );
  }, [triggerNode]);

  const selectedActions = useMemo(() => {
    return actionNodes
      .map((n) => actions.find((a) => a.id === n.data.itemId))
      .filter(Boolean) as typeof actions;
  }, [actionNodes]);

  // Flags
  const hasInstaAction = selectedActions.some((a) =>
    a.action_key.startsWith("instamojo_"),
  );
  const hasInvoiceAction = selectedActions.some((a) =>
    a.action_key.startsWith("invoice_"),
  );
  const hasRzpAction = selectedActions.some((a) =>
    a.action_key.startsWith("razorpay_"),
  );
  const hasSubAction = selectedActions.some((a) =>
    a.action_key.startsWith("sub_"),
  );
  const hasTgAction = selectedActions.some((a) =>
    a.action_key.startsWith("telegram_"),
  );
  const hasZohoAction = selectedActions.some((a) =>
    a.action_key.startsWith("zoho_"),
  );

  // Remove node handler
  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds: Edge[]) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [setNodes, setEdges],
  );

  // Initialize with trigger node
  useEffect(() => {
    const initialTrigger = triggers[0];
    setNodes([
      {
        id: "trigger-0",
        type: "trigger",
        position: { x: 300, y: 60 },
        data: {
          label: initialTrigger.label,
          desc: initialTrigger.desc,
          color: initialTrigger.color,
          nodeType: "trigger",
          icon: initialTrigger.icon,
          itemId: initialTrigger.id,
        },
        dragHandle: ".drag-handle",
      },
    ]);
  }, []);

  useEffect(() => {
    const token = getToken();
    setIsAuthed(!!token);
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    if (selectedTrigger?.trigger_key !== "googleforms.submission") return;
    loadGoogleOauthStatus();
  }, [isAuthed, selectedTrigger?.trigger_key]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function parseGoogleFieldMapping(text: string) {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const mapping: Record<string, string> = {};
    for (const line of lines) {
      const [rawVariable, ...rest] = line.split("=");
      const variable = (rawVariable || "").trim();
      const sourceField = rest.join("=").trim();
      if (!variable || !sourceField) continue;
      mapping[variable] = sourceField;
    }

    return mapping;
  }

  function buildGoogleTriggerConfigPayload() {
    return {
      form_id: googleTriggerConfig.form_id.trim(),
      mode: googleTriggerConfig.mode,
      poll_interval_sec: Math.max(15, Number(googleTriggerConfig.poll_interval_sec) || 60),
      field_mapping: parseGoogleFieldMapping(googleTriggerConfig.field_mapping_text),
    };
  }

  async function loadGoogleOauthStatus() {
    if (!isAuthed) return;
    setGoogleOauthLoading(true);
    try {
      const status = await apiCall("/googleforms/oauth/status", { method: "GET" });
      setGoogleOauthConnected(!!status.connected);
    } catch {
      setGoogleOauthConnected(false);
    } finally {
      setGoogleOauthLoading(false);
    }
  }

  async function startGoogleOauth() {
    if (!isAuthed) {
      navigate("/login");
      return;
    }

    setGoogleOauthLoading(true);
    try {
      const result = await apiCall("/googleforms/oauth/start", { method: "GET" });
      if (!result?.url) throw new Error("OAuth URL not received");
      window.open(result.url, "_blank", "noopener,noreferrer");
      showToast("Google OAuth started in a new tab", "success");
    } catch (error: any) {
      showToast(error.message || "Unable to start Google OAuth", "error");
    } finally {
      setGoogleOauthLoading(false);
    }
  }

  async function testGoogleTrigger() {
    const payload = buildGoogleTriggerConfigPayload();
    if (!payload.form_id) {
      showToast("Form ID is required to test trigger", "error");
      return;
    }

    setGoogleTriggerTesting(true);
    setGoogleTriggerTestResult(null);
    try {
      const result = await apiCall("/triggers/googleforms/test", {
        method: "POST",
        body: JSON.stringify({
          form_id: payload.form_id,
          field_mapping: payload.field_mapping,
        }),
      });
      setGoogleTriggerTestResult(result);
      if (result?.has_response) {
        const mappedCount = Object.keys(result?.response?.mapped || {}).length;
        showToast(`Trigger test passed (${mappedCount} mapped variables)`, "success");
      } else {
        showToast("Trigger test ran: no responses found yet", "success");
      }
    } catch (error: any) {
      showToast(error.message || "Trigger test failed", "error");
    } finally {
      setGoogleTriggerTesting(false);
    }
  }

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
            style: { stroke: "#6366f1", strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // ── NEW: Handle edge deletion ─────────────────────────────────────────────
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      setEdges((eds) =>
        eds.filter((e) => !deletedEdges.find((d) => d.id === e.id)),
      );
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) return;
      const { type, itemId } = JSON.parse(raw);
      const sourceList = type === "trigger" ? triggers : actions;
      const sidebarItem = sourceList.find((item) => item.id === itemId);
      if (!sidebarItem) return;

      const reactFlowBounds = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 110,
        y: event.clientY - reactFlowBounds.top - 40,
      };

      if (type === "trigger") {
        setNodes((nds) => {
          const filtered = nds.filter((n) => n.type !== "trigger");
          return [
            ...filtered,
            {
              id: "trigger-0",
              type: "trigger",
              position,
              data: {
                label: sidebarItem.label,
                desc: sidebarItem.desc,
                color: sidebarItem.color,
                nodeType: "trigger",
                icon: sidebarItem.icon,
                itemId: sidebarItem.id,
              },
            },
          ];
        });
      } else {
        const newId = `action-${nodeIdCounter.current++}`;
        const newNode: Node = {
          id: newId,
          type: "action",
          position,
          data: {
            label: sidebarItem.label,
            desc: sidebarItem.desc,
            color: sidebarItem.color,
            nodeType: "action",
            icon: sidebarItem.icon,
            itemId: sidebarItem.id,
            onRemove: handleRemoveNode,
          },
        };
        setNodes((nds) => {
          const allNodes = [...nds, newNode];
          const lastNode = nds[nds.length - 1];
          if (lastNode) {
            setEdges((eds) =>
              addEdge(
                {
                  id: `e-${lastNode.id}-${newId}`,
                  source: lastNode.id,
                  target: newId,
                  type: "smoothstep",
                  animated: true,
                  markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
                  style: { stroke: "#6366f1", strokeWidth: 2 },
                },
                eds,
              ),
            );
          }
          return allNodes;
        });
      }
    },
    [setNodes, setEdges, handleRemoveNode],
  );

  function handleSidebarClick(
    item: (typeof triggers)[0] | (typeof actions)[0],
    type: "trigger" | "action",
  ) {
    if (type === "trigger") {
      setNodes((nds) => {
        const existing = nds.find((n) => n.type === "trigger");
        const position = existing?.position || { x: 300, y: 60 };
        const filtered = nds.filter((n) => n.type !== "trigger");
        return [
          ...filtered,
          {
            id: "trigger-0",
            type: "trigger",
            position,
            data: {
              label: item.label,
              desc: item.desc,
              color: (item as any).color,
              nodeType: "trigger",
              icon: item.icon,
              itemId: item.id,
            },
          },
        ];
      });
    } else {
      if (actionNodes.some((n) => n.data.itemId === item.id)) return;
      const lastAction = actionNodes[actionNodes.length - 1];
      const yOffset = lastAction ? lastAction.position.y + 160 : 240;
      const newId = `action-${nodeIdCounter.current++}`;
      const newNode: Node = {
        id: newId,
        type: "action",
        position: { x: 300, y: yOffset },
        data: {
          label: item.label,
          desc: item.desc,
          color: (item as any).color,
          nodeType: "action",
          icon: item.icon,
          itemId: item.id,
          onRemove: handleRemoveNode,
        },
      };
      setNodes((nds) => {
        const lastNode = nds[nds.length - 1];
        if (lastNode) {
          setEdges((eds) =>
            addEdge(
              {
                id: `e-${lastNode.id}-${newId}`,
                source: lastNode.id,
                target: newId,
                type: "smoothstep",
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
                style: { stroke: "#6366f1", strokeWidth: 2 },
              },
              eds,
            ),
          );
        }
        return [...nds, newNode];
      });
    }
  }

  function buildPayload() {
    const triggerConfig: Record<string, any> = {};
    if (selectedTrigger?.trigger_key === "googleforms.submission") {
      triggerConfig.googleforms = buildGoogleTriggerConfigPayload();
    }

    return {
      name: workflowName,
      trigger: selectedTrigger.trigger_key,
      trigger_config: triggerConfig,
      actions: selectedActions.map((a) => ({
        type: a.action_key,
        message_template: messageTemplate,
        to_number: toNumber || undefined,
        ...(a.action_key.startsWith("instamojo_")
          ? { instamojo: instaConfig }
          : {}),
        ...(a.action_key.startsWith("invoice_")
          ? { invoice: invoiceConfig }
          : {}),
        ...(a.action_key.startsWith("razorpay_")
          ? { razorpay: rzpConfig }
          : {}),
        ...(a.action_key.startsWith("sub_") ? { subscription: subConfig } : {}),
        ...(a.action_key.startsWith("telegram_") ? { telegram: tgConfig } : {}),
        ...(a.action_key.startsWith("zoho_") ? { zoho: zohoConfig } : {}),
      })),
    };
  }

  async function handleSave() {
    if (!isAuthed) { navigate("/login"); return; }
    setSaving(true);
    try {
      await apiCall("/workflows/", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });
      showToast("Workflow saved! ✅", "success");
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeploy() {
    if (!isAuthed) { navigate("/login"); return; }
    setDeploying(true);
    try {
      const wf = await apiCall("/workflows/", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });
      await apiCall(`/workflows/${wf.id}/toggle`, { method: "PATCH" });
      if (hasInstaAction) await runInstamojoActions();
      if (hasInvoiceAction) await runInvoiceActions();
      if (hasRzpAction) await runRazorpayActions();
      if (hasSubAction) await runSubscriptionActions();
      if (hasTgAction) await runTelegramActions();
      if (hasZohoAction) await runZohoActions();
      showToast("Workflow deployed & active! 🚀", "success");
    } catch (err: any) {
      showToast(err.message || "Deploy failed", "error");
    } finally {
      setDeploying(false);
    }
  }

  // ── Action runners ──────────────────────────────────────────────────────────
  async function runZohoActions() {
    setZohoLoading(true);
    setZohoResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("zoho_")) continue;
      try {
        switch (action.action_key) {
          case "zoho_create_lead":
            results[action.label] = await callZohoBridge("create_lead", {
              first_name: zohoConfig.lead_first_name || undefined,
              last_name: zohoConfig.lead_last_name,
              email: zohoConfig.lead_email,
              phone: zohoConfig.lead_phone || undefined,
              company: zohoConfig.lead_company || undefined,
              lead_source: zohoConfig.lead_source || "Web",
              amount: zohoConfig.lead_amount ? Number(zohoConfig.lead_amount) : undefined,
              description: zohoConfig.lead_description || undefined,
            });
            break;
          case "zoho_create_contact":
            results[action.label] = await callZohoBridge("create_contact", {
              first_name: zohoConfig.contact_first_name || undefined,
              last_name: zohoConfig.contact_last_name,
              email: zohoConfig.contact_email,
              phone: zohoConfig.contact_phone || undefined,
              account_name: zohoConfig.contact_account_name || undefined,
              description: zohoConfig.contact_description || undefined,
            });
            break;
          case "zoho_create_deal":
            results[action.label] = await callZohoBridge("create_deal", {
              deal_name: zohoConfig.deal_name,
              amount: zohoConfig.deal_amount ? Number(zohoConfig.deal_amount) : undefined,
              stage: zohoConfig.deal_stage || "Qualification",
              contact_name: zohoConfig.deal_contact_name || undefined,
              account_name: zohoConfig.deal_account_name || undefined,
              closing_date: zohoConfig.deal_closing_date || undefined,
              description: zohoConfig.deal_description || undefined,
            });
            break;
          case "zoho_create_task":
            results[action.label] = await callZohoBridge("create_task", {
              subject: zohoConfig.task_subject,
              due_date: zohoConfig.task_due_date || undefined,
              status: zohoConfig.task_status || "Not Started",
              priority: zohoConfig.task_priority || "Medium",
              description: zohoConfig.task_description || undefined,
            });
            break;
          case "zoho_search_leads":
            results[action.label] = await callZohoBridge("search_leads", {
              email: zohoConfig.search_email || undefined,
              name: zohoConfig.search_name || undefined,
            });
            break;
          case "zoho_update_lead":
            results[action.label] = await callZohoBridge("update_lead", {
              lead_id: zohoConfig.update_lead_id,
              fields: JSON.parse(zohoConfig.update_fields),
            });
            break;
          case "zoho_get_leads":
            results[action.label] = await callZohoBridge("get_leads", {
              per_page: zohoConfig.get_leads_count || 10,
            });
            break;
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setZohoResult(results);
    setZohoLoading(false);
  }

  async function runTelegramActions() {
    setTgLoading(true);
    setTgResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("telegram_")) continue;
      try {
        if (action.action_key === "telegram_send_message")
          results[action.label] = await sendTelegramMessage(tgConfig.chat_id, tgConfig.message, tgConfig.parse_mode || "Markdown");
        if (action.action_key === "telegram_payment_alert")
          results[action.label] = await sendTelegramPaymentAlert(tgConfig.chat_id, parseFloat(tgConfig.amount) || 0, tgConfig.customer_name, tgConfig.plan || undefined, tgConfig.payment_id || undefined);
        if (action.action_key === "telegram_bot_info")
          results[action.label] = await getBotInfo();
        if (action.action_key === "telegram_get_updates")
          results[action.label] = await getUpdates();
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setTgResult(results);
    setTgLoading(false);
  }

  async function runInstamojoActions() {
    setInstaLoading(true);
    setInstaResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("instamojo_")) continue;
      try {
        if (action.action_key === "instamojo_notify_complete")
          results[action.label] = await notifyInstamojoPaymentComplete(instaConfig.payment_id);
        if (action.action_key === "instamojo_summary_whatsapp")
          results[action.label] = await sendInstamojoDailySummaryWhatsApp(instaConfig.whatsapp_phone);
        if (action.action_key === "instamojo_create_link")
          results[action.label] = await createInstamojoLink({
            purpose: instaConfig.link_purpose,
            amount: parseFloat(instaConfig.link_amount),
            name: instaConfig.link_name,
          });
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setInstaResult(results);
    setInstaLoading(false);
  }

  async function runInvoiceActions() {
    setInvoiceLoading(true);
    setInvoiceResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("invoice_")) continue;
      try {
        if (action.action_key === "invoice_full_flow")
          results[action.label] = await processPaymentInvoice({
            payment_id: invoiceConfig.payment_id,
            amount: parseFloat(invoiceConfig.amount),
            customer_name: invoiceConfig.customer_name,
            customer_email: invoiceConfig.customer_email,
            customer_phone: invoiceConfig.customer_phone,
            product_name: invoiceConfig.product_name || undefined,
            company_name: invoiceConfig.company_name || "Pravah",
            send_email: invoiceConfig.send_email,
            send_whatsapp: invoiceConfig.send_whatsapp,
          });
        else if (action.action_key === "invoice_whatsapp")
          results[action.label] = await sendWhatsAppInvoice({
            phone: invoiceConfig.customer_phone,
            invoice_number: invoiceConfig.invoice_number,
            amount: parseFloat(invoiceConfig.amount),
            customer_name: invoiceConfig.customer_name,
            company_name: invoiceConfig.company_name || "Pravah",
            pdf_path: invoiceConfig.pdf_path || undefined,
          });
        else if (action.action_key === "invoice_email")
          results[action.label] = await sendEmailInvoice({
            customer_email: invoiceConfig.customer_email,
            customer_name: invoiceConfig.customer_name,
            invoice_number: invoiceConfig.invoice_number,
            amount: parseFloat(invoiceConfig.amount),
            company_name: invoiceConfig.company_name || "Pravah",
            pdf_path: invoiceConfig.pdf_path,
          });
        else if (action.action_key === "invoice_wa_direct")
          results[action.label] = await sendWhatsAppDirect({
            phone: invoiceConfig.customer_phone,
            message: invoiceConfig.wa_message,
          });
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setInvoiceResult(results);
    setInvoiceLoading(false);
  }

  async function runRazorpayActions() {
    setRzpLoading(true);
    setRzpResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("razorpay_")) continue;
      try {
        if (action.action_key === "razorpay_todays_payments")
          results[action.label] = await getRazorpayTodaysPayments();
        if (action.action_key === "razorpay_payments_range")
          results[action.label] = await getRazorpayPaymentsByRange(rzpConfig.from_date, rzpConfig.to_date);
        if (action.action_key === "razorpay_payment_detail")
          results[action.label] = await getRazorpayPaymentDetails(rzpConfig.payment_id.trim());
        if (action.action_key === "razorpay_payment_summary")
          results[action.label] = await getRazorpayPaymentSummary(rzpConfig.days);
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setRzpResult(results);
    setRzpLoading(false);
  }

  async function runSubscriptionActions() {
    setSubLoading(true);
    setSubResult(null);
    const results: Record<string, any> = {};
    for (const action of selectedActions) {
      if (!action.action_key.startsWith("sub_")) continue;
      try {
        switch (action.action_key) {
          case "sub_list_all":
            results[action.label] = await getAllSubscriptions(subConfig.list_count, subConfig.list_status || undefined);
            break;
          case "sub_lookup":
            results[action.label] = await getSubscriptionById(subConfig.subscription_id.trim());
            break;
          case "sub_cancel":
            results[action.label] = await cancelSubscription(subConfig.subscription_id.trim(), subConfig.cancel_at_cycle_end);
            break;
          case "sub_pause":
            results[action.label] = await pauseSubscription(subConfig.subscription_id.trim(), subConfig.pause_at);
            break;
          case "sub_resume":
            results[action.label] = await resumeSubscription(subConfig.subscription_id.trim());
            break;
          case "sub_summary":
            results[action.label] = await getSubscriptionSummary(subConfig.list_count);
            break;
          case "sub_expiring":
            results[action.label] = await getExpiringSubscriptions(subConfig.expiring_days);
            break;
          case "sub_failed":
            results[action.label] = await getFailedSubscriptions(subConfig.failed_count);
            break;
          case "sub_create": {
            const notes: Record<string, string> = {};
            if (subConfig.note_name) notes.customer_name = subConfig.note_name;
            if (subConfig.note_email) notes.customer_email = subConfig.note_email;
            results[action.label] = await createSubscription({
              plan_id: subConfig.plan_id.trim(),
              total_count: subConfig.total_count,
              quantity: subConfig.quantity,
              customer_notify: subConfig.customer_notify,
              notes: Object.keys(notes).length ? notes : undefined,
            });
            break;
          }
          case "sub_plans":
            results[action.label] = await getAllPlans(subConfig.plans_count);
            break;
          case "sub_revenue":
            results[action.label] = await getSubscriptionRevenue();
            break;
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }
    setSubResult(results);
    setSubLoading(false);
  }

  // Filtered items for sidebar
  const filteredTriggers = useMemo(() => {
    if (!searchQuery) return triggers;
    const q = searchQuery.toLowerCase();
    return triggers.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredActions = useMemo(() => {
    if (!searchQuery) return actions;
    const q = searchQuery.toLowerCase();
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const groupedTriggers = useMemo(() => groupItems(filteredTriggers), [filteredTriggers]);
  const groupedActions = useMemo(() => groupItems(filteredActions), [filteredActions]);
  const currentGroups = selectedTab === "triggers" ? groupedTriggers : groupedActions;

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#374151",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div className="builder-container">
      {/* ── Toast ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Auth Banner ── */}
      {!isAuthed && (
        <div className="auth-banner">
          <AlertCircle size={15} />
          You are not logged in. Saving workflows requires an account.
          <button
            onClick={() => navigate("/login")}
            className="auth-banner-login-btn"
          >
            <LogIn size={13} /> Login
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="builder-header">
        <div className="header-left">
          <Link
            to="/"
            className="back-btn"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="header-divider" />
          <div className="workflow-name-section">
            <div className="workflow-icon">
              <Zap size={14} color="#fff" />
            </div>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="workflow-name-input"
              placeholder="Untitled Workflow"
              aria-label="Workflow name"
            />
          </div>
        </div>

        <div className="header-actions">
          {/* Canvas controls */}
          <div className="zoom-controls">
            <button
              onClick={() => zoomOut()}
              title="Zoom out"
              className="zoom-btn"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => zoomIn()}
              title="Zoom in"
              className="zoom-btn"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              title="Fit view"
              className="zoom-btn"
            >
              <Maximize2 size={14} />
            </button>
            <div className="toolbar-divider" />
            <button
              onClick={() => setSnapToGrid((v) => !v)}
              title="Toggle grid snap"
              className={`zoom-btn ${snapToGrid ? 'active' : ''}`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setShowMinimap((v) => !v)}
              title="Toggle minimap"
              className={`zoom-btn ${showMinimap ? 'active' : ''}`}
            >
              <Layers size={14} />
            </button>
          </div>

          <div style={{ width: 1, height: 24, background: "#e5e7eb" }} />

          <button
            onClick={handleSave}
            disabled={saving}
            className="save-btn"
          >
            {saving ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            Save
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="deploy-btn"
          >
            {deploying ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
            Deploy
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Left Sidebar ── */}
        <aside
          style={{
            width: 280,
            background: "#fff",
            borderRight: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", padding: "12px 12px 0", gap: 4 }}>
            {(["triggers", "actions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 8,
                  border: "none",
                  background: selectedTab === tab ? "#eef2ff" : "transparent",
                  color: selectedTab === tab ? "#6366f1" : "#6b7280",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                  letterSpacing: "0.02em",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: "10px 12px 8px" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedTab}…`}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 28px",
                  borderRadius: 8,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 12,
                  color: "#374151",
                  background: "#f9fafb",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {/* Groups */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
            {Object.entries(currentGroups).map(([group, items]) => (
              <div key={group} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => toggleGroup(group)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 4px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#6b7280",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {collapsedGroups.has(group) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  {group}
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "#f3f4f6",
                      borderRadius: 5,
                      padding: "1px 6px",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#9ca3af",
                    }}
                  >
                    {items.length}
                  </span>
                </button>
                {!collapsedGroups.has(group) &&
                  items.map((item: any) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      isSelected={
                        selectedTab === "triggers"
                          ? triggerNode?.data.itemId === item.id
                          : actionNodes.some((n) => n.data.itemId === item.id)
                      }
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/reactflow",
                          JSON.stringify({
                            type: selectedTab === "triggers" ? "trigger" : "action",
                            itemId: item.id,
                          }),
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() =>
                        handleSidebarClick(
                          item as any,
                          selectedTab === "triggers" ? "trigger" : "action",
                        )
                      }
                    />
                  ))}
              </div>
            ))}
            {Object.keys(currentGroups).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af", fontSize: 13 }}>
                <Search size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <div>No {selectedTab} found</div>
              </div>
            )}
          </div>

          {/* Drop hint */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #f3f4f6",
              fontSize: 11,
              color: "#9ca3af",
              textAlign: "center",
              background: "#fafafa",
            }}
          >
            💡 Drag to canvas or click to add
          </div>
        </aside>

        {/* ── Canvas ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onEdgesDelete={onEdgesDelete}
            nodeTypes={nodeTypes}
            snapToGrid={snapToGrid}
            snapGrid={[16, 16]}
            deleteKeyCode={["Backspace", "Delete"]}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
              style: { stroke: "#6366f1", strokeWidth: 2 },
            }}
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            style={{ background: "#f8fafc" }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
            {showMinimap && (
              <MiniMap
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}
                nodeColor={(node) => {
                  const color = node.data?.color as ColorKey;
                  return color ? COLORS[color]?.bg : "#6366f1";
                }}
                maskColor="rgba(248,250,252,0.7)"
              />
            )}
            <Controls
              style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              showInteractive={false}
            />

            {/* Edge delete hint tooltip */}
            {/* <Panel position="bottom-center">
              <div
                style={{
                  background: "rgba(17,24,39,0.75)",
                  backdropFilter: "blur(6px)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "6px 14px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <span style={{ opacity: 0.7 }}>Click a connection line to select it, then press</span>
                <kbd
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                >
                  Delete
                </kbd>
                <span style={{ opacity: 0.7 }}>or</span>
                <kbd
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    fontSize: 10,
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                >
                  Backspace
                </kbd>
                <span style={{ opacity: 0.7 }}>to remove it</span>
              </div>
            </Panel> */}

            {nodes.length === 0 && (
              <Panel position="top-center">
                <div
                  style={{
                    background: "#fff",
                    border: "2px dashed #e5e7eb",
                    borderRadius: 16,
                    padding: "32px 48px",
                    textAlign: "center",
                    marginTop: 80,
                  }}
                >
                  <Layers size={32} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                    Start Building
                  </div>
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    Drag a trigger from the sidebar to get started
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* ── Right Panel (Config only) ── */}
        <aside
          style={{
            width: 300,
            background: "#fff",
            borderLeft: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px 13px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={12} color="#fff" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
              Configuration
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
            {/* Workflow name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Status */}
            <div
              style={{
                padding: "12px",
                background: "#f9fafb",
                borderRadius: 10,
                marginBottom: 14,
                border: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                }}
              >
                Workflow Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: selectedTrigger ? "#10b981" : "#d1d5db",
                  }}
                />
                <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                  Trigger: <strong>{selectedTrigger?.label || "None"}</strong>
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {selectedActions.length === 0
                  ? "No actions added"
                  : `${selectedActions.length} action${selectedActions.length > 1 ? "s" : ""}: ${selectedActions.map((a) => a.label).join(", ")}`}
              </div>
            </div>

            {/* SMS/WhatsApp */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>WhatsApp / SMS Number</label>
              <input
                type="text"
                placeholder="+919876543210"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Message Template */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Message Template</label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={4}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "monospace",
                  fontSize: 11,
                  lineHeight: 1.5,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                Variables: {"{name}"} {"{amount}"} {"{payment_id}"} {"{phone}"}
              </div>
            </div>

            {/* Google Forms Trigger Config */}
            {selectedTrigger?.trigger_key === "googleforms.submission" && (
              <ConfigSection title="Google Forms Trigger" color="#16a34a" bg="#f0fdf4" border="#86efac">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                    OAuth: {googleOauthConnected ? "Connected" : "Not connected"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={startGoogleOauth}
                      disabled={googleOauthLoading}
                      style={{
                        border: "1px solid #86efac",
                        background: "#ffffff",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#166534",
                        cursor: googleOauthLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      Connect
                    </button>
                    <button
                      onClick={loadGoogleOauthStatus}
                      disabled={googleOauthLoading}
                      style={{
                        border: "1px solid #86efac",
                        background: "#ffffff",
                        borderRadius: 8,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#166534",
                        cursor: googleOauthLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <ConfigField
                  label="Google Form ID *"
                  value={googleTriggerConfig.form_id}
                  onChange={(value) =>
                    setGoogleTriggerConfig((prev) => ({ ...prev, form_id: value }))
                  }
                  placeholder="1abcDEFghIJkLmnOPqR..."
                />

                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Trigger Mode</label>
                  <select
                    value={googleTriggerConfig.mode}
                    onChange={(event) =>
                      setGoogleTriggerConfig((prev) => ({
                        ...prev,
                        mode: event.target.value as "polling" | "webhook",
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="polling">Polling</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>

                {googleTriggerConfig.mode === "polling" && (
                  <ConfigField
                    label="Polling Interval (seconds)"
                    value={String(googleTriggerConfig.poll_interval_sec)}
                    onChange={(value) =>
                      setGoogleTriggerConfig((prev) => ({
                        ...prev,
                        poll_interval_sec: parseInt(value, 10) || 60,
                      }))
                    }
                    type="number"
                  />
                )}

                <div style={{ marginBottom: 8 }}>
                  <label style={labelStyle}>Field Mapping (variable=question title)</label>
                  <textarea
                    value={googleTriggerConfig.field_mapping_text}
                    onChange={(event) =>
                      setGoogleTriggerConfig((prev) => ({
                        ...prev,
                        field_mapping_text: event.target.value,
                      }))
                    }
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                  />
                </div>

                <ActionButton
                  loading={googleTriggerTesting}
                  onClick={testGoogleTrigger}
                  icon={<PlayCircle size={13} />}
                  label="Test Trigger"
                  color="#16a34a"
                />

                {googleTriggerTestResult && (
                  <ResultDisplay
                    results={googleTriggerTestResult}
                    successColor="#dcfce7"
                    successText="#15803d"
                  />
                )}
              </ConfigSection>
            )}

            {/* Zoho Config */}
            {hasZohoAction && (
              <ConfigSection title="Zoho CRM Config" color="#16a34a" bg="#f0fdf4" border="#86efac">
                <ConfigField label="Last Name *" value={zohoConfig.lead_last_name} onChange={(v) => setZohoConfig((p) => ({ ...p, lead_last_name: v }))} />
                <ConfigField label="Email *" value={zohoConfig.lead_email} onChange={(v) => setZohoConfig((p) => ({ ...p, lead_email: v }))} type="email" />
                <ConfigField label="Phone" value={zohoConfig.lead_phone} onChange={(v) => setZohoConfig((p) => ({ ...p, lead_phone: v }))} />
                <ConfigField label="Company" value={zohoConfig.lead_company} onChange={(v) => setZohoConfig((p) => ({ ...p, lead_company: v }))} />
                <ActionButton loading={zohoLoading} onClick={runZohoActions} icon={<Users size={13} />} label="Test Zoho Actions" color="#16a34a" />
                {zohoResult && <ResultDisplay results={zohoResult} successColor="#dcfce7" successText="#15803d" />}
              </ConfigSection>
            )}

            {/* Telegram Config */}
            {hasTgAction && (
              <ConfigSection title="Telegram Config" color="#0088cc" bg="#e7f5ff" border="#90cdf4">
                <ConfigField label="Chat ID *" placeholder="-1001234567890" value={tgConfig.chat_id} onChange={(v) => setTgConfig((p) => ({ ...p, chat_id: v }))} />
                <ConfigField label="Message *" value={tgConfig.message} onChange={(v) => setTgConfig((p) => ({ ...p, message: v }))} multiline />
                <ActionButton loading={tgLoading} onClick={runTelegramActions} icon={<Bot size={13} />} label="Test Telegram Actions" color="#0088cc" />
                {tgResult && <ResultDisplay results={tgResult} successColor="#dbeafe" successText="#1e40af" />}
              </ConfigSection>
            )}

            {/* Instamojo Config */}
            {hasInstaAction && (
              <ConfigSection title="Instamojo Config" color="#4f46e5" bg="#eef2ff" border="#c7d2fe">
                <ConfigField label="Payment ID" value={instaConfig.payment_id} onChange={(v) => setInstaConfig((p) => ({ ...p, payment_id: v }))} />
                <ConfigField label="WhatsApp Phone" value={instaConfig.whatsapp_phone} onChange={(v) => setInstaConfig((p) => ({ ...p, whatsapp_phone: v }))} />
                <ConfigField label="Link Purpose" value={instaConfig.link_purpose} onChange={(v) => setInstaConfig((p) => ({ ...p, link_purpose: v }))} />
                <ConfigField label="Amount (₹)" value={instaConfig.link_amount} onChange={(v) => setInstaConfig((p) => ({ ...p, link_amount: v }))} type="number" />
                <ActionButton loading={instaLoading} onClick={runInstamojoActions} icon={<CreditCard size={13} />} label="Test Instamojo Actions" color="#4f46e5" />
                {instaResult && <ResultDisplay results={instaResult} successColor="#dcfce7" successText="#16a34a" />}
              </ConfigSection>
            )}

            {/* Invoice Config */}
            {hasInvoiceAction && (
              <ConfigSection title="Invoice Config" color="#ea580c" bg="#fff7ed" border="#fed7aa">
                <ConfigField label="Payment ID *" value={invoiceConfig.payment_id} onChange={(v) => setInvoiceConfig((p) => ({ ...p, payment_id: v }))} />
                <ConfigField label="Amount ₹ *" value={invoiceConfig.amount} onChange={(v) => setInvoiceConfig((p) => ({ ...p, amount: v }))} type="number" />
                <ConfigField label="Customer Name *" value={invoiceConfig.customer_name} onChange={(v) => setInvoiceConfig((p) => ({ ...p, customer_name: v }))} />
                <ConfigField label="Customer Email *" value={invoiceConfig.customer_email} onChange={(v) => setInvoiceConfig((p) => ({ ...p, customer_email: v }))} type="email" />
                <ConfigField label="Customer Phone *" value={invoiceConfig.customer_phone} onChange={(v) => setInvoiceConfig((p) => ({ ...p, customer_phone: v }))} />
                <ActionButton loading={invoiceLoading} onClick={runInvoiceActions} icon={<FileText size={13} />} label="Test Invoice Actions" color="#ea580c" />
                {invoiceResult && <ResultDisplay results={invoiceResult} successColor="#dcfce7" successText="#15803d" />}
              </ConfigSection>
            )}

            {/* Razorpay Config */}
            {hasRzpAction && (
              <ConfigSection title="Razorpay Config" color="#2B6CB0" bg="#eff6ff" border="#bfdbfe">
                <ConfigField label="Payment ID" value={rzpConfig.payment_id} onChange={(v) => setRzpConfig((p) => ({ ...p, payment_id: v }))} />
                <ConfigField label="From Date" value={rzpConfig.from_date} onChange={(v) => setRzpConfig((p) => ({ ...p, from_date: v }))} type="date" />
                <ConfigField label="To Date" value={rzpConfig.to_date} onChange={(v) => setRzpConfig((p) => ({ ...p, to_date: v }))} type="date" />
                <ConfigField label="Last N Days" value={String(rzpConfig.days)} onChange={(v) => setRzpConfig((p) => ({ ...p, days: parseInt(v) || 7 }))} type="number" />
                <ActionButton loading={rzpLoading} onClick={runRazorpayActions} icon={<IndianRupee size={13} />} label="Test Razorpay Actions" color="#2B6CB0" />
                {rzpResult && <ResultDisplay results={rzpResult} successColor="#dbeafe" successText="#1e40af" />}
              </ConfigSection>
            )}

            {/* Subscription Config */}
            {hasSubAction && (
              <ConfigSection title="Subscription Config" color="#0e7490" bg="#ecfeff" border="#a5f3fc">
                <ConfigField label="Subscription ID" value={subConfig.subscription_id} onChange={(v) => setSubConfig((p) => ({ ...p, subscription_id: v }))} />
                <ConfigField label="Plan ID" value={subConfig.plan_id} onChange={(v) => setSubConfig((p) => ({ ...p, plan_id: v }))} />
                <ConfigField label="Count" value={String(subConfig.list_count)} onChange={(v) => setSubConfig((p) => ({ ...p, list_count: parseInt(v) || 10 }))} type="number" />
                <ActionButton loading={subLoading} onClick={runSubscriptionActions} icon={<Repeat size={13} />} label="Test Subscription Actions" color="#0e7490" />
                {subResult && <ResultDisplay results={subResult} successColor="#cffafe" successText="#0e7490" />}
              </ConfigSection>
            )}

            {/* Deploy button */}
            <button
              onClick={handleDeploy}
              disabled={deploying}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: deploying ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                cursor: deploying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 3px 12px rgba(99,102,241,0.35)",
                transition: "all 0.15s",
              }}
            >
              {deploying ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={15} />}
              Save & Deploy Workflow
            </button>
          </div>
        </aside>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .react-flow__node { filter: drop-shadow(0 2px 8px rgba(0,0,0,0.08)); }
        .react-flow__node.selected { filter: drop-shadow(0 4px 16px rgba(99,102,241,0.2)); }
        .react-flow__edge-path { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1)); transition: stroke 0.15s, stroke-width 0.15s; }
        .react-flow__edge:hover .react-flow__edge-path { stroke: #f87171 !important; stroke-width: 3px !important; cursor: pointer; }
        .react-flow__edge.selected .react-flow__edge-path { stroke: #ef4444 !important; stroke-width: 3px !important; }
        .react-flow__edge.selected .react-flow__arrowhead { fill: #ef4444 !important; }
        .react-flow__controls button { background: #fff !important; border: 1px solid #e5e7eb !important; color: #374151 !important; }
        .react-flow__controls button:hover { background: #f9fafb !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}

// ── Helper sub-components ─────────────────────────────────────────────────────
function ConfigSection({
  title,
  color,
  bg,
  border,
  children,
}: {
  title: string;
  color: string;
  bg: string;
  border: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: 12,
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          textTransform: "uppercase" as const,
          letterSpacing: "0.07em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ConfigField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 9px",
    borderRadius: 7,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#374151",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    marginBottom: 8,
    transition: "border-color 0.15s",
  };
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 3, display: "block" }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          style={{ ...baseStyle, resize: "vertical" as const, fontFamily: "monospace" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={baseStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        />
      )}
    </div>
  );
}

function ActionButton({
  loading,
  onClick,
  icon,
  label,
  color,
}: {
  loading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "8px",
        borderRadius: 8,
        border: `1.5px solid ${color}30`,
        background: `${color}10`,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color,
        transition: "all 0.15s",
        marginTop: 4,
      }}
    >
      {loading ? <Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> : icon}
      {label}
    </button>
  );
}

function ResultDisplay({
  results,
  successColor,
  successText,
}: {
  results: Record<string, any>;
  successColor: string;
  successText: string;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      {Object.entries(results).map(([label, result]: any) => (
        <div
          key={label}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            fontSize: 11,
            background: result?.error ? "#fee2e2" : successColor,
            color: result?.error ? "#dc2626" : successText,
            marginBottom: 6,
          }}
        >
          <strong>{label}:</strong>{" "}
          {result?.error ? `❌ ${result.error}` : "✅ Done"}
        </div>
      ))}
    </div>
  );
}

// ── Exported Component ────────────────────────────────────────────────────────
export default function BuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}
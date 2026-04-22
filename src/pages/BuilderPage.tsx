import { useState, useEffect } from "react";
import "../styles/BuilderPage.css";
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiCall, getToken } from "../api/client";
import { addPayment } from "../api/airtable";
import { sendNotification, sendPaymentAlert } from "../api/discord";
import { sendSMS } from "../api/fast2sms";
import {
  getInstamojoDailySummary,
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
  type RazorpayTodaySummary,
  type RazorpayRangeSummary,
  type RazorpayPaymentDetail,
  type RazorpayStats,
} from "../api/razorpay";
import {
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionInvoices,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionSummary,
  getExpiringSubscriptions,
  getFailedSubscriptions,
  createSubscription,
  getAllPlans,
  getSubscriptionRevenue,
  type RzpSubscription,
  type RzpSubscriptionSummary,
  type RzpSubscriptionInvoice,
  type RzpExpiringSubscription,
  type RzpFailedSubscription,
  type RzpPlan,
  type RzpRevenue,
  type RzpCreatedSubscription,
} from "../api/razorpay-subscriptions";
import {
  getBotInfo,
  getUpdates,
  sendTelegramMessage,
  sendTelegramPaymentAlert,
} from "../api/telegram";

// ── Zoho CRM Bridge helper ─────────────────────────────────────────────────────
const ZOHO_BRIDGE =
  import.meta.env.VITE_ZOHO_BRIDGE_URL || "http://localhost:3001";

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

// ── Triggers ──────────────────────────────────────────────────────────────────
const triggers = [
  {
    id: "t1",
    label: "Payment Alert",
    desc: "Razorpay trigger",
    icon: Zap,
    color: "violet",
    trigger_key: "razorpay.payment.captured",
  },
  {
    id: "t2",
    label: "Schedule",
    desc: "Run periodically",
    icon: Clock,
    color: "cyan",
    trigger_key: "schedule",
  },
  {
    id: "t3",
    label: "Form Submit",
    desc: "Typeform / Google Forms",
    icon: TrendingUp,
    color: "emerald",
    trigger_key: "form.submit",
  },
  {
    id: "t4",
    label: "CRM Event",
    desc: "Zoho / Freshworks",
    icon: DollarSign,
    color: "rose",
    trigger_key: "crm.event",
  },
  {
    id: "t5",
    label: "Webhook",
    desc: "Custom API endpoint",
    icon: Layout,
    color: "amber",
    trigger_key: "webhook",
  },
  {
    id: "t6",
    label: "Instamojo Payment",
    desc: "Payment received on Instamojo",
    icon: CreditCard,
    color: "indigo",
    trigger_key: "instamojo.payment.captured",
  },
  {
    id: "t7",
    label: "Instamojo Daily",
    desc: "Daily Instamojo report",
    icon: TrendingUp,
    color: "teal",
    trigger_key: "instamojo.daily.summary",
  },
  {
    id: "t8",
    label: "Invoice Generated",
    desc: "After PDF invoice is created",
    icon: FileText,
    color: "orange",
    trigger_key: "invoice.generated",
  },
  {
    id: "t9",
    label: "Invoice Sent",
    desc: "After invoice email/WA sent",
    icon: Send,
    color: "pink",
    trigger_key: "invoice.sent",
  },
  {
    id: "t10",
    label: "Razorpay Captured",
    desc: "Payment captured on Razorpay",
    icon: IndianRupee,
    color: "blue",
    trigger_key: "razorpay.payment.captured.mcp",
  },
  {
    id: "t11",
    label: "Razorpay Daily",
    desc: "Daily Razorpay analytics",
    icon: BarChart2,
    color: "sky",
    trigger_key: "razorpay.daily.summary",
  },
  {
    id: "t12",
    label: "Subscription Created",
    desc: "New subscription started",
    icon: Repeat,
    color: "teal",
    trigger_key: "subscription.created",
  },
  {
    id: "t13",
    label: "Subscription Halted",
    desc: "Subscription payment failed/halted",
    icon: XCircle,
    color: "rose",
    trigger_key: "subscription.halted",
  },
  {
    id: "t14",
    label: "Subscription Expiring",
    desc: "Subscription expiring soon",
    icon: Clock,
    color: "amber",
    trigger_key: "subscription.expiring",
  },
  {
    id: "t15",
    label: "Subscription Cancelled",
    desc: "Subscription was cancelled",
    icon: XCircle,
    color: "red",
    trigger_key: "subscription.cancelled",
  },
  {
    id: "t20",
    label: "Tally Form Submit",
    desc: "Tally MCP form submission",
    icon: TrendingUp,
    color: "yellow",
    trigger_key: "tally.form.submit",
  },
  {
    id: "t16",
    label: "Telegram Message",
    desc: "New message received by bot",
    icon: Bot,
    color: "sky",
    trigger_key: "telegram.message",
  },
  {
    id: "t17",
    label: "Telegram Command",
    desc: "/command sent to bot",
    icon: Bot,
    color: "blue",
    trigger_key: "telegram.command",
  },
  // ── Zoho CRM triggers ──
  {
    id: "t18",
    label: "Zoho: Lead Created",
    desc: "New lead created in Zoho CRM",
    icon: UserPlus,
    color: "green",
    trigger_key: "zoho.lead.created",
  },
  {
    id: "t19",
    label: "Zoho: Deal Updated",
    desc: "Deal stage changed in Zoho CRM",
    icon: Briefcase,
    color: "lime",
    trigger_key: "zoho.deal.updated",
  },
];

// ── Actions ───────────────────────────────────────────────────────────────────
const actions = [
  {
    id: "a1",
    label: "WhatsApp",
    desc: "Send WhatsApp message",
    icon: MessageSquare,
    color: "blue",
    action_key: "send_whatsapp",
  },
  {
    id: "a2",
    label: "Sheets Row",
    desc: "Add to Google Sheets",
    icon: Repeat,
    color: "violet",
    action_key: "update_sheet",
  },
  {
    id: "a3",
    label: "Zoho Lead",
    desc: "Create CRM lead",
    icon: DollarSign,
    color: "rose",
    action_key: "add_zoho_lead",
  },
  {
    id: "a4",
    label: "Send Email",
    desc: "Gmail / Outlook",
    icon: Mail,
    color: "emerald",
    action_key: "send_email",
  },
  {
    id: "a5",
    label: "SMS Alert",
    desc: "Fast2SMS / Twilio",
    icon: Image,
    color: "pink",
    action_key: "send_sms",
  },
  {
    id: "a6",
    label: "API Call",
    desc: "Custom HTTP Request",
    icon: Blocks,
    color: "orange",
    action_key: "api_call",
  },
  {
    id: "a7",
    label: "Send Email",
    desc: "Gmail confirmation",
    icon: Mail,
    color: "teal",
    action_key: "send_gmail",
  },
  {
    id: "a8",
    label: "Schedule Call",
    desc: "Google Calendar",
    icon: Clock,
    color: "blue",
    action_key: "schedule_meeting",
  },
  // Instamojo actions
  {
    id: "a9",
    label: "Instamojo: Notify",
    desc: "WhatsApp + Email after payment",
    icon: CreditCard,
    color: "indigo",
    action_key: "instamojo_notify_complete",
  },
  {
    id: "a10",
    label: "Instamojo: WA Report",
    desc: "Send daily summary on WhatsApp",
    icon: MessageSquare,
    color: "teal",
    action_key: "instamojo_summary_whatsapp",
  },
  {
    id: "a11",
    label: "Instamojo: Create Link",
    desc: "Generate payment link",
    icon: LinkIcon,
    color: "amber",
    action_key: "instamojo_create_link",
  },
  // Invoice actions
  {
    id: "a12",
    label: "Invoice: Full Flow",
    desc: "PDF + WhatsApp + Email",
    icon: FileText,
    color: "orange",
    action_key: "invoice_full_flow",
  },
  {
    id: "a13",
    label: "Invoice: WhatsApp",
    desc: "Send invoice via WhatsApp",
    icon: MessageSquare,
    color: "green",
    action_key: "invoice_whatsapp",
  },
  {
    id: "a14",
    label: "Invoice: Email",
    desc: "Email PDF invoice to customer",
    icon: Mail,
    color: "sky",
    action_key: "invoice_email",
  },
  {
    id: "a15",
    label: "Invoice: WA Direct",
    desc: "Send custom WhatsApp message",
    icon: Send,
    color: "lime",
    action_key: "invoice_wa_direct",
  },
  // Razorpay MCP actions
  {
    id: "a16",
    label: "Razorpay: Today",
    desc: "Fetch today's payments",
    icon: IndianRupee,
    color: "blue",
    action_key: "razorpay_todays_payments",
  },
  {
    id: "a17",
    label: "Razorpay: Date Range",
    desc: "Fetch payments by date range",
    icon: Search,
    color: "sky",
    action_key: "razorpay_payments_range",
  },
  {
    id: "a18",
    label: "Razorpay: Lookup",
    desc: "Fetch single payment details",
    icon: Search,
    color: "violet",
    action_key: "razorpay_payment_detail",
  },
  {
    id: "a19",
    label: "Razorpay: Analytics",
    desc: "Revenue stats & method breakdown",
    icon: BarChart2,
    color: "indigo",
    action_key: "razorpay_payment_summary",
  },
  // Subscription MCP actions
  {
    id: "a20",
    label: "Sub: List All",
    desc: "Fetch all subscriptions",
    icon: Repeat,
    color: "teal",
    action_key: "sub_list_all",
  },
  {
    id: "a21",
    label: "Sub: Lookup",
    desc: "Fetch subscription by ID",
    icon: Search,
    color: "cyan",
    action_key: "sub_lookup",
  },
  {
    id: "a22",
    label: "Sub: Cancel",
    desc: "Cancel a subscription",
    icon: XCircle,
    color: "rose",
    action_key: "sub_cancel",
  },
  {
    id: "a23",
    label: "Sub: Pause",
    desc: "Pause an active subscription",
    icon: PauseCircle,
    color: "amber",
    action_key: "sub_pause",
  },
  {
    id: "a24",
    label: "Sub: Resume",
    desc: "Resume a paused subscription",
    icon: PlayCircle,
    color: "emerald",
    action_key: "sub_resume",
  },
  {
    id: "a25",
    label: "Sub: Summary",
    desc: "Health & churn summary",
    icon: BarChart2,
    color: "sky",
    action_key: "sub_summary",
  },
  {
    id: "a26",
    label: "Sub: Expiring Soon",
    desc: "Subscriptions expiring in N days",
    icon: Clock,
    color: "orange",
    action_key: "sub_expiring",
  },
  {
    id: "a27",
    label: "Sub: Failed/Halted",
    desc: "Fetch failed subscriptions",
    icon: AlertCircle,
    color: "red",
    action_key: "sub_failed",
  },
  {
    id: "a28",
    label: "Sub: Create",
    desc: "Create a new subscription",
    icon: Plus,
    color: "green",
    action_key: "sub_create",
  },
  {
    id: "a29",
    label: "Sub: Plans",
    desc: "List all subscription plans",
    icon: FileText,
    color: "violet",
    action_key: "sub_plans",
  },
  {
    id: "a30",
    label: "Sub: Revenue (MRR/ARR)",
    desc: "Calculate recurring revenue",
    icon: TrendingUp,
    color: "indigo",
    action_key: "sub_revenue",
  },
  // Telegram MCP actions
  {
    id: "a31",
    label: "Telegram: Send Message",
    desc: "Send text to a chat/group/channel",
    icon: Bot,
    color: "sky",
    action_key: "telegram_send_message",
  },
  {
    id: "a32",
    label: "Telegram: Payment Alert",
    desc: "Send formatted payment alert",
    icon: Bot,
    color: "blue",
    action_key: "telegram_payment_alert",
  },
  {
    id: "a33",
    label: "Telegram: Bot Info",
    desc: "Get bot name, username, ID",
    icon: Bot,
    color: "cyan",
    action_key: "telegram_bot_info",
  },
  {
    id: "a34",
    label: "Telegram: Get Updates",
    desc: "Fetch recent messages / chat IDs",
    icon: Bot,
    color: "indigo",
    action_key: "telegram_get_updates",
  },
  // ── Zoho CRM MCP actions ──
  {
    id: "a35",
    label: "Zoho: Create Lead",
    desc: "Add new lead to Zoho CRM",
    icon: UserPlus,
    color: "green",
    action_key: "zoho_create_lead",
  },
  {
    id: "a36",
    label: "Zoho: Create Contact",
    desc: "Add paying customer as contact",
    icon: Users,
    color: "emerald",
    action_key: "zoho_create_contact",
  },
  {
    id: "a37",
    label: "Zoho: Create Deal",
    desc: "Create opportunity/deal",
    icon: Briefcase,
    color: "lime",
    action_key: "zoho_create_deal",
  },
  {
    id: "a38",
    label: "Zoho: Create Task",
    desc: "Create follow-up task",
    icon: ListChecks,
    color: "yellow",
    action_key: "zoho_create_task",
  },
  {
    id: "a39",
    label: "Zoho: Search Leads",
    desc: "Search CRM leads by email/name",
    icon: Search,
    color: "teal",
    action_key: "zoho_search_leads",
  },
  {
    id: "a40",
    label: "Zoho: Update Lead",
    desc: "Update an existing lead",
    icon: UserPlus,
    color: "cyan",
    action_key: "zoho_update_lead",
  },
  {
    id: "a41",
    label: "Zoho: Get Leads",
    desc: "Fetch recent leads list",
    icon: Users,
    color: "sky",
    action_key: "zoho_get_leads",
  },
];

// ── Config interfaces ─────────────────────────────────────────────────────────
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

// ── NEW: Zoho CRM config interface ────────────────────────────────────────────
interface ZohoConfig {
  // Lead fields
  lead_first_name: string;
  lead_last_name: string;
  lead_email: string;
  lead_phone: string;
  lead_company: string;
  lead_source: string;
  lead_amount: string;
  lead_description: string;
  // Contact fields
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string;
  contact_account_name: string;
  contact_description: string;
  // Deal fields
  deal_name: string;
  deal_amount: string;
  deal_stage: string;
  deal_contact_name: string;
  deal_account_name: string;
  deal_closing_date: string;
  deal_description: string;
  // Task fields
  task_subject: string;
  task_due_date: string;
  task_status: string;
  task_priority: string;
  task_description: string;
  // Search / Update fields
  search_email: string;
  search_name: string;
  update_lead_id: string;
  update_fields: string; // JSON string
  // Get Leads
  get_leads_count: number;
}

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

// ── Component ─────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"triggers" | "actions">(
    "triggers",
  );
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [selectedTrigger, setSelectedTrigger] = useState(triggers[0]);
  const [selectedActions, setSelectedActions] = useState([actions[0]]);
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {name}, your payment of ₹{amount} has been received! 🎉\nPayment ID: {payment_id}\nThank you 🙏",
  );
  const [toNumber, setToNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isAuthed, setIsAuthed] = useState(!!getToken());

  // Instamojo state
  const [instaConfig, setInstaConfig] = useState<InstamojoConfig>({
    payment_id: "",
    whatsapp_phone: "",
    link_purpose: "",
    link_amount: "",
    link_name: "",
  });
  const [instaResult, setInstaResult] = useState<any>(null);
  const [instaLoading, setInstaLoading] = useState(false);

  // Invoice state
  const [invoiceConfig, setInvoiceConfig] =
    useState<InvoiceConfig>(defaultInvoiceConfig);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Razorpay state
  const [rzpConfig, setRzpConfig] = useState<RazorpayConfig>(
    defaultRazorpayConfig,
  );
  const [rzpResult, setRzpResult] = useState<any>(null);
  const [rzpLoading, setRzpLoading] = useState(false);

  // Subscription state
  const [subConfig, setSubConfig] = useState<SubscriptionConfig>(
    defaultSubscriptionConfig,
  );
  const [subResult, setSubResult] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);

  // Telegram state
  const [tgConfig, setTgConfig] = useState<TelegramConfig>(
    defaultTelegramConfig,
  );
  const [tgResult, setTgResult] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(false);

  // ── NEW: Zoho CRM state ───────────────────────────────────────────────────
  const [zohoConfig, setZohoConfig] = useState<ZohoConfig>(defaultZohoConfig);
  const [zohoResult, setZohoResult] = useState<any>(null);
  const [zohoLoading, setZohoLoading] = useState(false);

  // ── Drag and Drop state ────────────────────────────────────────────────────
  const [nodePositions, setNodePositions] = useState<
    Record<string, { left: number; top: number }>
  >({});
  const [draggedItem, setDraggedItem] = useState<{
    type: "trigger" | "action";
    item: any;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Derived flags
  const hasInstaAction = selectedActions.some((a) =>
    a.action_key.startsWith("instamojo_"),
  );
  const hasInstaTrigger = selectedTrigger.trigger_key.startsWith("instamojo.");
  const hasInvoiceAction = selectedActions.some((a) =>
    a.action_key.startsWith("invoice_"),
  );
  const hasRzpAction = selectedActions.some((a) =>
    a.action_key.startsWith("razorpay_"),
  );
  const hasRzpTrigger = selectedTrigger.trigger_key.startsWith("razorpay.");
  const hasSubAction = selectedActions.some((a) =>
    a.action_key.startsWith("sub_"),
  );
  const hasSubTrigger = selectedTrigger.trigger_key.startsWith("subscription.");
  const hasTgAction = selectedActions.some((a) =>
    a.action_key.startsWith("telegram_"),
  );
  const hasTgTrigger = selectedTrigger.trigger_key.startsWith("telegram.");
  // ── NEW ──
  const hasZohoAction = selectedActions.some((a) =>
    a.action_key.startsWith("zoho_"),
  );
  const hasZohoTrigger = selectedTrigger.trigger_key.startsWith("zoho.");

  useEffect(() => {
    const token = getToken();
    setIsAuthed(!!token);
    if (!token) return;
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      const data = await apiCall("/workflows/");
      setWorkflows(data);
    } catch {}
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function addAction(action: (typeof actions)[0]) {
    if (!selectedActions.find((a) => a.id === action.id)) {
      setSelectedActions((prev) => [...prev, action]);
    }
  }

  function removeAction(id: string) {
    setSelectedActions((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Drag and Drop Handlers ────────────────────────────────────────────────
  function handleSidebarDragStart(
    e: React.DragEvent,
    type: "trigger" | "action",
    item: any,
  ) {
    setDraggedItem({ type, item });
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", JSON.stringify({ type, item }));
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();

    try {
      const data = e.dataTransfer.getData("text/plain");
      const { type, item } = JSON.parse(data);

      // Get canvas position
      const canvas = e.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (type === "trigger") {
        setSelectedTrigger(item);
      } else if (type === "action") {
        addAction(item);
        // Store position for this action
        setNodePositions((prev) => ({
          ...prev,
          [item.id]: { left: Math.max(50, x - 110), top: Math.max(50, y - 40) },
        }));
      }
    } catch {}

    setDraggedItem(null);
  }

  function handleNodeDragStart(
    e: React.DragEvent,
    nodeId: string,
    type: "trigger" | "action",
  ) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCanvasNodeDrop(e: React.DragEvent, nodeId: string) {
    e.preventDefault();
    e.stopPropagation();

    const canvas = document.querySelector(".builder-canvas") as HTMLElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setNodePositions((prev) => ({
      ...prev,
      [nodeId]: {
        left: Math.max(0, x),
        top: Math.max(0, y),
      },
    }));
  }

  function getNodePosition(nodeId: string): { left: number; top: number } {
    return nodePositions[nodeId] || { left: 0, top: 0 };
  }

  function buildPayload() {
    return {
      name: workflowName,
      trigger: selectedTrigger.trigger_key,
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

  // ── Run Zoho CRM MCP actions ──────────────────────────────────────────────
  async function runZohoActions() {
    setZohoLoading(true);
    setZohoResult(null);
    const results: Record<string, any> = {};
    const cfg = zohoConfig;

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("zoho_")) continue;
      try {
        switch (action.action_key) {
          case "zoho_create_lead":
            if (!cfg.lead_last_name || !cfg.lead_email)
              throw new Error("Last name and email are required");
            results[action.label] = await callZohoBridge("create_lead", {
              first_name: cfg.lead_first_name || undefined,
              last_name: cfg.lead_last_name,
              email: cfg.lead_email,
              phone: cfg.lead_phone || undefined,
              company: cfg.lead_company || undefined,
              lead_source: cfg.lead_source || "Web",
              amount: cfg.lead_amount ? Number(cfg.lead_amount) : undefined,
              description: cfg.lead_description || undefined,
            });
            break;

          case "zoho_create_contact":
            if (!cfg.contact_last_name || !cfg.contact_email)
              throw new Error("Last name and email are required");
            results[action.label] = await callZohoBridge("create_contact", {
              first_name: cfg.contact_first_name || undefined,
              last_name: cfg.contact_last_name,
              email: cfg.contact_email,
              phone: cfg.contact_phone || undefined,
              account_name: cfg.contact_account_name || undefined,
              description: cfg.contact_description || undefined,
            });
            break;

          case "zoho_create_deal":
            if (!cfg.deal_name) throw new Error("Deal name is required");
            results[action.label] = await callZohoBridge("create_deal", {
              deal_name: cfg.deal_name,
              amount: cfg.deal_amount ? Number(cfg.deal_amount) : undefined,
              stage: cfg.deal_stage || "Qualification",
              contact_name: cfg.deal_contact_name || undefined,
              account_name: cfg.deal_account_name || undefined,
              closing_date: cfg.deal_closing_date || undefined,
              description: cfg.deal_description || undefined,
            });
            break;

          case "zoho_create_task":
            if (!cfg.task_subject) throw new Error("Task subject is required");
            results[action.label] = await callZohoBridge("create_task", {
              subject: cfg.task_subject,
              due_date: cfg.task_due_date || undefined,
              status: cfg.task_status || "Not Started",
              priority: cfg.task_priority || "Medium",
              description: cfg.task_description || undefined,
            });
            break;

          case "zoho_search_leads":
            if (!cfg.search_email && !cfg.search_name)
              throw new Error("Provide email or name to search");
            results[action.label] = await callZohoBridge("search_leads", {
              email: cfg.search_email || undefined,
              name: cfg.search_name || undefined,
            });
            break;

          case "zoho_update_lead": {
            if (!cfg.update_lead_id) throw new Error("Lead ID is required");
            let fields: Record<string, any> = {};
            try {
              fields = JSON.parse(cfg.update_fields);
            } catch {
              throw new Error("Update fields must be valid JSON");
            }
            results[action.label] = await callZohoBridge("update_lead", {
              lead_id: cfg.update_lead_id,
              fields,
            });
            break;
          }

          case "zoho_get_leads":
            results[action.label] = await callZohoBridge("get_leads", {
              per_page: cfg.get_leads_count || 10,
            });
            break;

          default:
            throw new Error(`Unknown Zoho action: ${action.action_key}`);
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }

    setZohoResult(results);
    setZohoLoading(false);
    return results;
  }

  // ── Run Telegram actions ──────────────────────────────────────────────────
  async function runTelegramActions() {
    setTgLoading(true);
    setTgResult(null);
    const results: Record<string, any> = {};

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("telegram_")) continue;
      try {
        if (action.action_key === "telegram_send_message") {
          if (!tgConfig.chat_id) throw new Error("Chat ID required");
          if (!tgConfig.message) throw new Error("Message required");
          results[action.label] = await sendTelegramMessage(
            tgConfig.chat_id,
            tgConfig.message,
            tgConfig.parse_mode || "Markdown",
          );
        }
        if (action.action_key === "telegram_payment_alert") {
          if (!tgConfig.chat_id) throw new Error("Chat ID required");
          if (!tgConfig.customer_name)
            throw new Error("Customer name required");
          results[action.label] = await sendTelegramPaymentAlert(
            tgConfig.chat_id,
            parseFloat(tgConfig.amount) || 0,
            tgConfig.customer_name,
            tgConfig.plan || undefined,
            tgConfig.payment_id || undefined,
          );
        }
        if (action.action_key === "telegram_bot_info") {
          results[action.label] = await getBotInfo();
        }
        if (action.action_key === "telegram_get_updates") {
          results[action.label] = await getUpdates();
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }

    setTgResult(results);
    setTgLoading(false);
    return results;
  }

  // ── Run Instamojo actions ─────────────────────────────────────────────────
  async function runInstamojoActions() {
    setInstaLoading(true);
    setInstaResult(null);
    const results: Record<string, any> = {};

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("instamojo_")) continue;
      try {
        if (action.action_key === "instamojo_notify_complete") {
          if (!instaConfig.payment_id) throw new Error("Payment ID required");
          results[action.label] = await notifyInstamojoPaymentComplete(
            instaConfig.payment_id,
          );
        }
        if (action.action_key === "instamojo_summary_whatsapp") {
          if (!instaConfig.whatsapp_phone)
            throw new Error("WhatsApp phone required");
          results[action.label] = await sendInstamojoDailySummaryWhatsApp(
            instaConfig.whatsapp_phone,
          );
        }
        if (action.action_key === "instamojo_create_link") {
          if (
            !instaConfig.link_purpose ||
            !instaConfig.link_amount ||
            !instaConfig.link_name
          )
            throw new Error("Purpose, amount and name required");
          results[action.label] = await createInstamojoLink({
            purpose: instaConfig.link_purpose,
            amount: parseFloat(instaConfig.link_amount),
            name: instaConfig.link_name,
          });
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }

    setInstaResult(results);
    setInstaLoading(false);
    return results;
  }

  // ── Run Invoice actions ───────────────────────────────────────────────────
  async function runInvoiceActions() {
    setInvoiceLoading(true);
    setInvoiceResult(null);
    const results: Record<string, any> = {};
    const cfg = invoiceConfig;

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("invoice_")) continue;
      try {
        if (action.action_key === "invoice_full_flow") {
          if (
            !cfg.payment_id ||
            !cfg.amount ||
            !cfg.customer_name ||
            !cfg.customer_email ||
            !cfg.customer_phone
          )
            throw new Error(
              "payment_id, amount, and customer details required",
            );
          results[action.label] = await processPaymentInvoice({
            payment_id: cfg.payment_id,
            amount: parseFloat(cfg.amount),
            customer_name: cfg.customer_name,
            customer_email: cfg.customer_email,
            customer_phone: cfg.customer_phone,
            product_name: cfg.product_name || undefined,
            company_name: cfg.company_name || "Pravah",
            send_email: cfg.send_email,
            send_whatsapp: cfg.send_whatsapp,
          });
        } else if (action.action_key === "invoice_whatsapp") {
          if (
            !cfg.customer_phone ||
            !cfg.invoice_number ||
            !cfg.amount ||
            !cfg.customer_name
          )
            throw new Error(
              "customer_phone, invoice_number, amount, customer_name required",
            );
          results[action.label] = await sendWhatsAppInvoice({
            phone: cfg.customer_phone,
            invoice_number: cfg.invoice_number,
            amount: parseFloat(cfg.amount),
            customer_name: cfg.customer_name,
            company_name: cfg.company_name || "Pravah",
            pdf_path: cfg.pdf_path || undefined,
          });
        } else if (action.action_key === "invoice_email") {
          if (
            !cfg.customer_email ||
            !cfg.customer_name ||
            !cfg.invoice_number ||
            !cfg.amount ||
            !cfg.pdf_path
          )
            throw new Error(
              "customer_email, customer_name, invoice_number, amount, pdf_path required",
            );
          results[action.label] = await sendEmailInvoice({
            customer_email: cfg.customer_email,
            customer_name: cfg.customer_name,
            invoice_number: cfg.invoice_number,
            amount: parseFloat(cfg.amount),
            company_name: cfg.company_name || "Pravah",
            pdf_path: cfg.pdf_path,
          });
        } else if (action.action_key === "invoice_wa_direct") {
          if (!cfg.customer_phone || !cfg.wa_message)
            throw new Error("customer_phone and wa_message required");
          results[action.label] = await sendWhatsAppDirect({
            phone: cfg.customer_phone,
            message: cfg.wa_message,
          });
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }

    setInvoiceResult(results);
    setInvoiceLoading(false);
    return results;
  }

  // ── Run Razorpay actions ──────────────────────────────────────────────────
  async function runRazorpayActions() {
    setRzpLoading(true);
    setRzpResult(null);
    const results: Record<string, any> = {};

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("razorpay_")) continue;
      try {
        if (action.action_key === "razorpay_todays_payments") {
          results[action.label] = await getRazorpayTodaysPayments();
        }
        if (action.action_key === "razorpay_payments_range") {
          if (!rzpConfig.from_date || !rzpConfig.to_date)
            throw new Error("From date and To date are required");
          results[action.label] = await getRazorpayPaymentsByRange(
            rzpConfig.from_date,
            rzpConfig.to_date,
          );
        }
        if (action.action_key === "razorpay_payment_detail") {
          if (!rzpConfig.payment_id.trim())
            throw new Error("Payment ID is required");
          results[action.label] = await getRazorpayPaymentDetails(
            rzpConfig.payment_id.trim(),
          );
        }
        if (action.action_key === "razorpay_payment_summary") {
          if (!rzpConfig.days || rzpConfig.days < 1)
            throw new Error("Days must be at least 1");
          results[action.label] = await getRazorpayPaymentSummary(
            rzpConfig.days,
          );
        }
      } catch (e: any) {
        results[action.label] = { error: e.message };
      }
    }

    setRzpResult(results);
    setRzpLoading(false);
    return results;
  }

  // ── Run Subscription actions ──────────────────────────────────────────────
  async function runSubscriptionActions() {
    setSubLoading(true);
    setSubResult(null);
    const results: Record<string, any> = {};
    const cfg = subConfig;

    for (const action of selectedActions) {
      if (!action.action_key.startsWith("sub_")) continue;
      try {
        switch (action.action_key) {
          case "sub_list_all":
            results[action.label] = await getAllSubscriptions(
              cfg.list_count,
              cfg.list_status || undefined,
            );
            break;
          case "sub_lookup":
            if (!cfg.subscription_id.trim())
              throw new Error("Subscription ID required");
            results[action.label] = await getSubscriptionById(
              cfg.subscription_id.trim(),
            );
            break;
          case "sub_cancel":
            if (!cfg.subscription_id.trim())
              throw new Error("Subscription ID required");
            results[action.label] = await cancelSubscription(
              cfg.subscription_id.trim(),
              cfg.cancel_at_cycle_end,
            );
            break;
          case "sub_pause":
            if (!cfg.subscription_id.trim())
              throw new Error("Subscription ID required");
            results[action.label] = await pauseSubscription(
              cfg.subscription_id.trim(),
              cfg.pause_at,
            );
            break;
          case "sub_resume":
            if (!cfg.subscription_id.trim())
              throw new Error("Subscription ID required");
            results[action.label] = await resumeSubscription(
              cfg.subscription_id.trim(),
            );
            break;
          case "sub_summary":
            results[action.label] = await getSubscriptionSummary(
              cfg.list_count,
            );
            break;
          case "sub_expiring":
            results[action.label] = await getExpiringSubscriptions(
              cfg.expiring_days,
            );
            break;
          case "sub_failed":
            results[action.label] = await getFailedSubscriptions(
              cfg.failed_count,
            );
            break;
          case "sub_create": {
            if (!cfg.plan_id.trim() || !cfg.total_count)
              throw new Error("Plan ID and total count required");
            const notes: Record<string, string> = {};
            if (cfg.note_name) notes.customer_name = cfg.note_name;
            if (cfg.note_email) notes.customer_email = cfg.note_email;
            results[action.label] = await createSubscription({
              plan_id: cfg.plan_id.trim(),
              total_count: cfg.total_count,
              quantity: cfg.quantity,
              customer_notify: cfg.customer_notify,
              notes: Object.keys(notes).length ? notes : undefined,
            });
            break;
          }
          case "sub_plans":
            results[action.label] = await getAllPlans(cfg.plans_count);
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
    return results;
  }

  // ── Airtable logging ──────────────────────────────────────────────────────
  async function logToAirtable(
    workflowId: string,
    status: "Success" | "Failed",
  ) {
    try {
      await addPayment({
        customer_name: workflowName,
        amount: 0,
        plan: selectedTrigger.label,
        payment_id: workflowId,
        status,
      });
    } catch {}
  }

  // ── Discord notification ──────────────────────────────────────────────────
  async function notifyDiscord(
    workflowId: string,
    status: "Success" | "Failed",
  ) {
    try {
      if (status === "Success") {
        if (
          selectedTrigger.trigger_key === "razorpay.payment.captured" ||
          selectedTrigger.trigger_key === "razorpay.payment.captured.mcp" ||
          selectedTrigger.trigger_key === "instamojo.payment.captured"
        ) {
          await sendPaymentAlert({
            amount: 0,
            customer_name: workflowName,
            plan: selectedActions.map((a) => a.label).join(", "),
            payment_id: workflowId,
          });
        } else {
          await sendNotification(
            "Workflow Deployed 🚀",
            `**${workflowName}** is now active!\n` +
              `Trigger: ${selectedTrigger.label}\n` +
              `Actions: ${selectedActions.map((a) => a.label).join(", ")}\n` +
              `ID: \`${workflowId}\``,
          );
        }
      } else {
        await sendNotification(
          "Workflow Deploy Failed ❌",
          `**${workflowName}** failed to deploy.\nTrigger: ${selectedTrigger.label}`,
        );
      }
    } catch {}
  }

  // ── SMS via Fast2SMS ──────────────────────────────────────────────────────
  async function notifySMS(workflowId: string, status: "Success" | "Failed") {
    if (!toNumber) return;
    try {
      const cleaned = toNumber.replace("+91", "").replace(/\s/g, "").trim();
      if (cleaned.length !== 10) return;
      const smsText =
        status === "Success"
          ? messageTemplate
              .replace("{name}", "Customer")
              .replace("{amount}", "0")
              .replace("{payment_id}", workflowId)
              .replace("{phone}", cleaned)
          : `Pravah: Workflow "${workflowName}" failed to deploy.`;
      await sendSMS({ numbers: cleaned, message: smsText });
    } catch {}
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!isAuthed) {
      navigate("/login");
      return;
    }
    setSaving(true);
    try {
      await apiCall("/workflows/", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });
      showToast("Workflow saved successfully! ✅", "success");
      loadWorkflows();
    } catch (err: any) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── Deploy ────────────────────────────────────────────────────────────────
  async function handleDeploy() {
    if (!isAuthed) {
      navigate("/login");
      return;
    }
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

      await Promise.allSettled([
        logToAirtable(wf.id, "Success"),
        notifyDiscord(wf.id, "Success"),
        notifySMS(wf.id, "Success"),
      ]);

      showToast("Workflow deployed & active! 🚀", "success");
      loadWorkflows();
    } catch (err: any) {
      showToast(err.message || "Deploy failed", "error");
      await Promise.allSettled([
        logToAirtable("N/A", "Failed"),
        notifyDiscord("N/A", "Failed"),
        notifySMS("N/A", "Failed"),
      ]);
    } finally {
      setDeploying(false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setTextField = (f: keyof InvoiceConfig, v: string) =>
    setInvoiceConfig((p) => ({ ...p, [f]: v }));
  const setBoolField = (f: keyof InvoiceConfig, v: boolean) =>
    setInvoiceConfig((p) => ({ ...p, [f]: v }));
  const setRzpField = (f: keyof RazorpayConfig, v: string | number) =>
    setRzpConfig((p) => ({ ...p, [f]: v }));
  const setSubField = (f: keyof SubscriptionConfig, v: any) =>
    setSubConfig((p) => ({ ...p, [f]: v }));
  const setTgField = (f: keyof TelegramConfig, v: string) =>
    setTgConfig((p) => ({ ...p, [f]: v }));
  const setZohoField = (f: keyof ZohoConfig, v: any) =>
    setZohoConfig((p) => ({ ...p, [f]: v }));

  // ── Sidebar badge helper ──────────────────────────────────────────────────
  function getBadge(item: (typeof triggers)[0] | (typeof actions)[0]) {
    const aKey = (item as any).action_key ?? "";
    const tKey = (item as any).trigger_key ?? "";
    if (aKey.startsWith("zoho_") || tKey.startsWith("zoho."))
      return { label: "ZOHO", bg: "#16a34a" };
    if (aKey.startsWith("telegram_") || tKey.startsWith("telegram."))
      return { label: "TG", bg: "#0088cc" };
    if (aKey.startsWith("sub_") || tKey.startsWith("subscription."))
      return { label: "SUB", bg: "#0e7490" };
    if (aKey.startsWith("razorpay_") || tKey.startsWith("razorpay."))
      return { label: "RZP", bg: "#2B6CB0" };
    if (aKey.startsWith("invoice_") || item.id === "t8" || item.id === "t9")
      return { label: "INV", bg: "#ea580c" };
    if (aKey.startsWith("instamojo_") || item.id === "t6" || item.id === "t7")
      return { label: "IM", bg: "#4f46e5" };
    return null;
  }

  // ── Zoho result renderer ──────────────────────────────────────────────────
  function renderZohoResultEntry(label: string, result: any) {
    if (result?.error) return <span>❌ {result.error}</span>;
    if (result?.lead_id)
      return (
        <span>
          ✅ Lead created · ID:{" "}
          <code style={{ fontSize: 10 }}>{result.lead_id}</code>
        </span>
      );
    if (result?.contact_id)
      return (
        <span>
          ✅ Contact created · ID:{" "}
          <code style={{ fontSize: 10 }}>{result.contact_id}</code>
        </span>
      );
    if (result?.deal_id)
      return (
        <span>
          ✅ Deal created · ID:{" "}
          <code style={{ fontSize: 10 }}>{result.deal_id}</code>
        </span>
      );
    if (result?.task_id)
      return (
        <span>
          ✅ Task created · ID:{" "}
          <code style={{ fontSize: 10 }}>{result.task_id}</code>
        </span>
      );
    if (result?.leads !== undefined) {
      return <span>✅ {result.total} lead(s) found</span>;
    }
    if (result?.success && result?.lead_id)
      return <span>✅ Lead {result.lead_id} updated</span>;
    if (result?.message) return <span>✅ {result.message}</span>;
    return <span>✅ Done</span>;
  }

  // ── Razorpay result renderer ──────────────────────────────────────────────
  function renderRzpResultEntry(label: string, result: any) {
    if (result?.error) return <span>❌ {result.error}</span>;
    if (
      result?.total_payments !== undefined &&
      result?.total_amount !== undefined
    ) {
      return (
        <span>
          ✅ {result.total_payments} payment(s) · {result.total_amount}
          {result.captured_payments !== undefined &&
            ` · ${result.captured_payments} captured`}
        </span>
      );
    }
    if (result?.id && result?.status) {
      return (
        <span>
          ✅ {result.id} — {result.amount} ({result.status})
        </span>
      );
    }
    if (result?.success_rate !== undefined) {
      return (
        <span>
          ✅ {result.period} · Revenue: {result.total_revenue} · Success:{" "}
          {result.success_rate}
        </span>
      );
    }
    return <span>✅ Done</span>;
  }

  // ── Subscription result renderer ──────────────────────────────────────────
  function renderSubResultEntry(label: string, result: any) {
    if (result?.error) return <span>❌ {result.error}</span>;
    if (result?.subscriptions !== undefined && result?.total !== undefined) {
      return <span>✅ {result.total} subscription(s) fetched</span>;
    }
    if (result?.expiring_in_days !== undefined) {
      return (
        <span>
          ✅ {result.count} expiring in {result.expiring_in_days}d
        </span>
      );
    }
    if (result?.failed_count !== undefined) {
      return <span>✅ {result.failed_count} failed subscription(s)</span>;
    }
    if (result?.id && result?.status) {
      return (
        <span>
          ✅ {result.id} → {result.status}
          {result.message ? ` · ${result.message}` : ""}
        </span>
      );
    }
    if (result?.subscription_id) {
      return (
        <span>
          ✅ Created: {result.subscription_id} ·{" "}
          <a
            href={result.short_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0e7490", textDecoration: "underline" }}
          >
            Payment Link ↗
          </a>
        </span>
      );
    }
    if (result?.mrr !== undefined) {
      return (
        <span>
          ✅ MRR: {result.mrr} · ARR: {result.arr}
        </span>
      );
    }
    if (Array.isArray(result)) {
      return <span>✅ {result.length} plan(s) fetched</span>;
    }
    if (result?.health_rate !== undefined) {
      return (
        <span>
          ✅ Active: {result.active} · Health: {result.health_rate} · Churn:{" "}
          {result.churn_rate}
        </span>
      );
    }
    return <span>✅ Done</span>;
  }

  // ── Telegram result renderer ──────────────────────────────────────────────
  function renderTgResultEntry(label: string, result: any) {
    if (result?.error) return <span>❌ {result.error}</span>;
    if (result?.message_id)
      return (
        <span>
          ✅ Sent (msg #{result.message_id}) to chat {result.chat_id}
        </span>
      );
    if (result?.username)
      return (
        <span>
          ✅ Bot: {result.name} ({result.username}) · ID: {result.id}
        </span>
      );
    if (result?.updates_count !== undefined) {
      const ids = result.chats
        ?.filter((c: any) => c.chat_id)
        .map((c: any) => c.chat_id);
      return (
        <span>
          ✅ {result.updates_count} updates
          {ids?.length > 0 && ` · Chat IDs: ${ids.join(", ")}`}
        </span>
      );
    }
    return <span>✅ Done</span>;
  }

  // ── Subscription sub-config flags ─────────────────────────────────────────
  const subActionKeys = selectedActions
    .filter((a) => a.action_key.startsWith("sub_"))
    .map((a) => a.action_key);
  const needsSubId = subActionKeys.some((k) =>
    ["sub_lookup", "sub_cancel", "sub_pause", "sub_resume"].includes(k),
  );
  const needsListOpts = subActionKeys.some((k) =>
    ["sub_list_all", "sub_summary"].includes(k),
  );
  const needsExpiring = subActionKeys.includes("sub_expiring");
  const needsFailed = subActionKeys.includes("sub_failed");
  const needsCreate = subActionKeys.includes("sub_create");
  const needsPlans = subActionKeys.includes("sub_plans");

  // ── Telegram sub-config flags ─────────────────────────────────────────────
  const tgActionKeys = selectedActions
    .filter((a) => a.action_key.startsWith("telegram_"))
    .map((a) => a.action_key);
  const needsTgMessage = tgActionKeys.includes("telegram_send_message");
  const needsTgPaymentAlert = tgActionKeys.includes("telegram_payment_alert");
  const needsTgChatId = needsTgMessage || needsTgPaymentAlert;

  // ── Zoho sub-config flags ─────────────────────────────────────────────────
  const zohoActionKeys = selectedActions
    .filter((a) => a.action_key.startsWith("zoho_"))
    .map((a) => a.action_key);
  const needsZohoLead = zohoActionKeys.includes("zoho_create_lead");
  const needsZohoContact = zohoActionKeys.includes("zoho_create_contact");
  const needsZohoDeal = zohoActionKeys.includes("zoho_create_deal");
  const needsZohoTask = zohoActionKeys.includes("zoho_create_task");
  const needsZohoSearch = zohoActionKeys.includes("zoho_search_leads");
  const needsZohoUpdate = zohoActionKeys.includes("zoho_update_lead");
  const needsZohoGetLeads = zohoActionKeys.includes("zoho_get_leads");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="builder-layout">
      {/* Toast */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
            color: toast.type === "success" ? "#16a34a" : "#dc2626",
            padding: "12px 20px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Auth banner */}
      {!isAuthed && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            background: "#fef3c7",
            borderBottom: "1px solid #f59e0b",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 14,
            color: "#92400e",
            fontWeight: 500,
          }}
        >
          <AlertCircle size={16} />
          You are not logged in. Saving workflows requires an account.
          <button
            onClick={() => navigate("/login")}
            aria-label="Go to login page"
            style={{
              background: "#f59e0b",
              color: "#fff",
              border: "none",
              padding: "4px 12px",
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontWeight: 600,
            }}
          >
            <LogIn size={14} /> Login
          </button>
        </div>
      )}

      {/* Header */}
      <header
        className="builder-header"
        style={{ marginTop: !isAuthed ? 44 : 0 }}
      >
        <div className="builder-header__left">
          <Link
            to="/"
            className="builder-header__back"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </Link>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            aria-label="Workflow name"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              fontWeight: 600,
              color: "inherit",
              minWidth: 200,
            }}
          />
        </div>
        <div className="builder-header__actions">
          <button
            className="btn-secondary"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={handleSave}
            disabled={saving}
            aria-label="Save workflow"
          >
            {saving ? (
              <Loader size={16} className="spin" />
            ) : (
              <Save size={16} />
            )}{" "}
            Save
          </button>
          <button
            className="btn-primary"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={handleDeploy}
            disabled={deploying}
            aria-label="Deploy workflow"
          >
            {deploying ? (
              <Loader size={16} className="spin" />
            ) : (
              <Play size={16} />
            )}{" "}
            Deploy
          </button>
        </div>
      </header>

      <div className="builder-body">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside
          className="builder-sidebar"
          role="complementary"
          aria-label="Workflow components"
        >
          <div className="builder-sidebar__tabs" role="tablist">
            <div
              className={`builder-sidebar__tab ${selectedTab === "triggers" ? "builder-sidebar__tab--active" : ""}`}
              onClick={() => setSelectedTab("triggers")}
              role="tab"
              aria-selected={selectedTab === "triggers"}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedTab("triggers")}
            >
              Triggers
            </div>
            <div
              className={`builder-sidebar__tab ${selectedTab === "actions" ? "builder-sidebar__tab--active" : ""}`}
              onClick={() => setSelectedTab("actions")}
              role="tab"
              aria-selected={selectedTab === "actions"}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedTab("actions")}
            >
              Actions
            </div>
          </div>

          <div className="builder-sidebar__content">
            {(selectedTab === "triggers" ? triggers : actions).map((item) => {
              const Icon = item.icon;
              const isSelected =
                selectedTab === "triggers"
                  ? selectedTrigger.id === item.id
                  : selectedActions.some((a) => a.id === item.id);
              const badge = getBadge(item);

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) =>
                    handleSidebarDragStart(
                      e,
                      selectedTab === "triggers" ? "trigger" : "action",
                      item,
                    )
                  }
                  className="node-item"
                  onClick={() =>
                    selectedTab === "triggers"
                      ? setSelectedTrigger(item as any)
                      : addAction(item as any)
                  }
                  style={{
                    cursor: "grab",
                    border: isSelected ? "1.5px solid #6366f1" : "",
                    background: isSelected ? "#eef2ff" : "",
                    position: "relative",
                  }}
                  title="Drag to canvas"
                >
                  {badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        background: badge.bg,
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 4,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {badge.label}
                    </span>
                  )}
                  <div
                    className="node-item__icon"
                    style={{
                      color: `var(--${item.color}-600)`,
                      background: `var(--${item.color}-50)`,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="node-item__info">
                    <span className="node-item__label">{item.label}</span>
                    <span className="node-item__desc">{item.desc}</span>
                  </div>
                  <Plus size={14} color={isSelected ? "#6366f1" : "#9ca3af"} />
                </div>
              );
            })}
          </div>

          {workflows.length > 0 && (
            <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb" }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                Saved Workflows
              </p>
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  style={{
                    fontSize: 12,
                    padding: "6px 8px",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    background: wf.status === "active" ? "#dcfce7" : "#f9fafb",
                    marginBottom: 4,
                  }}
                >
                  <span>{wf.name}</span>
                  <span
                    style={{
                      color: wf.status === "active" ? "#16a34a" : "#9ca3af",
                    }}
                  >
                    {wf.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Canvas ──────────────────────────────────────────────── */}
        <main
          className="builder-canvas"
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
        >
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {selectedActions.map((_, i) => (
              <line
                key={i}
                x1="390"
                y1={160 + i * 120}
                x2="390"
                y2={220 + i * 120}
                stroke="#cbd5e1"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* Trigger node */}
          <div
            draggable
            onDragStart={(e) =>
              handleNodeDragStart(e, "trigger-node", "trigger")
            }
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCanvasNodeDrop(e, "trigger-node")}
            className="canvas-node canvas-node--selected"
            style={{
              left: nodePositions["trigger-node"]?.left || 280,
              top: nodePositions["trigger-node"]?.top || 60,
              cursor: "grab",
            }}
          >
            <div className="canvas-node__header">
              <Zap size={16} />
              <span style={{ fontWeight: 600 }}>
                TRIGGER: {selectedTrigger.label}
              </span>
              {hasInstaTrigger && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#4f46e5",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  INSTAMOJO
                </span>
              )}
              {hasRzpTrigger && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#2B6CB0",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  RAZORPAY
                </span>
              )}
              {hasSubTrigger && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#0e7490",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  SUBSCRIPTION
                </span>
              )}
              {hasTgTrigger && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#0088cc",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  TELEGRAM
                </span>
              )}
              {hasZohoTrigger && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  ZOHO
                </span>
              )}
              {(selectedTrigger.id === "t8" || selectedTrigger.id === "t9") && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "#ea580c",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  INVOICE
                </span>
              )}
            </div>
            <div className="canvas-node__body">{selectedTrigger.desc}</div>
          </div>

          {/* Action nodes */}
          {selectedActions.map((action, i) => {
            const Icon = action.icon;
            const isInsta = action.action_key.startsWith("instamojo_");
            const isInv = action.action_key.startsWith("invoice_");
            const isRzp = action.action_key.startsWith("razorpay_");
            const isSub = action.action_key.startsWith("sub_");
            const isTg = action.action_key.startsWith("telegram_");
            const isZoho = action.action_key.startsWith("zoho_");
            const nodePos = getNodePosition(action.id);
            return (
              <div
                key={action.id}
                draggable
                onDragStart={(e) => handleNodeDragStart(e, action.id, "action")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleCanvasNodeDrop(e, action.id)}
                className="canvas-node"
                style={{
                  left: nodePos.left || 280,
                  top: nodePos.top || 200 + i * 130,
                  border: isZoho
                    ? "1.5px solid #16a34a"
                    : isInsta
                      ? "1.5px solid #4f46e5"
                      : isInv
                        ? "1.5px solid #ea580c"
                        : isRzp
                          ? "1.5px solid #2B6CB0"
                          : isSub
                            ? "1.5px solid #0e7490"
                            : isTg
                              ? "1.5px solid #0088cc"
                              : undefined,
                  cursor: "grab",
                }}
              >
                <div className="canvas-node__header">
                  <Icon size={16} />
                  <span style={{ fontWeight: 600 }}>
                    ACTION: {action.label}
                  </span>
                  {isInsta && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#4f46e5",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      INSTAMOJO
                    </span>
                  )}
                  {isInv && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#ea580c",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      INVOICE
                    </span>
                  )}
                  {isRzp && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#2B6CB0",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      RAZORPAY
                    </span>
                  )}
                  {isSub && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#0e7490",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      SUBSCRIPTION
                    </span>
                  )}
                  {isTg && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#0088cc",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      TELEGRAM
                    </span>
                  )}
                  {isZoho && (
                    <span
                      style={{
                        marginLeft: 6,
                        background: "#16a34a",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      ZOHO CRM
                    </span>
                  )}
                  <button
                    onClick={() => removeAction(action.id)}
                    aria-label={`Remove ${action.label} action`}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="canvas-node__body">{action.desc}</div>
              </div>
            );
          })}
        </main>

        {/* ── Properties panel ────────────────────────────────────── */}
        <aside className="builder-properties">
          <div className="builder-properties__header">
            <h3 className="text-sm font-bold uppercase text-gray-500">
              Configuration
            </h3>
          </div>
          <div className="builder-properties__content">
            <div className="auth-form">
              <label className="auth-form__label">Workflow Name</label>
              <input
                type="text"
                className="auth-form__input"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
              />

              <label className="auth-form__label" style={{ marginTop: 16 }}>
                Trigger
              </label>
              <input
                type="text"
                className="auth-form__input"
                value={selectedTrigger.label}
                readOnly
                style={{ background: "#f9fafb" }}
              />

              <label className="auth-form__label" style={{ marginTop: 16 }}>
                Actions
              </label>
              <input
                type="text"
                className="auth-form__input"
                value={selectedActions.map((a) => a.label).join(", ")}
                readOnly
                style={{ background: "#f9fafb" }}
              />

              <label className="auth-form__label" style={{ marginTop: 16 }}>
                WhatsApp / SMS Number (optional)
              </label>
              <input
                type="text"
                className="auth-form__input"
                placeholder="+919876543210"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Enter a 10-digit Indian number to receive an SMS on deploy.
              </p>

              <label className="auth-form__label" style={{ marginTop: 16 }}>
                Message Template
              </label>
              <textarea
                className="auth-form__input"
                rows={5}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                style={{
                  resize: "vertical",
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                Variables: {"{name}"} {"{amount}"} {"{payment_id}"} {"{phone}"}
              </p>

              {/* ════════════════════════════════════════════════
                                ── ZOHO CRM MCP CONFIG
                                ════════════════════════════════════════════════ */}
              {hasZohoAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#15803d",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Users size={13} /> Zoho CRM MCP Config
                  </p>

                  {/* ── Create Lead ── */}
                  {needsZohoLead && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <UserPlus size={12} /> Create Lead
                      </p>
                      {(
                        [
                          {
                            label: "First Name",
                            field: "lead_first_name",
                            placeholder: "Rahul",
                            type: "text",
                          },
                          {
                            label: "Last Name *",
                            field: "lead_last_name",
                            placeholder: "Sharma",
                            type: "text",
                          },
                          {
                            label: "Email *",
                            field: "lead_email",
                            placeholder: "rahul@email.com",
                            type: "email",
                          },
                          {
                            label: "Phone",
                            field: "lead_phone",
                            placeholder: "+919876543210",
                            type: "text",
                          },
                          {
                            label: "Company",
                            field: "lead_company",
                            placeholder: "Acme Corp",
                            type: "text",
                          },
                          {
                            label: "Amount (₹)",
                            field: "lead_amount",
                            placeholder: "999",
                            type: "number",
                          },
                          {
                            label: "Description",
                            field: "lead_description",
                            placeholder: "Notes…",
                            type: "text",
                          },
                        ] as {
                          label: string;
                          field: keyof ZohoConfig;
                          placeholder: string;
                          type: string;
                        }[]
                      ).map(({ label, field, placeholder, type }) => (
                        <div key={field} style={{ marginBottom: 8 }}>
                          <label className="auth-form__label">{label}</label>
                          <input
                            type={type}
                            className="auth-form__input"
                            placeholder={placeholder}
                            value={zohoConfig[field] as string}
                            onChange={(e) =>
                              setZohoField(field, e.target.value)
                            }
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Lead Source</label>
                        <select
                          className="auth-form__input"
                          value={zohoConfig.lead_source}
                          onChange={(e) =>
                            setZohoField("lead_source", e.target.value)
                          }
                        >
                          {[
                            "Web",
                            "Payment",
                            "Razorpay",
                            "Instamojo",
                            "Typeform",
                            "Referral",
                            "Cold Call",
                            "Other",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ── Create Contact ── */}
                  {needsZohoContact && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Users size={12} /> Create Contact
                      </p>
                      {(
                        [
                          {
                            label: "First Name",
                            field: "contact_first_name",
                            placeholder: "Priya",
                            type: "text",
                          },
                          {
                            label: "Last Name *",
                            field: "contact_last_name",
                            placeholder: "Patel",
                            type: "text",
                          },
                          {
                            label: "Email *",
                            field: "contact_email",
                            placeholder: "priya@co.com",
                            type: "email",
                          },
                          {
                            label: "Phone",
                            field: "contact_phone",
                            placeholder: "+919876543210",
                            type: "text",
                          },
                          {
                            label: "Account/Company",
                            field: "contact_account_name",
                            placeholder: "Acme Corp",
                            type: "text",
                          },
                          {
                            label: "Description",
                            field: "contact_description",
                            placeholder: "Notes…",
                            type: "text",
                          },
                        ] as {
                          label: string;
                          field: keyof ZohoConfig;
                          placeholder: string;
                          type: string;
                        }[]
                      ).map(({ label, field, placeholder, type }) => (
                        <div key={field} style={{ marginBottom: 8 }}>
                          <label className="auth-form__label">{label}</label>
                          <input
                            type={type}
                            className="auth-form__input"
                            placeholder={placeholder}
                            value={zohoConfig[field] as string}
                            onChange={(e) =>
                              setZohoField(field, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Create Deal ── */}
                  {needsZohoDeal && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Briefcase size={12} /> Create Deal
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Deal Name *</label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Pro Plan - Rahul Sharma"
                          value={zohoConfig.deal_name}
                          onChange={(e) =>
                            setZohoField("deal_name", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Amount (₹)</label>
                        <input
                          type="number"
                          className="auth-form__input"
                          placeholder="4999"
                          value={zohoConfig.deal_amount}
                          onChange={(e) =>
                            setZohoField("deal_amount", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Stage</label>
                        <select
                          className="auth-form__input"
                          value={zohoConfig.deal_stage}
                          onChange={(e) =>
                            setZohoField("deal_stage", e.target.value)
                          }
                        >
                          {[
                            "Qualification",
                            "Value Proposition",
                            "Id. Decision Makers",
                            "Perception Analysis",
                            "Proposal/Price Quote",
                            "Negotiation/Review",
                            "Closed Won",
                            "Closed Lost",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      {(
                        [
                          {
                            label: "Contact Name",
                            field: "deal_contact_name",
                            placeholder: "Rahul Sharma",
                          },
                          {
                            label: "Account Name",
                            field: "deal_account_name",
                            placeholder: "Acme Corp",
                          },
                          {
                            label: "Description",
                            field: "deal_description",
                            placeholder: "Notes…",
                          },
                        ] as {
                          label: string;
                          field: keyof ZohoConfig;
                          placeholder: string;
                        }[]
                      ).map(({ label, field, placeholder }) => (
                        <div key={field} style={{ marginBottom: 8 }}>
                          <label className="auth-form__label">{label}</label>
                          <input
                            type="text"
                            className="auth-form__input"
                            placeholder={placeholder}
                            value={zohoConfig[field] as string}
                            onChange={(e) =>
                              setZohoField(field, e.target.value)
                            }
                          />
                        </div>
                      ))}
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Closing Date</label>
                        <input
                          type="date"
                          className="auth-form__input"
                          value={zohoConfig.deal_closing_date}
                          onChange={(e) =>
                            setZohoField("deal_closing_date", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Create Task ── */}
                  {needsZohoTask && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <ListChecks size={12} /> Create Task
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Subject *</label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Follow up with Rahul"
                          value={zohoConfig.task_subject}
                          onChange={(e) =>
                            setZohoField("task_subject", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Due Date</label>
                        <input
                          type="date"
                          className="auth-form__input"
                          value={zohoConfig.task_due_date}
                          onChange={(e) =>
                            setZohoField("task_due_date", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Status</label>
                        <select
                          className="auth-form__input"
                          value={zohoConfig.task_status}
                          onChange={(e) =>
                            setZohoField("task_status", e.target.value)
                          }
                        >
                          {[
                            "Not Started",
                            "In Progress",
                            "Completed",
                            "Waiting for Input",
                            "Deferred",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Priority</label>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["High", "Medium", "Low"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setZohoField("task_priority", p)}
                              style={{
                                padding: "5px 14px",
                                borderRadius: 6,
                                fontSize: 12,
                                border: "1px solid #86efac",
                                cursor: "pointer",
                                background:
                                  zohoConfig.task_priority === p
                                    ? "#15803d"
                                    : "#fff",
                                color:
                                  zohoConfig.task_priority === p
                                    ? "#fff"
                                    : "#374151",
                                fontWeight:
                                  zohoConfig.task_priority === p ? 700 : 400,
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Description</label>
                        <textarea
                          className="auth-form__input"
                          rows={2}
                          placeholder="Task notes…"
                          value={zohoConfig.task_description}
                          onChange={(e) =>
                            setZohoField("task_description", e.target.value)
                          }
                          style={{
                            resize: "vertical",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Search Leads ── */}
                  {needsZohoSearch && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Search size={12} /> Search Leads
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Email</label>
                        <input
                          type="email"
                          className="auth-form__input"
                          placeholder="rahul@email.com"
                          value={zohoConfig.search_email}
                          onChange={(e) =>
                            setZohoField("search_email", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <label className="auth-form__label">
                          Name (if no email)
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Rahul"
                          value={zohoConfig.search_name}
                          onChange={(e) =>
                            setZohoField("search_name", e.target.value)
                          }
                        />
                      </div>
                      <p
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}
                      >
                        Email takes priority over name.
                      </p>
                    </div>
                  )}

                  {/* ── Update Lead ── */}
                  {needsZohoUpdate && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <UserPlus size={12} /> Update Lead
                      </p>
                      <div style={{ marginBottom: 8 }}>
                        <label className="auth-form__label">Lead ID *</label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="54xxx…"
                          value={zohoConfig.update_lead_id}
                          onChange={(e) =>
                            setZohoField("update_lead_id", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <label className="auth-form__label">
                          Fields to Update (JSON) *
                        </label>
                        <textarea
                          className="auth-form__input"
                          rows={4}
                          placeholder={
                            '{\n  "Lead_Status": "Contacted",\n  "Phone": "+919876543210"\n}'
                          }
                          value={zohoConfig.update_fields}
                          onChange={(e) =>
                            setZohoField("update_fields", e.target.value)
                          }
                          style={{
                            resize: "vertical",
                            fontFamily: "monospace",
                            fontSize: 11,
                          }}
                        />
                        <p
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 4,
                          }}
                        >
                          Enter valid JSON with Zoho field names as keys.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Get Leads ── */}
                  {needsZohoGetLeads && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "12px",
                        background: "#dcfce7",
                        borderRadius: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#166534",
                          marginBottom: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Users size={12} /> Get Recent Leads
                      </p>
                      <label className="auth-form__label">
                        Number of leads to fetch
                      </label>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        {[5, 10, 25, 50].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setZohoField("get_leads_count", n)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              border: "1px solid #86efac",
                              cursor: "pointer",
                              background:
                                zohoConfig.get_leads_count === n
                                  ? "#15803d"
                                  : "#fff",
                              color:
                                zohoConfig.get_leads_count === n
                                  ? "#fff"
                                  : "#374151",
                              fontWeight:
                                zohoConfig.get_leads_count === n ? 700 : 400,
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="10"
                        min={1}
                        max={200}
                        value={zohoConfig.get_leads_count}
                        onChange={(e) =>
                          setZohoField(
                            "get_leads_count",
                            parseInt(e.target.value) || 10,
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Bridge URL info */}
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "9px 12px",
                      background: "#bbf7d0",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#166534",
                    }}
                  >
                    🔌 Calls{" "}
                    <code style={{ fontSize: 10 }}>
                      REACT_APP_ZOHO_BRIDGE_URL
                    </code>{" "}
                    (default:{" "}
                    <code style={{ fontSize: 10 }}>localhost:3001</code>). Make
                    sure <strong>zoho-bridge.js</strong> is running.
                  </div>

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                      border: "1px solid #86efac",
                      color: "#15803d",
                    }}
                    onClick={runZohoActions}
                    disabled={zohoLoading}
                  >
                    {zohoLoading ? <Loader size={14} /> : <Users size={14} />}
                    Test Zoho CRM Actions Now
                  </button>

                  {zohoResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(zohoResult).map(
                        ([label, result]: any) => (
                          <div
                            key={label}
                            style={{
                              marginBottom: 8,
                              padding: "10px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              background: result?.error ? "#fee2e2" : "#dcfce7",
                              color: result?.error ? "#dc2626" : "#15803d",
                            }}
                          >
                            <strong>{label}:</strong>{" "}
                            {renderZohoResultEntry(label, result)}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ════════════════════════════════════════════════
                                ── TELEGRAM MCP CONFIG
                                ════════════════════════════════════════════════ */}
              {hasTgAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#e7f5ff",
                    border: "1px solid #90cdf4",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0088cc",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Bot size={13} /> Telegram MCP Config
                  </p>

                  {needsTgChatId && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">
                        Chat ID / @username *
                      </label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="-1001234567890 or @mychannel"
                        value={tgConfig.chat_id}
                        onChange={(e) => setTgField("chat_id", e.target.value)}
                      />
                      <p
                        style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}
                      >
                        Use "Telegram: Get Updates" action first to discover
                        chat IDs.
                      </p>
                    </div>
                  )}

                  {needsTgMessage && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Message *</label>
                        <textarea
                          className="auth-form__input"
                          rows={4}
                          placeholder="Hello from Pravah! 🚀"
                          value={tgConfig.message}
                          onChange={(e) =>
                            setTgField("message", e.target.value)
                          }
                          style={{
                            resize: "vertical",
                            fontFamily: "monospace",
                            fontSize: 12,
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Parse Mode</label>
                        <select
                          className="auth-form__input"
                          value={tgConfig.parse_mode}
                          onChange={(e) =>
                            setTgField("parse_mode", e.target.value)
                          }
                        >
                          <option value="Markdown">Markdown</option>
                          <option value="HTML">HTML</option>
                          <option value="">Plain text</option>
                        </select>
                      </div>
                    </>
                  )}

                  {needsTgPaymentAlert && (
                    <>
                      <div
                        style={{
                          marginBottom: 12,
                          padding: "10px 12px",
                          background: "#dbeafe",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#1e40af",
                        }}
                      >
                        💰 <strong>Payment Alert</strong> — sends a formatted
                        payment notification to your Telegram chat.
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Rahul Sharma"
                          value={tgConfig.customer_name}
                          onChange={(e) =>
                            setTgField("customer_name", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Amount (₹) *</label>
                        <input
                          type="number"
                          className="auth-form__input"
                          placeholder="999"
                          value={tgConfig.amount}
                          onChange={(e) => setTgField("amount", e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          Plan / Product
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Pro Monthly"
                          value={tgConfig.plan}
                          onChange={(e) => setTgField("plan", e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Payment ID</label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="pay_ABC123XYZ"
                          value={tgConfig.payment_id}
                          onChange={(e) =>
                            setTgField("payment_id", e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {tgActionKeys.includes("telegram_bot_info") && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: "10px 12px",
                        background: "#e0f2fe",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#0369a1",
                      }}
                    >
                      🤖 <strong>Bot Info</strong> — fetches your bot's name,
                      username and ID. No extra config needed.
                    </div>
                  )}
                  {tgActionKeys.includes("telegram_get_updates") && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: "10px 12px",
                        background: "#e0f2fe",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#0369a1",
                      }}
                    >
                      📨 <strong>Get Updates</strong> — fetches recent bot
                      messages to discover chat IDs. No extra config needed.
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                      border: "1px solid #90cdf4",
                      color: "#0088cc",
                    }}
                    onClick={runTelegramActions}
                    disabled={tgLoading}
                  >
                    {tgLoading ? <Loader size={14} /> : <Bot size={14} />}
                    Test Telegram Actions Now
                  </button>

                  {tgResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(tgResult).map(([label, result]: any) => (
                        <div
                          key={label}
                          style={{
                            marginBottom: 8,
                            padding: "10px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            background: result?.error ? "#fee2e2" : "#dbeafe",
                            color: result?.error ? "#dc2626" : "#1e40af",
                          }}
                        >
                          <strong>{label}:</strong>{" "}
                          {renderTgResultEntry(label, result)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Instamojo config ──────────────────────────── */}
              {hasInstaAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4f46e5",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 12,
                    }}
                  >
                    💳 Instamojo Config
                  </p>

                  {selectedActions.some(
                    (a) => a.action_key === "instamojo_notify_complete",
                  ) && (
                    <>
                      <label className="auth-form__label">
                        Payment ID (to notify)
                      </label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="MOJO24..."
                        value={instaConfig.payment_id}
                        onChange={(e) =>
                          setInstaConfig({
                            ...instaConfig,
                            payment_id: e.target.value,
                          })
                        }
                        style={{ marginBottom: 10 }}
                      />
                    </>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "instamojo_summary_whatsapp",
                  ) && (
                    <>
                      <label className="auth-form__label">
                        WhatsApp Number (for daily report)
                      </label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="+919876543210"
                        value={instaConfig.whatsapp_phone}
                        onChange={(e) =>
                          setInstaConfig({
                            ...instaConfig,
                            whatsapp_phone: e.target.value,
                          })
                        }
                        style={{ marginBottom: 10 }}
                      />
                    </>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "instamojo_create_link",
                  ) && (
                    <>
                      <label className="auth-form__label">Link Purpose</label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="Course registration fee"
                        value={instaConfig.link_purpose}
                        onChange={(e) =>
                          setInstaConfig({
                            ...instaConfig,
                            link_purpose: e.target.value,
                          })
                        }
                        style={{ marginBottom: 10 }}
                      />
                      <label className="auth-form__label">Amount (₹)</label>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="999"
                        value={instaConfig.link_amount}
                        onChange={(e) =>
                          setInstaConfig({
                            ...instaConfig,
                            link_amount: e.target.value,
                          })
                        }
                        style={{ marginBottom: 10 }}
                      />
                      <label className="auth-form__label">
                        Your Name / Business
                      </label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="Pravah"
                        value={instaConfig.link_name}
                        onChange={(e) =>
                          setInstaConfig({
                            ...instaConfig,
                            link_name: e.target.value,
                          })
                        }
                        style={{ marginBottom: 10 }}
                      />
                    </>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                    onClick={runInstamojoActions}
                    disabled={instaLoading}
                  >
                    {instaLoading ? (
                      <Loader size={14} />
                    ) : (
                      <CreditCard size={14} />
                    )}
                    Test Instamojo Actions Now
                  </button>

                  {instaResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(instaResult).map(
                        ([label, result]: any) => (
                          <div
                            key={label}
                            style={{
                              marginBottom: 8,
                              padding: "10px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              background: result?.error ? "#fee2e2" : "#dcfce7",
                              color: result?.error ? "#dc2626" : "#16a34a",
                            }}
                          >
                            <strong>{label}:</strong>{" "}
                            {result?.error ? (
                              `❌ ${result.error}`
                            ) : result?.short_link ? (
                              <>
                                ✅ Link:{" "}
                                <a
                                  href={result.short_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#4f46e5",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {result.short_link}
                                </a>
                              </>
                            ) : result?.summary ? (
                              `✅ Sent to ${result.sent_to} — ${result.summary.total_amount}`
                            ) : result?.notifications ? (
                              `✅ WA: ${result.notifications.whatsapp?.success ? "✅" : "❌"} | Email: ${result.notifications.email?.success ? "✅" : "❌"}`
                            ) : (
                              "✅ Done"
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Invoice config ────────────────────────────── */}
              {hasInvoiceAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#ea580c",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 14,
                    }}
                  >
                    🧾 Invoice MCP Config
                  </p>

                  {(
                    [
                      {
                        label: "Payment ID *",
                        field: "payment_id",
                        placeholder: "PAY_abc123",
                      },
                      {
                        label: "Amount ₹ *",
                        field: "amount",
                        placeholder: "999",
                      },
                      {
                        label: "Customer Name *",
                        field: "customer_name",
                        placeholder: "Rohit Sharma",
                      },
                      {
                        label: "Customer Email *",
                        field: "customer_email",
                        placeholder: "rohit@example.com",
                      },
                      {
                        label: "Customer Phone *",
                        field: "customer_phone",
                        placeholder: "+919876543210",
                      },
                      {
                        label: "Product / Service",
                        field: "product_name",
                        placeholder: "Pro Plan",
                      },
                      {
                        label: "Company Name",
                        field: "company_name",
                        placeholder: "Pravah",
                      },
                    ] as {
                      label: string;
                      field: keyof InvoiceConfig;
                      placeholder: string;
                    }[]
                  ).map(({ label, field, placeholder }) => (
                    <div key={field} style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">{label}</label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder={placeholder}
                        value={invoiceConfig[field] as string}
                        onChange={(e) => setTextField(field, e.target.value)}
                      />
                    </div>
                  ))}

                  {selectedActions.some(
                    (a) =>
                      a.action_key === "invoice_whatsapp" ||
                      a.action_key === "invoice_email",
                  ) && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          Invoice Number *
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="INV-00042"
                          value={invoiceConfig.invoice_number}
                          onChange={(e) =>
                            setTextField("invoice_number", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          PDF Path (server absolute path)
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="/home/app/invoices/INV-00042.pdf"
                          value={invoiceConfig.pdf_path}
                          onChange={(e) =>
                            setTextField("pdf_path", e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "invoice_wa_direct",
                  ) && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">
                        WhatsApp Message *
                      </label>
                      <textarea
                        className="auth-form__input"
                        rows={3}
                        placeholder="Hi! Your invoice is ready…"
                        value={invoiceConfig.wa_message}
                        onChange={(e) =>
                          setTextField("wa_message", e.target.value)
                        }
                        style={{
                          resize: "vertical",
                          fontFamily: "monospace",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "invoice_full_flow",
                  ) && (
                    <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={invoiceConfig.send_whatsapp}
                          onChange={(e) =>
                            setBoolField("send_whatsapp", e.target.checked)
                          }
                        />
                        Send WhatsApp
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={invoiceConfig.send_email}
                          onChange={(e) =>
                            setBoolField("send_email", e.target.checked)
                          }
                        />
                        Send Email
                      </label>
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                    onClick={runInvoiceActions}
                    disabled={invoiceLoading}
                  >
                    {invoiceLoading ? (
                      <Loader size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                    Test Invoice Actions Now
                  </button>

                  {invoiceResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(invoiceResult).map(
                        ([lbl, result]: any) => (
                          <div
                            key={lbl}
                            style={{
                              marginBottom: 8,
                              padding: "10px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              background: result?.error ? "#fee2e2" : "#dcfce7",
                              color: result?.error ? "#dc2626" : "#15803d",
                            }}
                          >
                            <strong>{lbl}:</strong>{" "}
                            {result?.error ? (
                              `❌ ${result.error}`
                            ) : result?.invoice?.pdf_url ? (
                              <>
                                ✅{" "}
                                <a
                                  href={result.invoice.pdf_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "#ea580c",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {result.invoice?.invoice_number}
                                </a>{" "}
                                · WA:{result.whatsapp?.success ? "✅" : "❌"} ·
                                Email:{result.email?.success ? "✅" : "❌"}
                              </>
                            ) : result?.message_sid ? (
                              `✅ WhatsApp SID: ${result.message_sid}`
                            ) : result?.message_id ? (
                              `✅ Email ID: ${result.message_id}`
                            ) : (
                              "✅ Done"
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Razorpay MCP config ───────────────────────── */}
              {hasRzpAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#2B6CB0",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 14,
                    }}
                  >
                    💳 Razorpay MCP Config
                  </p>

                  {selectedActions.some(
                    (a) => a.action_key === "razorpay_todays_payments",
                  ) && (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: "10px 12px",
                        background: "#dbeafe",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#1e40af",
                      }}
                    >
                      📅 <strong>Today's Payments</strong> — no extra config
                      needed. Will fetch live data on run.
                    </div>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "razorpay_payments_range",
                  ) && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">From Date *</label>
                        <input
                          type="date"
                          className="auth-form__input"
                          value={rzpConfig.from_date}
                          onChange={(e) =>
                            setRzpField("from_date", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">To Date *</label>
                        <input
                          type="date"
                          className="auth-form__input"
                          value={rzpConfig.to_date}
                          onChange={(e) =>
                            setRzpField("to_date", e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "razorpay_payment_detail",
                  ) && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">Payment ID *</label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="pay_ABC123XYZ"
                        value={rzpConfig.payment_id}
                        onChange={(e) =>
                          setRzpField("payment_id", e.target.value)
                        }
                      />
                    </div>
                  )}

                  {selectedActions.some(
                    (a) => a.action_key === "razorpay_payment_summary",
                  ) && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="auth-form__label">
                        Analyse Last N Days *
                      </label>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        {[7, 14, 30, 90].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setRzpField("days", d)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              border: "1px solid #bfdbfe",
                              cursor: "pointer",
                              background:
                                rzpConfig.days === d ? "#2B6CB0" : "#fff",
                              color: rzpConfig.days === d ? "#fff" : "#374151",
                              fontWeight: rzpConfig.days === d ? 700 : 400,
                            }}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="7"
                        min={1}
                        value={rzpConfig.days}
                        onChange={(e) =>
                          setRzpField("days", parseInt(e.target.value) || 7)
                        }
                      />
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                    onClick={runRazorpayActions}
                    disabled={rzpLoading}
                  >
                    {rzpLoading ? (
                      <Loader
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <IndianRupee size={14} />
                    )}
                    Test Razorpay Actions Now
                  </button>

                  {rzpResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(rzpResult).map(([label, result]: any) => (
                        <div
                          key={label}
                          style={{
                            marginBottom: 8,
                            padding: "10px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            background: result?.error ? "#fee2e2" : "#dbeafe",
                            color: result?.error ? "#dc2626" : "#1e40af",
                          }}
                        >
                          <strong>{label}:</strong>{" "}
                          {renderRzpResultEntry(label, result)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Subscription MCP config ───────────────────── */}
              {hasSubAction && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 14,
                    borderRadius: 10,
                    background: "#ecfeff",
                    border: "1px solid #a5f3fc",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0e7490",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 14,
                    }}
                  >
                    🔄 Subscription MCP Config
                  </p>

                  {needsSubId && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">
                        Subscription ID *
                      </label>
                      <input
                        type="text"
                        className="auth-form__input"
                        placeholder="sub_ABC123XYZ"
                        value={subConfig.subscription_id}
                        onChange={(e) =>
                          setSubField("subscription_id", e.target.value)
                        }
                      />
                    </div>
                  )}

                  {subActionKeys.includes("sub_cancel") && (
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={subConfig.cancel_at_cycle_end}
                          onChange={(e) =>
                            setSubField("cancel_at_cycle_end", e.target.checked)
                          }
                        />
                        Cancel at end of billing cycle (not immediately)
                      </label>
                    </div>
                  )}

                  {subActionKeys.includes("sub_pause") && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="auth-form__label">Pause At</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["now", "cycle_end"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSubField("pause_at", opt)}
                            style={{
                              padding: "5px 14px",
                              borderRadius: 6,
                              fontSize: 12,
                              border: "1px solid #a5f3fc",
                              cursor: "pointer",
                              background:
                                subConfig.pause_at === opt ? "#0e7490" : "#fff",
                              color:
                                subConfig.pause_at === opt ? "#fff" : "#374151",
                              fontWeight:
                                subConfig.pause_at === opt ? 700 : 400,
                            }}
                          >
                            {opt === "now" ? "Now" : "Cycle End"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {needsListOpts && (
                    <>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Count</label>
                        <input
                          type="number"
                          className="auth-form__input"
                          placeholder="10"
                          min={1}
                          max={100}
                          value={subConfig.list_count}
                          onChange={(e) =>
                            setSubField(
                              "list_count",
                              parseInt(e.target.value) || 10,
                            )
                          }
                        />
                      </div>
                      {subActionKeys.includes("sub_list_all") && (
                        <div style={{ marginBottom: 10 }}>
                          <label className="auth-form__label">
                            Status Filter (optional)
                          </label>
                          <select
                            className="auth-form__input"
                            value={subConfig.list_status}
                            onChange={(e) =>
                              setSubField("list_status", e.target.value)
                            }
                          >
                            <option value="">All statuses</option>
                            {[
                              "created",
                              "authenticated",
                              "active",
                              "paused",
                              "halted",
                              "cancelled",
                              "completed",
                              "expired",
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {needsExpiring && (
                    <div style={{ marginBottom: 12 }}>
                      <label className="auth-form__label">
                        Check Expiring in Next N Days *
                      </label>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        {[7, 14, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSubField("expiring_days", d)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 6,
                              fontSize: 12,
                              border: "1px solid #a5f3fc",
                              cursor: "pointer",
                              background:
                                subConfig.expiring_days === d
                                  ? "#0e7490"
                                  : "#fff",
                              color:
                                subConfig.expiring_days === d
                                  ? "#fff"
                                  : "#374151",
                              fontWeight:
                                subConfig.expiring_days === d ? 700 : 400,
                            }}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="7"
                        min={1}
                        value={subConfig.expiring_days}
                        onChange={(e) =>
                          setSubField(
                            "expiring_days",
                            parseInt(e.target.value) || 7,
                          )
                        }
                      />
                    </div>
                  )}

                  {needsFailed && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">
                        Failed Subscriptions to Fetch
                      </label>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="20"
                        min={1}
                        value={subConfig.failed_count}
                        onChange={(e) =>
                          setSubField(
                            "failed_count",
                            parseInt(e.target.value) || 20,
                          )
                        }
                      />
                    </div>
                  )}

                  {needsPlans && (
                    <div style={{ marginBottom: 10 }}>
                      <label className="auth-form__label">Plans to Fetch</label>
                      <input
                        type="number"
                        className="auth-form__input"
                        placeholder="10"
                        min={1}
                        value={subConfig.plans_count}
                        onChange={(e) =>
                          setSubField(
                            "plans_count",
                            parseInt(e.target.value) || 10,
                          )
                        }
                      />
                    </div>
                  )}

                  {needsCreate && (
                    <>
                      <div
                        style={{
                          marginBottom: 12,
                          padding: "10px 12px",
                          background: "#cffafe",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#0e7490",
                        }}
                      >
                        ➕ <strong>Create Subscription</strong> — fills plan ID,
                        cycles & customer details below.
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Plan ID *</label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="plan_ABC123XYZ"
                          value={subConfig.plan_id}
                          onChange={(e) =>
                            setSubField("plan_id", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          Total Billing Cycles *
                        </label>
                        <input
                          type="number"
                          className="auth-form__input"
                          placeholder="12"
                          min={1}
                          value={subConfig.total_count}
                          onChange={(e) =>
                            setSubField(
                              "total_count",
                              parseInt(e.target.value) || 12,
                            )
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">Quantity</label>
                        <input
                          type="number"
                          className="auth-form__input"
                          placeholder="1"
                          min={1}
                          value={subConfig.quantity}
                          onChange={(e) =>
                            setSubField(
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label className="auth-form__label">
                          Customer Name (note)
                        </label>
                        <input
                          type="text"
                          className="auth-form__input"
                          placeholder="Rahul Sharma"
                          value={subConfig.note_name}
                          onChange={(e) =>
                            setSubField("note_name", e.target.value)
                          }
                        />
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label className="auth-form__label">
                          Customer Email (note)
                        </label>
                        <input
                          type="email"
                          className="auth-form__input"
                          placeholder="rahul@example.com"
                          value={subConfig.note_email}
                          onChange={(e) =>
                            setSubField("note_email", e.target.value)
                          }
                        />
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          cursor: "pointer",
                          marginBottom: 12,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={subConfig.customer_notify}
                          onChange={(e) =>
                            setSubField("customer_notify", e.target.checked)
                          }
                        />
                        Notify customer via Razorpay email
                      </label>
                    </>
                  )}

                  {subActionKeys.some((k) =>
                    ["sub_revenue", "sub_summary"].includes(k),
                  ) && (
                    <div
                      style={{
                        marginBottom: 12,
                        padding: "10px 12px",
                        background: "#cffafe",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#0e7490",
                      }}
                    >
                      📊 <strong>Revenue / Summary</strong> — no extra config
                      needed. Fetches live data on run.
                    </div>
                  )}

                  <button
                    className="btn-secondary"
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                    onClick={runSubscriptionActions}
                    disabled={subLoading}
                  >
                    {subLoading ? (
                      <Loader
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Repeat size={14} />
                    )}
                    Test Subscription Actions Now
                  </button>

                  {subResult && (
                    <div style={{ marginTop: 12 }}>
                      {Object.entries(subResult).map(([label, result]: any) => (
                        <div
                          key={label}
                          style={{
                            marginBottom: 8,
                            padding: "10px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            background: result?.error ? "#fee2e2" : "#cffafe",
                            color: result?.error ? "#dc2626" : "#0e7490",
                          }}
                        >
                          <strong>{label}:</strong>{" "}
                          {renderSubResultEntry(label, result)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-primary"
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onClick={handleDeploy}
                disabled={deploying}
              >
                {deploying ? <Loader size={16} /> : <Play size={16} />}
                Save & Deploy
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

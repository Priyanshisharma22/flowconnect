import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import PDFDocument from "pdfkit";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import express from "express";

dotenv.config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const server = new McpServer({ name: "invoice-mcp", version: "1.0.0" });

// ═══════════════════════════════════════════════════════════════════
// EMAIL PROVIDERS — Gmail (Nodemailer) + Twilio SendGrid
// ═══════════════════════════════════════════════════════════════════

const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmailViaGmail({ customer_email, customer_name, invoice_number, amount, company_name, filePath }) {
  const companyLabel = company_name || "FlowConnect";
  const mailOptions = {
    from: `"${companyLabel}" <${process.env.GMAIL_USER}>`,
    to: customer_email,
    subject: `Your Invoice ${invoice_number} from ${companyLabel}`,
    html: buildEmailHtml({ customer_name, invoice_number, amount, companyLabel }),
    attachments: [{ filename: `${invoice_number}.pdf`, path: filePath, contentType: "application/pdf" }],
  };
  const info = await gmailTransporter.sendMail(mailOptions);
  return { success: true, message_id: info.messageId, sent_to: customer_email, invoice_number, provider: "Gmail (Nodemailer)" };
}

async function sendEmailViaSendGrid({ customer_email, customer_name, invoice_number, amount, company_name, filePath }) {
  const companyLabel = company_name || "FlowConnect";
  const pdfBase64 = fs.readFileSync(filePath).toString("base64");
  const payload = {
    personalizations: [{ to: [{ email: customer_email, name: customer_name }], subject: `Your Invoice ${invoice_number} from ${companyLabel}` }],
    from: { email: process.env.SENDGRID_FROM_EMAIL, name: companyLabel },
    content: [{ type: "text/html", value: buildEmailHtml({ customer_name, invoice_number, amount, companyLabel }) }],
    attachments: [{ content: pdfBase64, filename: `${invoice_number}.pdf`, type: "application/pdf", disposition: "attachment" }],
  };
  const resp = await axios.post("https://api.sendgrid.com/v3/mail/send", payload, {
    headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
  });
  return { success: true, http_status: resp.status, sent_to: customer_email, invoice_number, provider: "Twilio SendGrid" };
}

async function sendInvoiceEmail(params) {
  const provider = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();
  return provider === "sendgrid" ? sendEmailViaSendGrid(params) : sendEmailViaGmail(params);
}

function buildEmailHtml({ customer_name, invoice_number, amount, companyLabel }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:#6366f1;padding:28px;border-radius:10px 10px 0 0;">
        <h1 style="color:white;margin:0;font-size:26px;">${companyLabel}</h1>
        <p style="color:#c7d2fe;margin:6px 0 0;">India-first Automation Platform</p>
      </div>
      <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;">
        <p style="font-size:16px;">Hello <strong>${customer_name}</strong>,</p>
        <p>Thank you for your payment! Please find your invoice attached.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:8px;overflow:hidden;">
          <tr style="background:#6366f1;">
            <th colspan="2" style="color:white;padding:12px;text-align:left;font-size:14px;">Invoice Summary</th>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:12px;border:1px solid #e5e7eb;color:#6b7280;">Invoice Number</td>
            <td style="padding:12px;border:1px solid #e5e7eb;"><strong>${invoice_number}</strong></td>
          </tr>
          <tr>
            <td style="padding:12px;border:1px solid #e5e7eb;color:#6b7280;">Amount</td>
            <td style="padding:12px;border:1px solid #e5e7eb;"><strong style="color:#6366f1;font-size:16px;">Rs.${amount}</strong></td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:12px;border:1px solid #e5e7eb;color:#6b7280;">Date</td>
            <td style="padding:12px;border:1px solid #e5e7eb;">${new Date().toLocaleDateString("en-IN")}</td>
          </tr>
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#15803d;">✅ Payment received. Your invoice PDF is attached.</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">Questions? Just reply to this email.</p>
        <p>🙏 We appreciate your business!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:12px;text-align:center;">Powered by ${companyLabel} • flowconnect.app</p>
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// TWILIO WHATSAPP
// ═══════════════════════════════════════════════════════════════════

function normalizePhone(phone) {
  let clean = String(phone).trim().replace(/\s/g, "");
  if (!clean.startsWith("+")) clean = "+91" + clean;
  return `whatsapp:${clean}`;
}

async function twilioPost(formParams) {
  return axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    new URLSearchParams(formParams),
    { auth: { username: process.env.TWILIO_ACCOUNT_SID, password: process.env.TWILIO_AUTH_TOKEN } }
  );
}

async function sendWhatsAppInvoice({ phone, invoice_number, amount, customer_name, company_name, pdf_url }) {
  const to = normalizePhone(phone);
  const companyLabel = company_name || "FlowConnect";
  const body = `Invoice from ${companyLabel}\n\nHello ${customer_name}!\n\nYour invoice is ready:\nInvoice #: ${invoice_number}\nAmount: Rs.${amount}\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nPayment received successfully!\n\nThank you for your business!\n- ${companyLabel}`;
  const params = { From: process.env.TWILIO_WHATSAPP_FROM, To: to, Body: body };
  const resp = await twilioPost(params);
  return { success: true, message_sid: resp.data.sid, sent_to: to, invoice_number, pdf_url: pdf_url || null, provider: "Twilio WhatsApp" };
}

async function sendWhatsAppDirect({ phone, message }) {
  const to = normalizePhone(phone);
  const resp = await twilioPost({ From: process.env.TWILIO_WHATSAPP_FROM, To: to, Body: message });
  return { success: true, message_sid: resp.data.sid, sent_to: to, provider: "Twilio WhatsApp" };
}

// ═══════════════════════════════════════════════════════════════════
// PDF GENERATION
// ═══════════════════════════════════════════════════════════════════

async function generateInvoicePDF({ payment_id, amount, customer_name, customer_email, customer_phone, product_name, company_name }) {
  let invoice;

  try {
    const aiResp = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Generate a professional invoice in JSON format for:
- Company: ${company_name || "FlowConnect"}
- Customer: ${customer_name}
- Email: ${customer_email}
- Payment ID: ${payment_id}
- Amount: Rs.${amount}
- Product: ${product_name || "Digital Service"}
- Date: ${new Date().toLocaleDateString("en-IN")}

Return ONLY valid JSON:
{
  "invoice_number": "INV-XXXXX",
  "company_name": "...",
  "company_tagline": "...",
  "customer_name": "...",
  "customer_email": "...",
  "invoice_date": "...",
  "due_date": "...",
  "items": [{"description": "...", "quantity": 1, "rate": 0, "amount": 0}],
  "subtotal": 0,
  "tax": 0,
  "total": 0,
  "notes": "...",
  "thank_you_message": "..."
}`,
      }],
    });
    const text = aiResp.content[0].text.replace(/```json|```/g, "").trim();
    invoice = JSON.parse(text);
    console.error("🤖 Invoice generated by Claude AI");
  } catch (aiErr) {
    console.error(`⚠️  Claude AI unavailable — using fallback. Error: ${aiErr.message}`);
    const pad = (n) => String(n).padStart(5, "0");
    const invoiceNum = `INV-${pad(Math.floor(Math.random() * 99999))}`;
    const today = new Date().toLocaleDateString("en-IN");
    const dueDate = new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN");
    const tax = Math.round(amount * 0.18);
    invoice = {
      invoice_number: invoiceNum,
      company_name: company_name || "FlowConnect",
      company_tagline: "India-first Automation Platform",
      customer_name, customer_email,
      invoice_date: today, due_date: dueDate,
      items: [{ description: product_name || "Digital Service", quantity: 1, rate: amount, amount }],
      subtotal: amount, tax, total: amount + tax,
      notes: `Payment ID: ${payment_id} | Thank you for choosing us!`,
      thank_you_message: "We appreciate your business. See you again! 🙏",
    };
  }

  const outputDir = path.join(process.cwd(), "invoices");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${invoice.invoice_number}.pdf`);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(28).fillColor("#6366f1").text(invoice.company_name, 50, 50);
    doc.fontSize(10).fillColor("#6b7280").text(invoice.company_tagline, 50, 85);
    doc.fontSize(20).fillColor("#111827").text("INVOICE", 400, 50, { align: "right" });
    doc.fontSize(10).fillColor("#6b7280")
      .text(`Invoice #: ${invoice.invoice_number}`, 400, 80, { align: "right" })
      .text(`Date: ${invoice.invoice_date}`, 400, 95, { align: "right" })
      .text(`Due: ${invoice.due_date}`, 400, 110, { align: "right" });

    doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e5e7eb").stroke();
    doc.fontSize(10).fillColor("#6b7280").text("BILL TO", 50, 145);
    doc.fontSize(12).fillColor("#111827").text(invoice.customer_name, 50, 160);
    doc.fontSize(10).fillColor("#6b7280").text(invoice.customer_email, 50, 175);

    doc.rect(50, 210, 500, 25).fill("#6366f1");
    doc.fontSize(10).fillColor("#ffffff")
      .text("Description", 60, 218).text("Qty", 300, 218)
      .text("Rate", 370, 218).text("Amount", 460, 218);

    let y = 245;
    invoice.items.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(50, y - 5, 500, 22).fill("#f9fafb");
      doc.fontSize(10).fillColor("#111827")
        .text(item.description, 60, y).text(String(item.quantity), 300, y)
        .text(`Rs.${item.rate}`, 370, y).text(`Rs.${item.amount}`, 460, y);
      y += 25;
    });

    y += 10;
    doc.moveTo(350, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
    y += 10;
    doc.fontSize(10).fillColor("#6b7280").text("Subtotal:", 370, y);
    doc.fillColor("#111827").text(`Rs.${invoice.subtotal}`, 460, y);
    y += 18;
    doc.fillColor("#6b7280").text("GST (18%):", 370, y);
    doc.fillColor("#111827").text(`Rs.${invoice.tax}`, 460, y);
    y += 18;
    doc.rect(350, y, 200, 25).fill("#6366f1");
    doc.fontSize(12).fillColor("#ffffff").text("TOTAL:", 370, y + 6).text(`Rs.${invoice.total}`, 460, y + 6);

    y += 50;
    doc.fontSize(10).fillColor("#6b7280").text("Notes:", 50, y);
    doc.fillColor("#111827").text(invoice.notes, 50, y + 15);
    doc.fillColor("#6366f1").text(invoice.thank_you_message, 50, y + 35);
    doc.fontSize(8).fillColor("#9ca3af").text("Generated by FlowConnect • flowconnect.app", 50, 750, { align: "center" });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { invoice, filePath };
}

function getPdfPublicUrl(filePath) {
  const base = (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/invoices/${path.basename(filePath)}`;
}

// ═══════════════════════════════════════════════════════════════════
// MCP TOOLS
// ═══════════════════════════════════════════════════════════════════

server.tool("generate_invoice", "Generate a professional PDF invoice using Claude AI", {
  payment_id: z.string(), amount: z.number(), customer_name: z.string(),
  customer_email: z.string(), customer_phone: z.string(),
  product_name: z.string().optional(), company_name: z.string().optional(),
}, async (params) => {
  const { invoice, filePath } = await generateInvoicePDF(params);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, invoice_number: invoice.invoice_number, pdf_path: filePath, pdf_url: getPdfPublicUrl(filePath), amount: `Rs.${params.amount}` }, null, 2) }] };
});

server.tool("send_invoice_whatsapp", "Send invoice via WhatsApp", {
  phone: z.string(), invoice_number: z.string(), amount: z.number(),
  customer_name: z.string(), company_name: z.string().optional(), pdf_path: z.string().optional(),
}, async (params) => {
  const pdf_url = params.pdf_path ? getPdfPublicUrl(params.pdf_path) : undefined;
  return { content: [{ type: "text", text: JSON.stringify(await sendWhatsAppInvoice({ ...params, pdf_url }), null, 2) }] };
});

server.tool("send_invoice_email", "Send invoice via Email", {
  customer_email: z.string(), customer_name: z.string(), invoice_number: z.string(),
  amount: z.number(), company_name: z.string().optional(), pdf_path: z.string(),
}, async (params) => {
  return { content: [{ type: "text", text: JSON.stringify(await sendInvoiceEmail({ ...params, filePath: params.pdf_path }), null, 2) }] };
});

server.tool("process_payment_invoice", "Full flow: PDF + WhatsApp + Email", {
  payment_id: z.string(), amount: z.number(), customer_name: z.string(),
  customer_email: z.string(), customer_phone: z.string(),
  product_name: z.string().optional(), company_name: z.string().optional(),
  send_email: z.boolean().optional().default(true), send_whatsapp: z.boolean().optional().default(true),
}, async (params) => {
  const results = {};
  const { invoice, filePath } = await generateInvoicePDF(params);
  const pdf_url = getPdfPublicUrl(filePath);
  results.invoice = { success: true, invoice_number: invoice.invoice_number, pdf_path: filePath, pdf_url, amount: `Rs.${params.amount}` };
  if (params.send_whatsapp !== false) {
    try { results.whatsapp = await sendWhatsAppInvoice({ phone: params.customer_phone, invoice_number: invoice.invoice_number, amount: params.amount, customer_name: params.customer_name, company_name: params.company_name || "FlowConnect" }); }
    catch (e) { const detail = e.response?.data || e.message; console.error("TWILIO ERROR:", JSON.stringify(detail)); results.whatsapp = { success: false, error: JSON.stringify(detail) }; }
  }
  if (params.send_email !== false) {
    try { results.email = await sendInvoiceEmail({ customer_email: params.customer_email, customer_name: params.customer_name, invoice_number: invoice.invoice_number, amount: params.amount, company_name: params.company_name || "FlowConnect", filePath }); }
    catch (e) { results.email = { success: false, error: e.message }; }
  }
  return { content: [{ type: "text", text: JSON.stringify({ success: true, payment_id: params.payment_id, ...results }, null, 2) }] };
});

server.tool("send_whatsapp_direct", "Send custom WhatsApp message", {
  phone: z.string(), message: z.string(),
}, async (params) => {
  return { content: [{ type: "text", text: JSON.stringify(await sendWhatsAppDirect(params), null, 2) }] };
});

// ═══════════════════════════════════════════════════════════════════
// EXPRESS HTTP SERVER  ← replaces raw http.createServer
// ═══════════════════════════════════════════════════════════════════

function startHttpServer() {
  const PORT = process.env.PORT || 3000;
  const app = express();

  app.use(express.json());

  // Serve PDF files
  app.use("/invoices", express.static(path.join(process.cwd(), "invoices")));

  // GET / — list routes
  app.get("/", (req, res) => {
    res.json({
      service: "Invoice MCP — HTTP Test Server",
      email_provider: (process.env.EMAIL_PROVIDER || "gmail").toLowerCase(),
      routes: [
        "POST /test/invoice         → full flow: PDF + WhatsApp + Email",
        "POST /test/whatsapp        → WhatsApp invoice notification",
        "POST /test/email           → Email with PDF attachment",
        "POST /test/whatsapp-direct → raw custom WhatsApp message",
        "GET  /invoices/:filename   → serve PDF file",
      ],
    });
  });

  // POST /test/invoice — full flow
  app.post("/test/invoice", async (req, res) => {
    const data = req.body;
    const required = ["payment_id", "amount", "customer_name", "customer_email", "customer_phone"];
    const missing = required.filter((k) => !data[k]);
    if (missing.length) return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });

    try {
      const { invoice, filePath } = await generateInvoicePDF(data);
      const pdf_url = getPdfPublicUrl(filePath);
      const results = { invoice: { invoice_number: invoice.invoice_number, pdf_path: filePath, pdf_url } };

      try { results.whatsapp = await sendWhatsAppInvoice({ phone: data.customer_phone, invoice_number: invoice.invoice_number, amount: data.amount, customer_name: data.customer_name, company_name: data.company_name }); }
      catch (e) { const detail = e.response?.data || e.message; console.error("TWILIO ERROR:", JSON.stringify(detail)); results.whatsapp = { success: false, error: JSON.stringify(detail) }; }

      try { results.email = await sendInvoiceEmail({ customer_email: data.customer_email, customer_name: data.customer_name, invoice_number: invoice.invoice_number, amount: data.amount, company_name: data.company_name, filePath }); }
      catch (e) { results.email = { success: false, error: e.message }; }

      res.json({ success: true, ...results });
    } catch (err) {
      console.error("❌ Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /test/whatsapp
  app.post("/test/whatsapp", async (req, res) => {
    const { phone, invoice_number, amount, customer_name, company_name, pdf_path } = req.body;
    if (!phone || !invoice_number || !amount || !customer_name)
      return res.status(400).json({ error: "Required: phone, invoice_number, amount, customer_name" });
    try {
      const pdf_url = pdf_path ? getPdfPublicUrl(pdf_path) : undefined;
      res.json(await sendWhatsAppInvoice({ phone, invoice_number, amount, customer_name, company_name, pdf_url }));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST /test/email
  app.post("/test/email", async (req, res) => {
    const { customer_email, customer_name, invoice_number, amount, company_name, pdf_path } = req.body;
    if (!customer_email || !customer_name || !invoice_number || !amount || !pdf_path)
      return res.status(400).json({ error: "Required: customer_email, customer_name, invoice_number, amount, pdf_path" });
    try {
      res.json(await sendInvoiceEmail({ customer_email, customer_name, invoice_number, amount, company_name, filePath: pdf_path }));
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST /test/whatsapp-direct
  app.post("/test/whatsapp-direct", async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: "Required: phone, message" });
    try { res.json(await sendWhatsAppDirect({ phone, message })); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.listen(PORT, () => {
    console.error(`🌐 HTTP server → http://localhost:${PORT}`);
    console.error(`   Email provider: ${(process.env.EMAIL_PROVIDER || "gmail").toLowerCase()}`);
    console.error(`   Routes: POST /test/invoice | /test/whatsapp | /test/email | /test/whatsapp-direct`);
  });
}

// ═══════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════

startHttpServer();

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✅ Invoice MCP Server running...");


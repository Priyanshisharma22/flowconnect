/**
 * api/invoice.ts
 * ─────────────────────────────────────────────────────────────────
 * Client for invoice-mcp's built-in Express HTTP server.
 *
 * The MCP server exposes these endpoints at INVOICE_MCP_BASE_URL
 * (default http://localhost:3000):
 *
 *   POST /test/invoice          → full flow: PDF + WhatsApp + Email
 *   POST /test/whatsapp         → WhatsApp invoice notification
 *   POST /test/email            → Email with PDF attachment
 *   POST /test/whatsapp-direct  → raw custom WhatsApp message
 *   GET  /invoices/:filename    → serve PDF file
 *
 * Set VITE_INVOICE_MCP_URL in your .env to point to your server.
 */

import { http } from './httpClient'

const BASE = import.meta.env.VITE_INVOICE_MCP_URL ?? "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────

export interface InvoicePayload {
  payment_id: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name?: string;
  company_name?: string;
  send_email?: boolean;
  send_whatsapp?: boolean;
}

export interface InvoiceResult {
  success: boolean;
  payment_id?: string;
  invoice?: {
    invoice_number: string;
    pdf_path: string;
    pdf_url: string;
    amount?: string;
  };
  whatsapp?: {
    success: boolean;
    message_sid?: string;
    sent_to?: string;
    provider?: string;
    error?: string;
  };
  email?: {
    success: boolean;
    message_id?: string;
    sent_to?: string;
    provider?: string;
    http_status?: number;
    error?: string;
  };
  error?: string;
}

export interface WhatsAppDirectPayload {
  phone: string;
  message: string;
}

export interface WhatsAppDirectResult {
  success: boolean;
  message_sid?: string;
  sent_to?: string;
  provider?: string;
  error?: string;
}

export interface WhatsAppInvoicePayload {
  phone: string;
  invoice_number: string;
  amount: number;
  customer_name: string;
  company_name?: string;
  pdf_path?: string;
}

export interface EmailInvoicePayload {
  customer_email: string;
  customer_name: string;
  invoice_number: string;
  amount: number;
  company_name?: string;
  pdf_path: string;
}

// ── Core fetch helper ─────────────────────────────────────────────

async function invoicePost<T>(path: string, body: object): Promise<T> {
  return http.post(`${BASE}${path}`, body, { skipAuth: true })
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Full flow: generates PDF, sends WhatsApp + Email.
 * Maps to POST /test/invoice on the MCP HTTP server.
 */
export async function processPaymentInvoice(
  payload: InvoicePayload
): Promise<InvoiceResult> {
  return invoicePost<InvoiceResult>("/test/invoice", payload);
}

/**
 * Send WhatsApp invoice notification only.
 * Maps to POST /test/whatsapp.
 */
export async function sendWhatsAppInvoice(
  payload: WhatsAppInvoicePayload
): Promise<WhatsAppDirectResult> {
  return invoicePost<WhatsAppDirectResult>("/test/whatsapp", payload);
}

/**
 * Send invoice PDF via email only.
 * Maps to POST /test/email.
 */
export async function sendEmailInvoice(
  payload: EmailInvoicePayload
): Promise<{ success: boolean; message_id?: string; sent_to?: string; provider?: string; error?: string }> {
  return invoicePost("/test/email", payload);
}

/**
 * Send a raw custom WhatsApp message.
 * Maps to POST /test/whatsapp-direct.
 */
export async function sendWhatsAppDirect(
  payload: WhatsAppDirectPayload
): Promise<WhatsAppDirectResult> {
  return invoicePost<WhatsAppDirectResult>("/test/whatsapp-direct", payload);
}

/**
 * Returns a public URL for a generated PDF by filename.
 */
export function getInvoicePdfUrl(invoiceNumber: string): string {
  return `${BASE}/invoices/${invoiceNumber}.pdf`;
}
/**
 * instamojo.ts
 * Thin client that calls your backend /instamojo/* endpoints,
 * which in turn proxy to the instamojo-mcp tools.
 *
 * If you prefer to call the MCP server directly over stdio you'll need
 * a small Express proxy — the endpoints below map 1-to-1 to that proxy.
 */

import { apiCall } from './client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface InstamojoPayment {
  id: string
  amount: string
  status: string
  buyer: string
  buyer_email: string
  buyer_phone: string
  purpose: string
  date: string
  fees?: string
  link?: string
}

export interface InstamojoSummary {
  date: string
  total_payments: number
  successful: number
  failed: number
  total_amount: string
  payments: InstamojoPayment[]
}

export interface InstamojoLink {
  id: string
  purpose: string
  amount: string
  status: string
  shorturl: string
  payments: number
  created: string
}

export interface CreateLinkParams {
  purpose: string
  amount: number
  name: string
  email?: string
  phone?: string
  send_sms?: boolean
}

export interface CreatedLink {
  success: boolean
  payment_link: string
  short_link: string
  id: string
  purpose: string
  amount: string
  expires?: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Get all recent payments (default 20) */
export async function getInstamojoPayments(limit = 20): Promise<{
  total_payments: number
  successful: number
  total_amount: string
  payments: InstamojoPayment[]
}> {
  return apiCall(`/instamojo/payments?limit=${limit}`)
}

/** Get a single payment by ID */
export async function getInstamojoPaymentById(paymentId: string): Promise<InstamojoPayment> {
  return apiCall(`/instamojo/payments/${paymentId}`)
}

/** Get all payment links */
export async function getInstamojoLinks(limit = 20): Promise<{
  total_links: number
  links: InstamojoLink[]
}> {
  return apiCall(`/instamojo/links?limit=${limit}`)
}

/** Create a new payment link */
export async function createInstamojoLink(params: CreateLinkParams): Promise<CreatedLink> {
  return apiCall('/instamojo/links', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/** Get today's summary */
export async function getInstamojoDailySummary(): Promise<InstamojoSummary> {
  return apiCall('/instamojo/summary/today')
}

/** Search payments by email / phone / name */
export async function searchInstamojoPayments(query: string): Promise<{
  query: string
  found: number
  payments: InstamojoPayment[]
}> {
  return apiCall(`/instamojo/payments/search?q=${encodeURIComponent(query)}`)
}

/** Send today's summary to a WhatsApp number */
export async function sendInstamojoDailySummaryWhatsApp(phone: string): Promise<{
  success: boolean
  sent_to: string
  message_sid: string
  summary: { date: string; successful: number; total_amount: string }
}> {
  return apiCall('/instamojo/notify/whatsapp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

/** Send payment confirmation email to buyer */
export async function sendInstamojoPaymentEmail(params: {
  to_email: string
  buyer_name: string
  amount: number
  purpose: string
  payment_id: string
}): Promise<{ success: boolean; message_id: string; sent_to: string }> {
  return apiCall('/instamojo/notify/email', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/** Send both WhatsApp + Email after a payment */
export async function notifyInstamojoPaymentComplete(paymentId: string): Promise<{
  payment_id: string
  buyer: string
  amount: string
  notifications: {
    whatsapp?: { success: boolean; sent_to?: string; error?: string }
    email?: { success: boolean; sent_to?: string; message_id?: string; error?: string }
  }
}> {
  return apiCall('/instamojo/notify/complete', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId }),
  })
}
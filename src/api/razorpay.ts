/**
 * src/api/razorpay.ts
 * Frontend client for the Razorpay MCP server tools.
 * All calls go through your backend /api/mcp/razorpay proxy
 * so the Razorpay secret never touches the browser.
 */

import { apiCall } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RazorpayPayment {
    id: string
    amount: string          // "Rs.999.00"
    method: string
    status: string
    email: string
    contact: string
    description?: string
    date?: string           // localeDateString
    time?: string           // localeTimeString
}

export interface RazorpayTodaySummary {
    date: string
    total_payments: number
    captured_payments: number
    total_amount: string
    payments: RazorpayPayment[]
}

export interface RazorpayRangeSummary {
    from: string
    to: string
    total_payments: number
    total_amount: string
    payments: RazorpayPayment[]
}

export interface RazorpayPaymentDetail {
    id: string
    amount: string
    currency: string
    status: string
    method: string
    email: string
    contact: string
    description: string
    created_at: string
}

export interface RazorpayStats {
    period: string
    total_transactions: number
    successful: number
    failed: number
    success_rate: string
    total_revenue: string
    payment_methods: Record<string, number>
}

// ── API helpers ───────────────────────────────────────────────────────────────

/** POST /api/mcp/razorpay  — thin wrapper that picks the right tool */
async function callRazorpayMcp<T>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
    const data = await apiCall('/mcp/razorpay', {
        method: 'POST',
        body: JSON.stringify({ tool, args }),
    })
    // MCP tools return { content: [{ type:'text', text: '...' }] }
    // The backend should unwrap this, but handle both shapes:
    if (data?.content?.[0]?.text) {
        return JSON.parse(data.content[0].text) as T
    }
    return data as T
}

// ── Tool wrappers ─────────────────────────────────────────────────────────────

/** Tool 1 — get_todays_payments */
export async function getRazorpayTodaysPayments(): Promise<RazorpayTodaySummary> {
    return callRazorpayMcp<RazorpayTodaySummary>('get_todays_payments')
}

/** Tool 2 — get_payments_by_range */
export async function getRazorpayPaymentsByRange(
    from_date: string,   // 'YYYY-MM-DD'
    to_date: string,     // 'YYYY-MM-DD'
): Promise<RazorpayRangeSummary> {
    return callRazorpayMcp<RazorpayRangeSummary>('get_payments_by_range', { from_date, to_date })
}

/** Tool 3 — get_payment_details */
export async function getRazorpayPaymentDetails(payment_id: string): Promise<RazorpayPaymentDetail> {
    return callRazorpayMcp<RazorpayPaymentDetail>('get_payment_details', { payment_id })
}

/** Tool 4 — get_payment_summary */
export async function getRazorpayPaymentSummary(days: number): Promise<RazorpayStats> {
    return callRazorpayMcp<RazorpayStats>('get_payment_summary', { days })
}
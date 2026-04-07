/**
 * src/api/razorpay-subscriptions.ts
 * Frontend client for the Razorpay Subscription MCP server tools.
 * All calls go through your backend /api/mcp/razorpay-subscriptions proxy.
 */

import { apiCall } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RzpSubscription {
    id: string
    plan_id: string
    status: string
    current_start: string | null
    current_end: string | null
    paid_count: number
    total_count: number
    quantity: number
    remaining?: number
    ended_at?: string | null
    notes?: Record<string, any>
}

export interface RzpSubscriptionSummary {
    total_subscriptions: number
    active: number
    halted_failed: number
    cancelled: number
    paused: number
    health_rate: string
    churn_rate: string
}

export interface RzpSubscriptionInvoice {
    id: string
    status: string
    amount: string
    date: string | null
}

export interface RzpExpiringSubscription {
    id: string
    expires_on: string
    days_left: number
    paid_count: number
}

export interface RzpFailedSubscription {
    id: string
    plan_id: string
    paid_count: number
    total_count: number
    notes?: Record<string, any>
}

export interface RzpPlan {
    id: string
    name: string
    amount: string
    interval: number
    period: string
}

export interface RzpRevenue {
    active_subscriptions: number
    mrr: string
    arr: string
    avg_revenue_per_sub: string
}

export interface RzpCreatedSubscription {
    subscription_id: string
    status: string
    short_url: string
    message: string
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function callSubMcp<T>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
    const data = await apiCall('/mcp/razorpay-subscriptions', {
        method: 'POST',
        body: JSON.stringify({ tool, args }),
    })
    if (data?.content?.[0]?.text) {
        return JSON.parse(data.content[0].text) as T
    }
    return data as T
}

// ── Tool wrappers ─────────────────────────────────────────────────────────────

/** Tool: get_all_subscriptions */
export async function getAllSubscriptions(
    count = 10,
    status?: string,
): Promise<{ total: number; subscriptions: RzpSubscription[] }> {
    return callSubMcp('get_all_subscriptions', { count, ...(status ? { status } : {}) })
}

/** Tool: get_subscription_by_id */
export async function getSubscriptionById(subscription_id: string): Promise<RzpSubscription> {
    return callSubMcp('get_subscription_by_id', { subscription_id })
}

/** Tool: get_subscription_invoices */
export async function getSubscriptionInvoices(
    subscription_id: string,
): Promise<RzpSubscriptionInvoice[]> {
    return callSubMcp('get_subscription_invoices', { subscription_id })
}

/** Tool: cancel_subscription */
export async function cancelSubscription(
    subscription_id: string,
    cancel_at_cycle_end = false,
): Promise<{ id: string; status: string; message: string }> {
    return callSubMcp('cancel_subscription', { subscription_id, cancel_at_cycle_end })
}

/** Tool: pause_subscription */
export async function pauseSubscription(
    subscription_id: string,
    pause_at: 'now' | 'cycle_end' = 'now',
): Promise<{ id: string; status: string; message: string }> {
    return callSubMcp('pause_subscription', { subscription_id, pause_at })
}

/** Tool: resume_subscription */
export async function resumeSubscription(
    subscription_id: string,
    resume_at: 'now' = 'now',
): Promise<{ id: string; status: string; message: string }> {
    return callSubMcp('resume_subscription', { subscription_id, resume_at })
}

/** Tool: get_subscription_summary */
export async function getSubscriptionSummary(count = 50): Promise<RzpSubscriptionSummary> {
    return callSubMcp('get_subscription_summary', { count })
}

/** Tool: get_expiring_subscriptions */
export async function getExpiringSubscriptions(
    days = 7,
): Promise<{ expiring_in_days: number; count: number; subscriptions: RzpExpiringSubscription[] }> {
    return callSubMcp('get_expiring_subscriptions', { days })
}

/** Tool: get_failed_subscriptions */
export async function getFailedSubscriptions(
    count = 20,
): Promise<{ failed_count: number; subscriptions: RzpFailedSubscription[] }> {
    return callSubMcp('get_failed_subscriptions', { count })
}

/** Tool: create_subscription */
export async function createSubscription(params: {
    plan_id: string
    total_count: number
    quantity?: number
    customer_notify?: boolean
    notes?: Record<string, string>
}): Promise<RzpCreatedSubscription> {
    return callSubMcp('create_subscription', params)
}

/** Tool: get_all_plans */
export async function getAllPlans(count = 10): Promise<RzpPlan[]> {
    return callSubMcp('get_all_plans', { count })
}

/** Tool: get_subscription_revenue */
export async function getSubscriptionRevenue(): Promise<RzpRevenue> {
    return callSubMcp('get_subscription_revenue', {})
}
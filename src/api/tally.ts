/**
 * Tally MCP API client
 * Mirrors the pattern of razorpay.ts / slack.ts
 * Backend must expose these endpoints via a tally_bridge router (registered at /tally/*)
 */

const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

async function tallyCall<T>(endpoint: string, body?: object): Promise<T> {
    const res = await fetch(`${BASE}/tally${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : '{}',
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Tally API error: ${res.status}`)
    }
    return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TallyCompanyInfo {
    name: string
    financial_year: string
    from_date: string
    to_date: string
    currency: string
    mode: 'mock' | 'live'
}

export interface TallyLedger {
    name: string
    group: string
    closing_balance: number
    opening_balance: number
}

export interface TallyVoucher {
    date: string
    type: string
    number: string
    party: string
    narration: string
    amount: number
}

export interface TallyBalanceSheet {
    as_of_date: string
    liabilities: {
        capital_and_reserves: { name: string; amount: number }[]
        loans:                 { name: string; amount: number }[]
        current_liabilities:   { name: string; amount: number }[]
        total: number
    }
    assets: {
        fixed_assets:   { name: string; amount: number }[]
        current_assets: { name: string; amount: number }[]
        total: number
    }
    mode: 'mock' | 'live'
}

export interface TallyProfitLoss {
    period: string
    income:         { name: string; amount: number }[]
    total_income:   number
    expenses:       { name: string; amount: number }[]
    total_expenses: number
    net_profit:     number
    mode: 'mock' | 'live'
}

export interface TallyTrialBalance {
    ledgers: { name: string; group: string; debit: number; credit: number }[]
    mode: 'mock' | 'live'
}

export interface TallyOutstanding {
    type:    'debtors' | 'creditors'
    ledgers: TallyLedger[]
    count:   number
    mode:    'mock' | 'live'
}

export interface TallyStockItem {
    name:     string
    quantity: number
    unit:     string
    rate:     number
    value:    number
}

export interface TallyStockSummary {
    items:       TallyStockItem[]
    total_value: number
    mode:        'mock' | 'live'
}

// ── API Functions ──────────────────────────────────────────────────────────────

export const getTallyCompanyInfo = () =>
    tallyCall<TallyCompanyInfo>('/company')

export const getTallyLedgers = (group?: string) =>
    tallyCall<{ ledgers: TallyLedger[]; count: number; mode: string }>(
        '/ledgers', { group }
    )

export const getTallyVouchers = (
    from_date?: string,
    to_date?: string,
    voucher_type?: string,
) =>
    tallyCall<{
        vouchers:  TallyVoucher[]
        count:     number
        from_date: string
        to_date:   string
        mode:      string
    }>('/vouchers', { from_date, to_date, voucher_type })

export const getTallyBalanceSheet = () =>
    tallyCall<TallyBalanceSheet>('/balance-sheet')

export const getTallyProfitLoss = () =>
    tallyCall<TallyProfitLoss>('/profit-loss')

export const getTallyTrialBalance = () =>
    tallyCall<TallyTrialBalance>('/trial-balance')

export const getTallyOutstanding = (type: 'debtors' | 'creditors') =>
    tallyCall<TallyOutstanding>('/outstanding', { type })

export const getTallyStockSummary = () =>
    tallyCall<TallyStockSummary>('/stock-summary')
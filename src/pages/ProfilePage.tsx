import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
    User, CreditCard, Shield, Wallet, LogOut, Zap, TrendingUp, Clock, 
    Plus, Trash2, RefreshCw, Database, FileText, Search, Send, 
    MessageSquare, AlertCircle, CheckCircle, ExternalLink, BarChart2, 
    IndianRupee, Repeat, PauseCircle, PlayCircle, XCircle, Bot, Layout 
} from 'lucide-react'

import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import EmptyState from '../EmptyState' 
import { apiCall, logout, getToken } from '../api/client'
import { getPayments } from '../api/airtable'
import {
    getFormResponses, getLatestResponse,
    processFormSubmission, syncResponsesToSheets,
} from '../api/googleforms'
import {
    processPaymentInvoice, sendWhatsAppInvoice,
    sendEmailInvoice, sendWhatsAppDirect,
    type InvoicePayload,
} from '../api/invoice'
import {
    getInstamojoPayments, getInstamojoDailySummary,
    getInstamojoLinks, createInstamojoLink,
    searchInstamojoPayments, sendInstamojoDailySummaryWhatsApp,
    notifyInstamojoPaymentComplete,
    type InstamojoPayment, type InstamojoLink, type InstamojoSummary,
} from '../api/instamojo'
import {
    getRazorpayTodaysPayments, getRazorpayPaymentsByRange,
    getRazorpayPaymentDetails, getRazorpayPaymentSummary,
    type RazorpayPayment, type RazorpayTodaySummary,
    type RazorpayRangeSummary, type RazorpayStats,
} from '../api/razorpay'
import {
    getAllSubscriptions, getSubscriptionById, getSubscriptionInvoices,
    cancelSubscription, pauseSubscription, resumeSubscription,
    getSubscriptionSummary, getExpiringSubscriptions, getFailedSubscriptions,
    createSubscription, getAllPlans, getSubscriptionRevenue,
    type RzpSubscription, type RzpSubscriptionSummary, type RzpSubscriptionInvoice,
    type RzpExpiringSubscription, type RzpFailedSubscription,
    type RzpPlan, type RzpRevenue, type RzpCreatedSubscription,
} from '../api/razorpay-subscriptions'
import {
    getBotInfo, getUpdates, sendTelegramMessage, sendTelegramPaymentAlert,
    type TelegramBotInfo, type TelegramUpdatesResult,
} from '../api/telegram'
import {
    listTypeforms, getTypeformFields, getTypeformResponses,
    type TypeformForm, type TypeformField, type TypeformResponse,
} from '../api/typeform'
import { SkeletonText, SkeletonRow, SkeletonStat } from '../components/common/SkeletonLoader'

import '../styles/ProfilePage.css'

// ── Types ──────────────────────────────────────────────────────────────────────
interface GeneratedInvoice {
    invoice_number: string; pdf_url: string; amount: string
    customer_name: string; customer_email: string; customer_phone: string
    whatsapp_status?: 'sent' | 'failed' | 'skipped'
    email_status?: 'sent' | 'failed' | 'skipped'
    created_at: string
}

// ── Status color helpers ───────────────────────────────────────────────────────
const subStatusColor = (status: string) => {
    switch (status) {
        case 'active':        return { bg: '#dcfce7', text: '#16a34a' }
        case 'paused':        return { bg: '#fef3c7', text: '#d97706' }
        case 'halted':        return { bg: '#fee2e2', text: '#dc2626' }
        case 'cancelled':     return { bg: '#f3f4f6', text: '#6b7280' }
        case 'completed':     return { bg: '#eff6ff', text: '#2563eb' }
        case 'authenticated': return { bg: '#f5f3ff', text: '#7c3aed' }
        case 'created':       return { bg: '#fef9c3', text: '#ca8a04' }
        default:              return { bg: '#f3f4f6', text: '#6b7280' }
    }
}

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [isEditing, setIsEditing] = useState(false)
    const [user, setUser]           = useState<any>(null)
    const [apps, setApps]           = useState<any[]>([])
    const [workflows, setWorkflows] = useState<any[]>([])
    const [dashboard, setDashboard] = useState<any>(null)
    const [loading, setLoading]     = useState(true)
    const [name, setName]           = useState('')
    const [saveMsg, setSaveMsg]     = useState('')

    // ── Airtable ───────────────────────────────────────────────────────────────
    const [payments, setPayments]               = useState<any[]>([])
    const [paymentsLoading, setPaymentsLoading] = useState(false)
    const [paymentsFilter, setPaymentsFilter]   = useState('')

    // ── Google Forms ───────────────────────────────────────────────────────────
    const [formIdInput, setFormIdInput]           = useState('')
    const [formId, setFormId]                     = useState('')
    const [formResponses, setFormResponses]       = useState<any[]>([])
    const [formTitle, setFormTitle]               = useState('')
    const [formsLoading, setFormsLoading]         = useState(false)
    const [formsError, setFormsError]             = useState('')
    const [selectedResponse, setSelectedResponse] = useState<any>(null)
    const [showProcessModal, setShowProcessModal] = useState(false)
    const [processForm, setProcessForm]           = useState({
        name: '', email: '', phone: '', form_response: '',
        spreadsheet_id: '', sheet_name: 'Form Responses', create_zoho: false,
    })
    const [processResult, setProcessResult]   = useState<any>(null)
    const [processLoading, setProcessLoading] = useState(false)
    const [syncSheetId, setSyncSheetId]       = useState('')
    const [syncSheetName, setSyncSheetName]   = useState('Form Responses')
    const [syncLoading, setSyncLoading]       = useState(false)
    const [syncResult, setSyncResult]         = useState<any>(null)

    // ── Invoices ───────────────────────────────────────────────────────────────
    const [invoiceSubTab, setInvoiceSubTab]   = useState<'generate' | 'history' | 'whatsapp' | 'email' | 'direct'>('generate')
    const [invoiceHistory, setInvoiceHistory] = useState<GeneratedInvoice[]>([])
    const [fullForm, setFullForm]             = useState<InvoicePayload>({
        payment_id: '', amount: 0, customer_name: '', customer_email: '',
        customer_phone: '', product_name: '', company_name: 'Pravah',
        send_email: true, send_whatsapp: true,
    })
    const [fullResult, setFullResult]       = useState<any>(null)
    const [fullLoading, setFullLoading]     = useState(false)
    const [waForm, setWaForm]               = useState({ phone: '', invoice_number: '', amount: '', customer_name: '', company_name: 'Pravah', pdf_path: '' })
    const [waResult, setWaResult]           = useState<any>(null)
    const [waLoading, setWaLoading]         = useState(false)
    const [emailForm, setEmailForm]         = useState({ customer_email: '', customer_name: '', invoice_number: '', amount: '', company_name: 'Pravah', pdf_path: '' })
    const [emailResult, setEmailResult]     = useState<any>(null)
    const [emailLoading, setEmailLoading]   = useState(false)
    const [directForm, setDirectForm]       = useState({ phone: '', message: '' })
    const [directResult, setDirectResult]   = useState<any>(null)
    const [directLoading, setDirectLoading] = useState(false)

    // ── Instamojo ──────────────────────────────────────────────────────────────
    const [instaPayments, setInstaPayments]         = useState<InstamojoPayment[]>([])
    const [instaLinks, setInstaLinks]               = useState<InstamojoLink[]>([])
    const [instaSummary, setInstaSummary]           = useState<InstamojoSummary | null>(null)
    const [instaLoading, setInstaLoading]           = useState(false)
    const [instaError, setInstaError]               = useState('')
    const [instaSearch, setInstaSearch]             = useState('')
    const [instaSearchResult, setInstaSearchResult] = useState<InstamojoPayment[] | null>(null)
    const [instaSubTab, setInstaSubTab]             = useState<'payments' | 'links' | 'summary' | 'notify' | 'create'>('payments')
    const [notifyPaymentId, setNotifyPaymentId]     = useState('')
    const [notifyResult, setNotifyResult]           = useState<any>(null)
    const [notifyLoading, setNotifyLoading]         = useState(false)
    const [createForm, setCreateForm]               = useState({ purpose: '', amount: '', name: '', email: '', phone: '' })
    const [createResult, setCreateResult]           = useState<any>(null)
    const [createLoading, setCreateLoading]         = useState(false)
    const [instaWaPhone, setInstaWaPhone]           = useState('')
    const [instaWaResult, setInstaWaResult]         = useState<any>(null)
    const [instaWaLoading, setInstaWaLoading]       = useState(false)

    // ── Razorpay Payments MCP ──────────────────────────────────────────────────
    const [rzpSubTab, setRzpSubTab]     = useState<'today' | 'range' | 'detail' | 'stats'>('today')
    const [rzpLoading, setRzpLoading]   = useState(false)
    const [rzpError, setRzpError]       = useState('')
    const [rzpToday, setRzpToday]       = useState<RazorpayTodaySummary | null>(null)
    const [rzpFromDate, setRzpFromDate] = useState('')
    const [rzpToDate, setRzpToDate]     = useState('')
    const [rzpRange, setRzpRange]       = useState<RazorpayRangeSummary | null>(null)
    const [rzpDetailId, setRzpDetailId] = useState('')
    const [rzpDetail, setRzpDetail]     = useState<any>(null)
    const [rzpStatsDays, setRzpStatsDays] = useState(7)
    const [rzpStats, setRzpStats]         = useState<RazorpayStats | null>(null)

    // ── Razorpay Subscriptions MCP ─────────────────────────────────────────────
    const [subTab, setSubTab]               = useState<'overview' | 'list' | 'lookup' | 'expiring' | 'failed' | 'plans' | 'revenue' | 'create'>('overview')
    const [subLoading, setSubLoading]     = useState(false)
    const [subError, setSubError]         = useState('')
    const [subActionMsg, setSubActionMsg] = useState<{ text: string; ok: boolean } | null>(null)
    const [subSummary, setSubSummary]     = useState<RzpSubscriptionSummary | null>(null)
    const [subRevenue, setSubRevenue]     = useState<RzpRevenue | null>(null)
    const [subList, setSubList]           = useState<RzpSubscription[]>([])
    const [subListStatus, setSubListStatus]   = useState('')
    const [subListCount, setSubListCount]     = useState(10)
    const [subInvoices, setSubInvoices]       = useState<RzpSubscriptionInvoice[]>([])
    const [subInvoiceId, setSubInvoiceId]     = useState('')
    const [subInvoiceLoading, setSubInvoiceLoading] = useState(false)
    const [subLookupId, setSubLookupId]   = useState('')
    const [subDetail, setSubDetail]       = useState<RzpSubscription | null>(null)
    const [expiringDays, setExpiringDays] = useState(7)
    const [expiringList, setExpiringList] = useState<RzpExpiringSubscription[]>([])
    const [failedList, setFailedList]     = useState<RzpFailedSubscription[]>([])
    const [plans, setPlans]                = useState<RzpPlan[]>([])
    const [createSubForm, setCreateSubForm] = useState({
        plan_id: '', total_count: '12', quantity: '1',
        customer_notify: true, note_name: '', note_email: '',
    })
    const [createSubResult, setCreateSubResult] = useState<RzpCreatedSubscription | null>(null)

    // ── Telegram MCP ──────────────────────────────────────────────────────────
    const [tgSubTab, setTgSubTab]           = useState<'send' | 'alert' | 'botinfo' | 'updates'>('send')
    const [tgLoading, setTgLoading]         = useState(false)
    const [tgError, setTgError]             = useState('')
    const [tgBotInfo, setTgBotInfo]         = useState<TelegramBotInfo | null>(null)
    const [tgUpdates, setTgUpdates]         = useState<TelegramUpdatesResult | null>(null)
    const [tgSendForm, setTgSendForm]       = useState({ chat_id: '', message: '', parse_mode: 'Markdown' })
    const [tgSendResult, setTgSendResult]   = useState<any>(null)
    const [tgAlertForm, setTgAlertForm]     = useState({ chat_id: '', amount: '', customer_name: '', plan: '', payment_id: '' })
    const [tgAlertResult, setTgAlertResult] = useState<any>(null)

    // ── Typeform MCP ───────────────────────────────────────────────────────────
    const [tfSubTab, setTfSubTab]                   = useState<'forms' | 'fields' | 'responses'>('forms')
    const [tfLoading, setTfLoading]                 = useState(false)
    const [tfError, setTfError]                     = useState('')
    const [tfForms, setTfForms]                     = useState<TypeformForm[]>([])
    const [tfSelectedFormId, setTfSelectedFormId]   = useState('')
    const [tfFields, setTfFields]                   = useState<TypeformField[]>([])
    const [tfResponses, setTfResponses]             = useState<TypeformResponse[]>([])
    const [tfPageSize, setTfPageSize]               = useState(20)
    const [tfExpandedResponse, setTfExpandedResponse] = useState<string | null>(null)

    // ── Tally MCP ──────────────────────────────────────────────────────────────
    const [tallySubTab, setTallySubTab]   = useState<'overview' | 'ledgers' | 'vouchers' | 'pnl' | 'balance' | 'trial' | 'outstanding' | 'stock'>('overview')
    const [tallyLoading, setTallyLoading] = useState(false)
    const [tallyError, setTallyError]     = useState('')
    const [tallyCompany, setTallyCompany] = useState<any>(null)
    const [tallyLedgers, setTallyLedgers] = useState<any[]>([])
    const [tallyVouchers, setTallyVouchers] = useState<any[]>([])
    const [tallyPnl, setTallyPnl]         = useState<any>({ period: 'monthly', from: '', to: '' })
    const [tallyBalance, setTallyBalance] = useState<any>(null)
    const [tallyTrial, setTallyTrial]     = useState<any>(null)
    const [tallyOutstanding, setTallyOutstanding] = useState<any>(null)
    const [tallyStock, setTallyStock]     = useState<any>(null)
    const [tallyLedgerGroup, setTallyLedgerGroup] = useState('')
    const [tallyFromDate, setTallyFromDate]       = useState('')
    const [tallyToDate, setTallyToDate]           = useState('')
    const [tallyVoucherType, setTallyVoucherType] = useState('')

    // ── Zoho CRM MCP ─────────────────────────────────────────────────────────
    const [zohoTab, setZohoTab]         = useState<'leads' | 'deals' | 'contacts'>('leads')
    const [zohoLoading, setZohoLoading] = useState(false)
    const [zohoError, setZohoError]     = useState('')
    const [zohoLeads, setZohoLeads]     = useState<any[]>([])
    const [zohoDeals, setZohoDeals]     = useState<any[]>([])
    const [zohoContacts, setZohoContacts] = useState<any[]>([])

    // ── Handlers & Actions ────────────────────────────────────────────────────
    async function loadPayments(filterStatus?: string) {
        setPaymentsLoading(true)
        try {
            const result = await getPayments({ max_records: 20, filter_status: filterStatus || undefined })
            setPayments(result.records)
        } catch (e) { console.error(e) }
        finally { setPaymentsLoading(false) }
    }

    async function loadRzpToday() {
        setRzpLoading(true); setRzpError('')
        try { setRzpToday(await getRazorpayTodaysPayments()) }
        catch (e: any) { setRzpError(e.message || 'Failed') }
        finally { setRzpLoading(false) }
    }

    async function loadSubOverview() {
        setSubLoading(true); setSubError('')
        try {
            const [summary, revenue] = await Promise.all([
                getSubscriptionSummary(50), getSubscriptionRevenue(),
            ])
            setSubSummary(summary); setSubRevenue(revenue)
        } catch (e: any) { setSubError(e.message || 'Failed to load subscription data') }
        finally { setSubLoading(false) }
    }

    async function loadTgBotInfo() {
        setTgLoading(true); setTgError('')
        try { setTgBotInfo(await getBotInfo()) }
        catch (e: any) { setTgError(e.message || 'Failed to load bot info') }
        finally { setTgLoading(false) }
    }

    async function loadTfForms() {
        setTfLoading(true); setTfError('')
        try { setTfForms(await listTypeforms()) }
        catch (e: any) { setTfError(e.message || 'Failed to load Typeform forms') }
        finally { setTfLoading(false) }
    }

    async function loadTallyOverview() {
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall('/tally/company')
            setTallyCompany(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load Tally company data') }
        finally { setTallyLoading(false) }
    }

    async function loadZohoLeads() {
        setZohoLoading(true); setZohoError('')
        try { setZohoLeads(await apiCall('/zoho/leads')) }
        catch (e: any) { setZohoError(e.message || 'Failed to load Zoho leads') }
        finally { setZohoLoading(false) }
    }

    const handleSave = async () => {
        try {
            await apiCall('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) })
            setUser({ ...user, name }); setIsEditing(false); setSaveMsg('Saved!')
            setTimeout(() => setSaveMsg(''), 2000)
        } catch { setSaveMsg('Failed to save') }
    }

    const handleToggleWorkflow = async (wfId: string) => {
        try {
            const updated = await apiCall(`/workflows/${wfId}/toggle`, { method: 'PATCH' })
            setWorkflows(workflows.map(w => w.id === wfId ? updated : w))
        } catch {}
    }

    const handleDisconnect = async (appName: string) => {
        try { 
            await apiCall(`/apps/${appName}`, { method: 'DELETE' })
            setApps(apps.filter(a => a.app_name !== appName)) 
        } catch {}
    }

    // ── Init ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!getToken()) { 
            setTimeout(() => { window.location.href = '/login' }, 500)
            return 
        }
        loadAll()
    }, [])

    async function loadAll() {
        setLoading(true)
        try {
            const [u, a, w, d] = await Promise.all([
                apiCall('/auth/me'), apiCall('/apps/'),
                apiCall('/workflows/'), apiCall('/dashboard/'),
            ])
            setUser(u); setName(u.name); setApps(a); setWorkflows(w); setDashboard(d)
        } catch (e) { console.error(e) }
        finally { setTimeout(() => setLoading(false), 800) }
    }

    useEffect(() => {
        if (activeTab === 'payments')      loadPayments()
        if (activeTab === 'razorpay')      loadRzpToday()
        if (activeTab === 'subscriptions') loadSubOverview()
        if (activeTab === 'telegram')      loadTgBotInfo()
        if (activeTab === 'typeform')      loadTfForms()
        if (activeTab === 'tally')          loadTallyOverview()
        if (activeTab === 'zoho')          loadZohoLeads()
    }, [activeTab])

    // ── NAV items ──────────────────────────────────────────────────────────────
    const navItems = [
        { id: 'overview',       icon: User,        label: 'Overview' },
        { id: 'apps',           icon: Wallet,      label: 'Connected Apps' },
        { id: 'workflows',      icon: RefreshCw,   label: 'Workflows' },
        { id: 'history',        icon: Clock,       label: 'Execution History' },
        { id: 'payments',       icon: Database,    label: 'Payments (Airtable)' },
        { id: 'razorpay',       icon: IndianRupee, label: 'Razorpay', badge: { text: 'MCP', color: '#2B6CB0' } },
        { id: 'subscriptions',  icon: Repeat,      label: 'Subscriptions', badge: { text: 'MCP', color: '#0e7490' } },
        { id: 'telegram',       icon: Bot,         label: 'Telegram', badge: { text: 'MCP', color: '#0088cc' } },
        { id: 'typeform',       icon: Layout,      label: 'Typeform', badge: { text: 'MCP', color: '#262627' } },
        { id: 'tally',          icon: Database,    label: 'TallyPrime', badge: { text: 'MCP', color: '#1d4ed8' } },
        { id: 'zoho',           icon: Layout,      label: 'Zoho CRM', badge: { text: 'MCP', color: '#E42527' } },
        { id: 'billing',        icon: CreditCard,  label: 'Billing & Plans' },
    ]

    if (loading) return (
        <div className="profile-page flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-zinc-400 font-light">Loading profile details...</div>
        </div>
    )

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">

                {/* ── Sidebar ── */}
                <aside className="profile-sidebar">
                    <motion.div className="profile-card profile-user" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                        <h2 className="profile-name">{user?.name}</h2>
                        <span className="profile-email">{user?.email}</span>
                        <div className="profile-badge"><Zap size={12} fill="currentColor" />{user?.plan?.toUpperCase()} Plan</div>
                    </motion.div>

                    <nav className="profile-card profile-nav">
                        {navItems.map(({ id, icon: Icon, label, badge }: any) => (
                            <button key={id} className={`profile-nav-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                                <Icon className="profile-nav-icon" />
                                {label}
                                {badge && <span className="nav-badge" style={{ background: badge.color, color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 4, marginLeft: 'auto' }}>{badge.text}</span>}
                            </button>
                        ))}
                        <div style={{ height: 1, background: '#f3f4f6', margin: '8px 0' }} />
                        <button className="profile-nav-btn text-red-500" onClick={() => { logout(); window.location.href = '/login' }}>
                            <LogOut className="profile-nav-icon" /> Log Out
                        </button>
                    </nav>
                </aside>

                <main className="profile-content">

                    {/* ── OVERVIEW ── */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Overview</h1>
                            <div className="profile-stats grid grid-cols-2 gap-4 mb-6">
                                <div className="stat-card p-6 bg-white border border-zinc-100 rounded-2xl">
                                    <span className="text-zinc-400 text-sm">Total Workflows</span>
                                    <div className="text-2xl font-semibold mt-1">{dashboard?.total_workflows || 0}</div>
                                </div>
                                <div className="stat-card p-6 bg-white border border-zinc-100 rounded-2xl">
                                    <span className="text-zinc-400 text-sm">Total Executions</span>
                                    <div className="text-2xl font-semibold mt-1">{dashboard?.total_executions || 0}</div>
                                </div>
                            </div>
                            <div className="profile-card p-8 bg-white border border-zinc-100 rounded-3xl">
                                <h3 className="text-lg font-medium mb-6">Account Details</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Name</span>
                                        <input className="text-sm font-medium bg-zinc-50 p-2 rounded-lg border-none" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Email</span>
                                        <div className="text-sm font-medium p-2">{user?.email}</div>
                                    </div>
                                </div>
                                <button className="mt-8 px-6 py-2 bg-black text-white rounded-full text-xs" onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
                                    {isEditing ? 'Save Changes' : 'Edit Profile'}
                                </button>
                                {saveMsg && <p className="text-green-500 text-xs mt-2">{saveMsg}</p>}
                            </div>
                        </motion.div>
                    )}

                    {/* ── WORKFLOWS ── */}
                    {activeTab === 'workflows' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="profile-section-title m-0">My Workflows</h1>
                                <button className="px-4 py-2 bg-black text-white rounded-full text-xs flex items-center gap-2" onClick={() => window.location.href = '/builder'}>
                                    <Plus size={14} /> New Workflow
                                </button>
                            </div>
                            {workflows.length === 0 ? (
                                <EmptyState 
                                    title="Your canvas is empty" 
                                    desc="Start by creating a simple automation to connect your tools." 
                                    onAction={() => window.location.href = '/builder'} 
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {workflows.map(wf => (
                                        <div key={wf.id} className="p-4 border border-zinc-100 rounded-2xl flex justify-between items-center bg-white">
                                            <div>
                                                <div className="font-medium text-sm">{wf.name}</div>
                                                <div className="text-xs text-zinc-400 mt-1">Runs: {wf.run_count}</div>
                                            </div>
                                            <button onClick={() => handleToggleWorkflow(wf.id)} className={`px-4 py-1 rounded-full text-xs ${wf.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-zinc-50 text-zinc-400'}`}>
                                                {wf.status === 'active' ? 'Active' : 'Paused'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── HISTORY ── */}
                    {activeTab === 'history' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Execution History</h1>
                            <EmptyState 
                                title="Quiet for now"
                                desc="Your execution logs will appear here once your workflows start running."
                            />
                        </motion.div>
                    )}

                    {/* ── APPS ── */}
                    {activeTab === 'apps' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="profile-section-title m-0">Connected Apps</h1>
                            </div>
                            {apps.length === 0 ? (
                                <EmptyState 
                                    title="No apps connected yet" 
                                    desc="Connect your first tool like Razorpay or Telegram to build automated flows." 
                                    onAction={() => window.location.href = '/builder'} 
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {apps.map(app => (
                                        <div key={app.id} className="p-4 border border-zinc-100 rounded-2xl flex justify-between items-center bg-white">
                                            <div className="font-medium text-sm">{app.app_name}</div>
                                            <button onClick={() => handleDisconnect(app.app_name)} className="text-zinc-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── PAYMENTS (Airtable) ── */}
                    {activeTab === 'payments' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Payments (Airtable)</h1>
                            {payments.length === 0 ? (
                                <EmptyState title="No payments found" desc="Your processing history from Airtable will appear here." />
                            ) : (
                                <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
                                    <SkeletonRow count={3} columns={4} />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── RAZORPAY ── */}
                    {activeTab === 'razorpay' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Razorpay MCP</h1>
                            {rzpToday ? (
                                <div className="bg-white p-6 border border-zinc-100 rounded-2xl">
                                    <div className="text-zinc-400 text-xs uppercase mb-2">Today's Revenue</div>
                                    <div className="text-xl font-bold">{rzpToday.total_amount}</div>
                                </div>
                            ) : (
                                <EmptyState title="No transactions today" desc="Sync your Razorpay account to see real-time revenue stats." />
                            )}
                        </motion.div>
                    )}

                    {/* ── SUBSCRIPTIONS ── */}
                    {activeTab === 'subscriptions' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Subscriptions</h1>
                            {!subSummary ? (
                                <EmptyState title="No active plans" desc="Manage your recurring customer billing through the Razorpay MCP." />
                            ) : (
                                <div className="stat-card bg-white p-6 rounded-2xl border border-zinc-100">
                                    <div className="text-sm text-zinc-500">Active Subscriptions</div>
                                    <div className="text-2xl font-bold">{subSummary.active}</div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TELEGRAM ── */}
                    {activeTab === 'telegram' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Telegram Bot</h1>
                            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 text-center">
                                <Bot size={32} className="mx-auto mb-4 text-zinc-300" />
                                <h3 className="font-medium">Bot Integration Active</h3>
                                <p className="text-zinc-500 text-sm mt-2">Use the builder to trigger Telegram alerts for your workflows.</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── TYPEFORM ── */}
                    {activeTab === 'typeform' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Typeform</h1>
                            {tfForms.length === 0 ? (
                                <EmptyState title="No forms found" desc="Connect Typeform to start processing survey responses automatically." />
                            ) : (
                                <div className="grid gap-2">
                                    {tfForms.map(f => <div key={f.id} className="p-3 bg-white rounded-xl border border-zinc-100 text-sm">{f.title}</div>)}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── TALLY ── */}
                    {activeTab === 'tally' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">TallyPrime</h1>
                            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 text-center">
                                <Database size={32} className="mx-auto mb-4 text-zinc-300" />
                                <p className="text-zinc-500 text-sm">Tally ERP integration is live. Syncing ledger data...</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ── ZOHO ── */}
                    {activeTab === 'zoho' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Zoho CRM</h1>
                            <div className="p-6 bg-white rounded-2xl border border-zinc-100">
                                <pre className="text-xs text-zinc-500 font-mono overflow-auto">{JSON.stringify(zohoLeads, null, 2)}</pre>
                            </div>
                        </motion.div>
                    )}

                    <Footer />
                </main>
            </div>
        </div>
    )
}
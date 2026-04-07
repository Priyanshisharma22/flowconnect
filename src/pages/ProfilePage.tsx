import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, CreditCard, Shield, Wallet, LogOut, Zap, TrendingUp, Clock, Plus, Trash2, RefreshCw, Database, FileText, Search, Send, MessageSquare, AlertCircle, CheckCircle, ExternalLink, BarChart2, IndianRupee, Repeat, PauseCircle, PlayCircle, XCircle, Bot, Layout } from 'lucide-react'

import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
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
        customer_phone: '', product_name: '', company_name: 'FlowConnect',
        send_email: true, send_whatsapp: true,
    })
    const [fullResult, setFullResult]       = useState<any>(null)
    const [fullLoading, setFullLoading]     = useState(false)
    const [waForm, setWaForm]               = useState({ phone: '', invoice_number: '', amount: '', customer_name: '', company_name: 'FlowConnect', pdf_path: '' })
    const [waResult, setWaResult]           = useState<any>(null)
    const [waLoading, setWaLoading]         = useState(false)
    const [emailForm, setEmailForm]         = useState({ customer_email: '', customer_name: '', invoice_number: '', amount: '', company_name: 'FlowConnect', pdf_path: '' })
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
    const [subTab, setSubTab]             = useState<'overview' | 'list' | 'lookup' | 'expiring' | 'failed' | 'plans' | 'revenue' | 'create'>('overview')
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
    const [plans, setPlans]               = useState<RzpPlan[]>([])
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

    // ── Init ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!getToken()) { window.location.href = '/login'; return }
        loadAll()
    }, [])

    useEffect(() => {
        if (activeTab === 'payments')      loadPayments()
        if (activeTab === 'instamojo')     loadInstaPayments()
        if (activeTab === 'razorpay')      loadRzpToday()
        if (activeTab === 'subscriptions') loadSubOverview()
        if (activeTab === 'telegram')      loadTgBotInfo()
        if (activeTab === 'typeform')      loadTfForms()
        if (activeTab === 'tally')         loadTallyOverview()
        if (activeTab === 'zoho')          loadZohoLeads()
    }, [activeTab])

    // ── Generic loaders ────────────────────────────────────────────────────────
    async function loadAll() {
        setLoading(true)
        try {
            const [u, a, w, d] = await Promise.all([
                apiCall('/auth/me'), apiCall('/apps/'),
                apiCall('/workflows/'), apiCall('/dashboard/'),
            ])
            setUser(u); setName(u.name); setApps(a); setWorkflows(w); setDashboard(d)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    async function loadPayments(filterStatus?: string) {
        setPaymentsLoading(true)
        try {
            const result = await getPayments({ max_records: 20, filter_status: filterStatus || undefined })
            setPayments(result.records)
        } catch (e) { console.error(e) }
        finally { setPaymentsLoading(false) }
    }

    async function loadInstaPayments() {
        setInstaLoading(true); setInstaError('')
        try {
            const [pd, ld, sd] = await Promise.all([
                getInstamojoPayments(50), getInstamojoLinks(20), getInstamojoDailySummary(),
            ])
            setInstaPayments(pd.payments); setInstaLinks(ld.links); setInstaSummary(sd)
        } catch (e: any) { setInstaError(e.message || 'Failed to load Instamojo data') }
        finally { setInstaLoading(false) }
    }

    // ── Razorpay payment loaders ───────────────────────────────────────────────
    async function loadRzpToday() {
        setRzpLoading(true); setRzpError('')
        try { setRzpToday(await getRazorpayTodaysPayments()) }
        catch (e: any) { setRzpError(e.message || 'Failed') }
        finally { setRzpLoading(false) }
    }
    async function loadRzpRange() {
        if (!rzpFromDate || !rzpToDate) return
        setRzpLoading(true); setRzpError('')
        try { setRzpRange(await getRazorpayPaymentsByRange(rzpFromDate, rzpToDate)) }
        catch (e: any) { setRzpError(e.message || 'Failed') }
        finally { setRzpLoading(false) }
    }
    async function loadRzpDetail() {
        if (!rzpDetailId.trim()) return
        setRzpLoading(true); setRzpError(''); setRzpDetail(null)
        try { setRzpDetail(await getRazorpayPaymentDetails(rzpDetailId.trim())) }
        catch (e: any) { setRzpError(e.message || 'Not found') }
        finally { setRzpLoading(false) }
    }
    async function loadRzpStats() {
        setRzpLoading(true); setRzpError('')
        try { setRzpStats(await getRazorpayPaymentSummary(rzpStatsDays)) }
        catch (e: any) { setRzpError(e.message || 'Failed') }
        finally { setRzpLoading(false) }
    }

    // ── Subscription loaders ───────────────────────────────────────────────────
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
    async function loadSubList() {
        setSubLoading(true); setSubError('')
        try {
            const res = await getAllSubscriptions(subListCount, subListStatus || undefined)
            setSubList(res.subscriptions)
        } catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubLoading(false) }
    }
    async function loadSubDetail() {
        if (!subLookupId.trim()) return
        setSubLoading(true); setSubError(''); setSubDetail(null)
        try { setSubDetail(await getSubscriptionById(subLookupId.trim())) }
        catch (e: any) { setSubError(e.message || 'Not found') }
        finally { setSubLoading(false) }
    }
    async function loadSubInvoices(subId: string) {
        setSubInvoiceLoading(true)
        try { setSubInvoices(await getSubscriptionInvoices(subId)) }
        catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubInvoiceLoading(false) }
    }
    async function loadExpiring() {
        setSubLoading(true); setSubError('')
        try {
            const res = await getExpiringSubscriptions(expiringDays)
            setExpiringList(res.subscriptions)
        } catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubLoading(false) }
    }
    async function loadFailed() {
        setSubLoading(true); setSubError('')
        try {
            const res = await getFailedSubscriptions(20)
            setFailedList(res.subscriptions)
        } catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubLoading(false) }
    }
    async function loadPlans() {
        setSubLoading(true); setSubError('')
        try { setPlans(await getAllPlans(20)) }
        catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubLoading(false) }
    }

    // ── Subscription actions ───────────────────────────────────────────────────
    async function handleSubAction(fn: () => Promise<{ id: string; status: string; message: string }>) {
        setSubLoading(true); setSubActionMsg(null)
        try {
            const res = await fn()
            setSubActionMsg({ text: `✅ ${res.message} (${res.id} → ${res.status})`, ok: true })
            await loadSubList()
        } catch (e: any) {
            setSubActionMsg({ text: `❌ ${e.message}`, ok: false })
        } finally { setSubLoading(false) }
    }
    async function handleCreateSub() {
        if (!createSubForm.plan_id || !createSubForm.total_count) return
        setSubLoading(true); setSubError(''); setCreateSubResult(null)
        try {
            const notes: Record<string, string> = {}
            if (createSubForm.note_name)  notes.customer_name  = createSubForm.note_name
            if (createSubForm.note_email) notes.customer_email = createSubForm.note_email
            const res = await createSubscription({
                plan_id: createSubForm.plan_id,
                total_count: parseInt(createSubForm.total_count) || 12,
                quantity: parseInt(createSubForm.quantity) || 1,
                customer_notify: createSubForm.customer_notify,
                notes: Object.keys(notes).length ? notes : undefined,
            })
            setCreateSubResult(res)
        } catch (e: any) { setSubError(e.message || 'Failed') }
        finally { setSubLoading(false) }
    }

    // ── Telegram loaders & handlers ────────────────────────────────────────────
    async function loadTgBotInfo() {
        setTgLoading(true); setTgError('')
        try { setTgBotInfo(await getBotInfo()) }
        catch (e: any) { setTgError(e.message || 'Failed to load bot info') }
        finally { setTgLoading(false) }
    }
    async function loadTgUpdates() {
        setTgLoading(true); setTgError('')
        try { setTgUpdates(await getUpdates()) }
        catch (e: any) { setTgError(e.message || 'Failed to load updates') }
        finally { setTgLoading(false) }
    }
    async function handleTgSend() {
        if (!tgSendForm.chat_id || !tgSendForm.message) return
        setTgLoading(true); setTgSendResult(null); setTgError('')
        try {
            const result = await sendTelegramMessage(tgSendForm.chat_id, tgSendForm.message, tgSendForm.parse_mode || undefined)
            setTgSendResult(result)
        } catch (e: any) { setTgSendResult({ error: e.message }) }
        finally { setTgLoading(false) }
    }
    async function handleTgAlert() {
        if (!tgAlertForm.chat_id || !tgAlertForm.customer_name) return
        setTgLoading(true); setTgAlertResult(null); setTgError('')
        try {
            const result = await sendTelegramPaymentAlert(
                tgAlertForm.chat_id,
                parseFloat(tgAlertForm.amount) || 0,
                tgAlertForm.customer_name,
                tgAlertForm.plan       || undefined,
                tgAlertForm.payment_id || undefined,
            )
            setTgAlertResult(result)
        } catch (e: any) { setTgAlertResult({ error: e.message }) }
        finally { setTgLoading(false) }
    }

    // ── Typeform loaders & handlers ────────────────────────────────────────────
    async function loadTfForms() {
        setTfLoading(true); setTfError('')
        try { setTfForms(await listTypeforms()) }
        catch (e: any) { setTfError(e.message || 'Failed to load Typeform forms') }
        finally { setTfLoading(false) }
    }
    async function loadTfFields() {
        if (!tfSelectedFormId.trim()) return
        setTfLoading(true); setTfError(''); setTfFields([])
        try { setTfFields(await getTypeformFields(tfSelectedFormId.trim())) }
        catch (e: any) { setTfError(e.message || 'Failed to load fields') }
        finally { setTfLoading(false) }
    }
    async function loadTfResponses() {
        if (!tfSelectedFormId.trim()) return
        setTfLoading(true); setTfError(''); setTfResponses([]); setTfExpandedResponse(null)
        try { setTfResponses(await getTypeformResponses(tfSelectedFormId.trim(), tfPageSize)) }
        catch (e: any) { setTfError(e.message || 'Failed to load responses') }
        finally { setTfLoading(false) }
    }
    function handleSelectTfForm(id: string) {
        setTfSelectedFormId(id)
        setTfFields([])
        setTfResponses([])
        setTfExpandedResponse(null)
        setTfError('')
    }

    // ── Tally MCP loaders ──────────────────────────────────────────────────────
    async function loadTallyOverview() {
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall('/tally/company')
            setTallyCompany(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load Tally company data') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyLedgers() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/ledgers?from=${tallyFromDate}&to=${tallyToDate}&group=${tallyLedgerGroup}`)
            setTallyLedgers(result.ledgers || result || [])
        } catch (e: any) { setTallyError(e.message || 'Failed to load ledgers') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyVouchers() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/vouchers?from=${tallyFromDate}&to=${tallyToDate}&type=${tallyVoucherType}`)
            setTallyVouchers(result.vouchers || result || [])
        } catch (e: any) { setTallyError(e.message || 'Failed to load vouchers') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyReports() {
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/pnl?period=${tallyPnl.period}&from=${tallyPnl.from}&to=${tallyPnl.to}`)
            setTallyPnl((prev: any) => ({ ...prev, ...result }))
        } catch (e: any) { setTallyError(e.message || 'Failed to load P&L') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyBalance() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/balance?from=${tallyFromDate}&to=${tallyToDate}`)
            setTallyBalance(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load balance sheet') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyTrial() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/trial?from=${tallyFromDate}&to=${tallyToDate}`)
            setTallyTrial(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load trial balance') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyOutstanding() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/outstanding?from=${tallyFromDate}&to=${tallyToDate}`)
            setTallyOutstanding(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load outstanding') }
        finally { setTallyLoading(false) }
    }
    async function loadTallyStock() {
        if (!tallyFromDate || !tallyToDate) return
        setTallyLoading(true); setTallyError('')
        try {
            const result = await apiCall(`/tally/stock?from=${tallyFromDate}&to=${tallyToDate}`)
            setTallyStock(result)
        } catch (e: any) { setTallyError(e.message || 'Failed to load stock summary') }
        finally { setTallyLoading(false) }
    }

    // ── Zoho CRM loaders ──────────────────────────────────────────────────────
    async function getZohoLeads(): Promise<any[]> {
        return apiCall('/zoho/leads')
    }
    async function getZohoDeals(): Promise<any[]> {
        return apiCall('/zoho/deals')
    }
    async function getZohoContacts(): Promise<any[]> {
        return apiCall('/zoho/contacts')
    }

    async function loadZohoLeads() {
        setZohoLoading(true); setZohoError('')
        try { setZohoLeads(await getZohoLeads()) }
        catch (e: any) { setZohoError(e.message || 'Failed to load Zoho leads') }
        finally { setZohoLoading(false) }
    }
    async function loadZohoDeals() {
        setZohoLoading(true); setZohoError('')
        try { setZohoDeals(await getZohoDeals()) }
        catch (e: any) { setZohoError(e.message || 'Failed to load Zoho deals') }
        finally { setZohoLoading(false) }
    }
    async function loadZohoContacts() {
        setZohoLoading(true); setZohoError('')
        try { setZohoContacts(await getZohoContacts()) }
        catch (e: any) { setZohoError(e.message || 'Failed to load Zoho contacts') }
        finally { setZohoLoading(false) }
    }

    // ── Invoice handlers ───────────────────────────────────────────────────────
    async function handleFullFlow() {
        if (!fullForm.payment_id || !fullForm.amount || !fullForm.customer_name || !fullForm.customer_email || !fullForm.customer_phone) return
        setFullLoading(true); setFullResult(null)
        try {
            const result = await processPaymentInvoice(fullForm)
            setFullResult(result)
            if (result.success && result.invoice) {
                const entry: GeneratedInvoice = {
                    invoice_number: result.invoice.invoice_number,
                    pdf_url: result.invoice.pdf_url,
                    amount: result.invoice.amount || `₹${fullForm.amount}`,
                    customer_name: fullForm.customer_name,
                    customer_email: fullForm.customer_email,
                    customer_phone: fullForm.customer_phone,
                    whatsapp_status: fullForm.send_whatsapp ? (result.whatsapp?.success ? 'sent' : 'failed') : 'skipped',
                    email_status: fullForm.send_email ? (result.email?.success ? 'sent' : 'failed') : 'skipped',
                    created_at: new Date().toISOString(),
                }
                setInvoiceHistory(prev => [entry, ...prev])
            }
        } catch (e: any) { setFullResult({ error: e.message }) }
        finally { setFullLoading(false) }
    }
    async function handleWAOnly() {
        setWaLoading(true); setWaResult(null)
        try {
            const result = await sendWhatsAppInvoice({
                phone: waForm.phone, invoice_number: waForm.invoice_number,
                amount: parseFloat(waForm.amount), customer_name: waForm.customer_name,
                company_name: waForm.company_name || 'FlowConnect',
                pdf_path: waForm.pdf_path || undefined,
            })
            setWaResult(result)
        } catch (e: any) { setWaResult({ error: e.message }) }
        finally { setWaLoading(false) }
    }
    async function handleEmailOnly() {
        setEmailLoading(true); setEmailResult(null)
        try {
            const result = await sendEmailInvoice({
                customer_email: emailForm.customer_email, customer_name: emailForm.customer_name,
                invoice_number: emailForm.invoice_number, amount: parseFloat(emailForm.amount),
                company_name: emailForm.company_name || 'FlowConnect', pdf_path: emailForm.pdf_path,
            })
            setEmailResult(result)
        } catch (e: any) { setEmailResult({ error: e.message }) }
        finally { setEmailLoading(false) }
    }
    async function handleDirectWA() {
        setDirectLoading(true); setDirectResult(null)
        try {
            const result = await sendWhatsAppDirect({ phone: directForm.phone, message: directForm.message })
            setDirectResult(result)
        } catch (e: any) { setDirectResult({ error: e.message }) }
        finally { setDirectLoading(false) }
    }

    // ── Instamojo handlers ─────────────────────────────────────────────────────
    async function handleInstaSearch() {
        if (!instaSearch.trim()) return
        setInstaLoading(true)
        try { setInstaSearchResult((await searchInstamojoPayments(instaSearch.trim())).payments) }
        catch (e: any) { setInstaError(e.message) }
        finally { setInstaLoading(false) }
    }
    async function handleNotifyComplete() {
        if (!notifyPaymentId.trim()) return
        setNotifyLoading(true); setNotifyResult(null)
        try { setNotifyResult(await notifyInstamojoPaymentComplete(notifyPaymentId.trim())) }
        catch (e: any) { setNotifyResult({ error: e.message }) }
        finally { setNotifyLoading(false) }
    }
    async function handleCreateLink() {
        if (!createForm.purpose || !createForm.amount || !createForm.name) return
        setCreateLoading(true); setCreateResult(null)
        try {
            setCreateResult(await createInstamojoLink({
                purpose: createForm.purpose, amount: parseFloat(createForm.amount),
                name: createForm.name, email: createForm.email || undefined,
                phone: createForm.phone || undefined,
            }))
        } catch (e: any) { setCreateResult({ error: e.message }) }
        finally { setCreateLoading(false) }
    }
    async function handleSendInstaWASummary() {
        if (!instaWaPhone.trim()) return
        setInstaWaLoading(true); setInstaWaResult(null)
        try { setInstaWaResult(await sendInstamojoDailySummaryWhatsApp(instaWaPhone.trim())) }
        catch (e: any) { setInstaWaResult({ error: e.message }) }
        finally { setInstaWaLoading(false) }
    }

    // ── Google Forms handlers ──────────────────────────────────────────────────
    async function handleLoadFormResponses() {
        if (!formIdInput.trim()) return
        setFormsLoading(true); setFormsError(''); setFormResponses([]); setFormTitle(''); setSelectedResponse(null)
        try {
            const result = await getFormResponses(formIdInput.trim(), 50)
            setFormId(formIdInput.trim()); setFormTitle(result.form_title || formIdInput.trim()); setFormResponses(result.responses || [])
        } catch (e: any) { setFormsError(e.message || 'Failed') }
        finally { setFormsLoading(false) }
    }
    async function handleLoadLatest() {
        if (!formIdInput.trim()) return
        setFormsLoading(true); setFormsError('')
        try {
            const result = await getLatestResponse(formIdInput.trim())
            setFormId(formIdInput.trim())
            if (result.message) { setFormResponses([]); setFormsError(result.message) }
            else { setFormResponses([result]); setSelectedResponse(result) }
        } catch (e: any) { setFormsError(e.message || 'Failed') }
        finally { setFormsLoading(false) }
    }
    async function handleProcessSubmission() {
        setProcessLoading(true); setProcessResult(null)
        try { setProcessResult(await processFormSubmission({ ...processForm, spreadsheet_id: processForm.spreadsheet_id || undefined })) }
        catch (e: any) { setProcessResult({ error: e.message }) }
        finally { setProcessLoading(false) }
    }
    async function handleSyncToSheets() {
        if (!formId || !syncSheetId) return
        setSyncLoading(true); setSyncResult(null)
        try { setSyncResult(await syncResponsesToSheets({ form_id: formId, spreadsheet_id: syncSheetId, sheet_name: syncSheetName || 'Form Responses' })) }
        catch (e: any) { setSyncResult({ error: e.message }) }
        finally { setSyncLoading(false) }
    }

    // ── Account handlers ───────────────────────────────────────────────────────
    async function handleSave() {
        try {
            await apiCall('/auth/me', { method: 'PUT', body: JSON.stringify({ name }) })
            setUser({ ...user, name }); setIsEditing(false); setSaveMsg('Saved!')
            setTimeout(() => setSaveMsg(''), 2000)
        } catch { setSaveMsg('Failed to save') }
    }
    async function handleDisconnect(appName: string) {
        try { await apiCall(`/apps/${appName}`, { method: 'DELETE' }); setApps(apps.filter(a => a.app_name !== appName)) } catch {}
    }
    async function handleToggleWorkflow(wfId: string) {
        try {
            const updated = await apiCall(`/workflows/${wfId}/toggle`, { method: 'PATCH' })
            setWorkflows(workflows.map(w => w.id === wfId ? updated : w))
        } catch {}
    }

    // ── Shared UI helpers ──────────────────────────────────────────────────────
    const appIcons: any = {
        razorpay:      { icon: '💳', label: 'Razorpay',      color: '#2B6CB0' },
        whatsapp:      { icon: '📲', label: 'WhatsApp',      color: '#25D366' },
        google_sheets: { icon: '📊', label: 'Google Sheets', color: '#34A853' },
        zoho:          { icon: '🏢', label: 'Zoho CRM',      color: '#E42527' },
    }
    const airtableStatusColor: Record<string, { bg: string; text: string }> = {
        Success: { bg: '#dcfce7', text: '#16a34a' },
        Failed:  { bg: '#fee2e2', text: '#dc2626' },
        Pending: { bg: '#fef3c7', text: '#d97706' },
    }
    const instaStatusColor = (status: string) =>
        status === 'Credit' ? { bg: '#dcfce7', text: '#16a34a' } :
        status === 'Failed' ? { bg: '#fee2e2', text: '#dc2626' } :
                              { bg: '#f3f4f6', text: '#6b7280' }
    const rzpStatusColor = (status: string) =>
        status === 'captured' ? { bg: '#dcfce7', text: '#16a34a' } :
        status === 'failed'   ? { bg: '#fee2e2', text: '#dc2626' } :
        status === 'created'  ? { bg: '#fef3c7', text: '#d97706' } :
                                { bg: '#f3f4f6', text: '#6b7280' }

    const tfFieldTypeColor = (type: string) => {
        const map: Record<string, { bg: string; text: string }> = {
            short_text:    { bg: '#eff6ff', text: '#2563eb' },
            long_text:     { bg: '#f0fdf4', text: '#16a34a' },
            email:         { bg: '#fdf4ff', text: '#9333ea' },
            phone_number:  { bg: '#fff7ed', text: '#ea580c' },
            number:        { bg: '#ecfdf5', text: '#059669' },
            multiple_choice: { bg: '#fef3c7', text: '#d97706' },
            yes_no:        { bg: '#f0f9ff', text: '#0284c7' },
            rating:        { bg: '#fdf2f8', text: '#db2777' },
            date:          { bg: '#f5f3ff', text: '#7c3aed' },
            dropdown:      { bg: '#fff1f2', text: '#e11d48' },
        }
        return map[type] || { bg: '#f3f4f6', text: '#6b7280' }
    }

    function InvoiceResultBanner({ result }: { result: any }) {
        if (!result) return null
        const isError = !!result.error
        return (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: isError ? '#fee2e2' : '#dcfce7', color: isError ? '#dc2626' : '#15803d', fontSize: 13 }}>
                {isError ? `❌ ${result.error}` : (
                    result.invoice?.pdf_url ? (
                        <span>
                            ✅ Invoice <strong>{result.invoice.invoice_number}</strong> — {' '}
                            <a href={result.invoice.pdf_url} target="_blank" rel="noreferrer" style={{ color: '#ea580c', fontWeight: 600, textDecoration: 'none' }}>View PDF ↗</a>
                            {' '}| WA: {result.whatsapp?.success ? '✅' : result.whatsapp ? '❌' : '—'}
                            {' '}| Email: {result.email?.success ? '✅' : result.email ? '❌' : '—'}
                        </span>
                    ) : result.message_sid ? `✅ WhatsApp sent (SID: ${result.message_sid})`
                      : result.message_id  ? `✅ Email sent (ID: ${result.message_id})`
                      : '✅ Done'
                )}
            </div>
        )
    }

    function RzpPaymentTable({ payments: list }: { payments: RazorpayPayment[] }) {
        if (list.length === 0)
            return <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>No payments found.</div>
        return (
            <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 120px 150px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Contact / Email</span><span>Amount</span><span>Method</span><span>Status</span><span>Time / Date</span>
                </div>
                {list.map((p, i) => {
                    const cols = rzpStatusColor(p.status)
                    return (
                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 120px 150px', padding: '13px 20px', borderBottom: i < list.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{p.email || '—'}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{p.contact}</div>
                                <div style={{ fontSize: 10, color: '#c4c9d4', fontFamily: 'monospace', marginTop: 1 }}>{p.id}</div>
                            </div>
                            <span style={{ fontWeight: 700, color: '#2B6CB0' }}>{p.amount}</span>
                            <span style={{ textTransform: 'capitalize', color: '#6b7280', fontSize: 12 }}>{p.method}</span>
                            <span><span style={{ background: cols.bg, color: cols.text, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{p.status}</span></span>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{p.time || p.date || '—'}</span>
                        </div>
                    )
                })}
            </div>
        )
    }

    function SubRow({ sub, onAction }: { sub: RzpSubscription; onAction: () => void }) {
        const cols = subStatusColor(sub.status)
        const [actionLoading, setActionLoading] = useState(false)
        async function doAction(fn: () => Promise<any>) {
            setActionLoading(true)
            try { await fn(); onAction() }
            catch (e: any) { setSubActionMsg({ text: `❌ ${e.message}`, ok: false }) }
            finally { setActionLoading(false) }
        }
        return (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 130px 120px', alignItems: 'center', gap: 8 }}>
                    <div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{sub.id}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Plan: {sub.plan_id} · {sub.paid_count}/{sub.total_count} paid</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{sub.current_start} → {sub.current_end || 'ongoing'}</div>
                    </div>
                    <span><span style={{ background: cols.bg, color: cols.text, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{sub.status}</span></span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>Qty: {sub.quantity}</span>
                    <button onClick={() => { setSubInvoiceId(sub.id); loadSubInvoices(sub.id) }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileText size={11} /> Invoices
                    </button>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {sub.status === 'active' && (
                            <button title="Pause" onClick={() => doAction(() => pauseSubscription(sub.id))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fde68a', background: '#fef9c3', cursor: 'pointer' }} disabled={actionLoading}><PauseCircle size={14} color="#ca8a04" /></button>
                        )}
                        {sub.status === 'paused' && (
                            <button title="Resume" onClick={() => doAction(() => resumeSubscription(sub.id))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #86efac', background: '#dcfce7', cursor: 'pointer' }} disabled={actionLoading}><PlayCircle size={14} color="#16a34a" /></button>
                        )}
                        {(sub.status === 'active' || sub.status === 'authenticated') && (
                            <button title="Cancel" onClick={() => doAction(() => cancelSubscription(sub.id, false))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fee2e2', cursor: 'pointer' }} disabled={actionLoading}><XCircle size={14} color="#dc2626" /></button>
                        )}
                    </div>
                </div>
                        {subInvoiceId === sub.id && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e5e7eb' }}>
                                {subInvoiceLoading
                                    ? <div style={{ fontSize: 12, color: '#9ca3af' }}>Loading invoices…</div>
                                    : subInvoices.length === 0
                                        ? <div style={{ fontSize: 12, color: '#9ca3af' }}>No invoices found.</div>
                                        : (
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {subInvoices.map(inv => (
                                                    <div key={inv.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                                                        <div style={{ fontWeight: 600 }}>{inv.amount}</div>
                                                        <div style={{ color: '#9ca3af', marginTop: 2 }}>{inv.date} · {inv.status}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                            </div>
                        )}
            </div>
        )
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <p style={{ marginTop: 12, color: '#6b7280' }}>Loading your profile...</p>
            </div>
        </div>
    )

    // ── NAV items ──────────────────────────────────────────────────────────────
    const navItems = [
        { id: 'overview',       icon: User,        label: 'Overview' },
        { id: 'apps',           icon: Wallet,      label: 'Connected Apps' },
        { id: 'workflows',      icon: RefreshCw,   label: 'Workflows' },
        { id: 'payments',       icon: Database,    label: 'Payments (Airtable)' },
        { id: 'razorpay',       icon: IndianRupee, label: 'Razorpay',            badge: { text: 'MCP', color: '#2B6CB0' } },
        { id: 'subscriptions',  icon: Repeat,      label: 'Subscriptions',       badge: { text: 'MCP', color: '#0e7490' } },
        { id: 'telegram',       icon: Bot,         label: 'Telegram',            badge: { text: 'MCP', color: '#0088cc' } },
        { id: 'typeform',       icon: Layout,      label: 'Typeform',            badge: { text: 'MCP', color: '#262627' } },
        { id: 'forms',          icon: FileText,    label: 'Form Responses (MCP)' },
        { id: 'invoices',       icon: FileText,    label: 'Invoices (MCP)',       badge: { text: 'MCP', color: '#ea580c' } },
        { id: 'instamojo',      icon: CreditCard,  label: 'Instamojo',            badge: { text: 'NEW', color: '#4f46e5' } },
        { id: 'tally',          icon: Database,    label: 'TallyPrime',           badge: { text: 'MCP', color: '#1d4ed8' } },
        { id: 'billing',        icon: CreditCard,  label: 'Billing & Plans' },
        { id: 'security',       icon: Shield,      label: 'Security' },
    ]

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">

                {/* ── Sidebar ──────────────────────────────────────────────────── */}
                <aside className="profile-sidebar">
                    <motion.div className="profile-card profile-user" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                        <h2 className="profile-name">{user?.name}</h2>
                        <span className="profile-email">{user?.email}</span>
                        <div className="profile-badge"><Zap size={12} fill="currentColor" />{user?.plan?.toUpperCase()} Plan</div>
                    </motion.div>

                    <motion.nav className="profile-card profile-nav" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        {navItems.map(({ id, icon: Icon, label, badge }: any) => (
                            <button key={id} className={`profile-nav-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                                <Icon className="profile-nav-icon" />
                                {label}
                                {badge && (
                                    <span style={{ marginLeft: 'auto', background: badge.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                        {badge.text}
                                    </span>
                                )}
                            </button>
                        ))}
                        <div style={{ height: 1, background: 'var(--border-default)', margin: '8px 0' }} />
                        <button className="profile-nav-btn" style={{ color: 'var(--error-500)' }} onClick={() => { logout(); window.location.href = '/login' }}>
                            <LogOut className="profile-nav-icon" /> Log Out
                        </button>
                    </motion.nav>
                </aside>

                <main className="profile-content">

                    {/* ── OVERVIEW ─────────────────────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Overview</h1>
                            <div className="profile-stats">
                                <div className="stat-card"><span className="stat-label">Total Workflows</span><div className="stat-value">{dashboard?.total_workflows || 0}</div><div className="stat-trend trend-up"><TrendingUp size={14} />{dashboard?.active_workflows || 0} active</div></div>
                                <div className="stat-card"><span className="stat-label">Total Executions</span><div className="stat-value">{dashboard?.total_executions || 0}</div><div className="stat-trend trend-up"><TrendingUp size={14} />{dashboard?.successful_executions || 0} success</div></div>
                                <div className="stat-card"><span className="stat-label">Connected Apps</span><div className="stat-value">{dashboard?.connected_apps || 0}</div><div className="stat-trend"><Clock size={14} />Active integrations</div></div>
                            </div>
                            <div className="profile-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Account Details</h3>
                                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setIsEditing(!isEditing)}>{isEditing ? 'Cancel' : 'Edit Profile'}</button>
                                </div>
                                <form className="profile-form-grid">
                                    <div className="form-group"><label className="form-label">Full Name</label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} /></div>
                                    <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-input" value={user?.email || ''} disabled /></div>
                                    <div className="form-group"><label className="form-label">Plan</label><input type="text" className="form-input" value={user?.plan?.toUpperCase() || ''} disabled /></div>
                                    <div className="form-group"><label className="form-label">Member Since</label><input type="text" className="form-input" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} disabled /></div>
                                    {isEditing && (
                                        <div style={{ gridColumn: 'span 2', marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <button className="btn-primary" type="button" onClick={handleSave}>Save Changes</button>
                                            {saveMsg && <span style={{ color: '#16a34a', fontSize: 13 }}>{saveMsg}</span>}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CONNECTED APPS ───────────────────────────────────────── */}
                    {activeTab === 'apps' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>Connected Apps</h1>
                                <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => window.location.href = '/builder'}><Plus size={16} /> Connect App</button>
                            </div>
                            {apps.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 40 }}>
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>No apps connected yet.</p>
                                    <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.href = '/builder'}>Connect your first app</button>
                                </div>
                            ) : (
                                <div className="profile-card">
                                    {apps.map(app => {
                                        const info = appIcons[app.app_name] || { icon: '🔌', label: app.app_name, color: '#6366f1' }
                                        return (
                                            <div className="wallet-item" key={app.id}>
                                                <div className="wallet-info">
                                                    <div className="wallet-icon" style={{ fontSize: 24, background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10 }}>{info.icon}</div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{info.label}</div>
                                                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Connected {new Date(app.connected_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>✅ Active</span>
                                                </div>
                                                <button className="action-btn" title="Disconnect" onClick={() => handleDisconnect(app.app_name)}><Trash2 size={18} /></button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── WORKFLOWS ────────────────────────────────────────────── */}
                    {activeTab === 'workflows' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>My Workflows</h1>
                                <button className="btn-primary" style={{ padding: '10px 20px' }} onClick={() => window.location.href = '/builder'}><Plus size={16} /> New Workflow</button>
                            </div>
                            {workflows.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#9ca3af', fontSize: 14 }}>No workflows yet.</p></div>
                            ) : (
                                <div className="profile-card">
                                    {workflows.map(wf => (
                                        <div key={wf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{wf.name}</div>
                                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>Trigger: {wf.trigger} · Runs: {wf.run_count}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ background: wf.status === 'active' ? '#dcfce7' : '#f3f4f6', color: wf.status === 'active' ? '#16a34a' : '#9ca3af', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{wf.status}</span>
                                                <button onClick={() => handleToggleWorkflow(wf.id)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer' }}>{wf.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── PAYMENTS (Airtable) ───────────────────────────────────── */}
                    {activeTab === 'payments' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>Payments <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via Airtable</span></h1>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['', 'Success', 'Failed', 'Pending'].map(s => (
                                        <button key={s} onClick={() => { setPaymentsFilter(s); loadPayments(s || undefined) }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: paymentsFilter === s ? '#6366f1' : '#fff', color: paymentsFilter === s ? '#fff' : '#374151' }}>{s || 'All'}</button>
                                    ))}
                                    <button onClick={() => loadPayments(paymentsFilter || undefined)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
                                </div>
                            </div>
                            {paymentsLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} /></div>
                            ) : payments.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 40 }}><Database size={32} style={{ color: '#d1d5db', margin: '0 auto 12px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>No payment records found.</p></div>
                            ) : (
                                <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px 140px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <span>Customer</span><span>Amount</span><span>Plan</span><span>Status</span><span>Date</span>
                                    </div>
                                    {payments.map((p, i) => {
                                        const colors = airtableStatusColor[p['Status']] || { bg: '#f3f4f6', text: '#6b7280' }
                                        return (
                                            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 120px 140px', padding: '14px 20px', borderBottom: i < payments.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}>
                                                <div><div style={{ fontWeight: 600 }}>{p['Customer Name'] || '—'}</div>{p['Payment ID'] && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>ID: {p['Payment ID']}</div>}</div>
                                                <span style={{ fontWeight: 600 }}>{p['Amount'] != null ? `₹${p['Amount']}` : '—'}</span>
                                                <span style={{ color: '#6b7280' }}>{p['Plan'] || '—'}</span>
                                                <span><span style={{ background: colors.bg, color: colors.text, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{p['Status'] || '—'}</span></span>
                                                <span style={{ color: '#9ca3af', fontSize: 12 }}>{p['Created At'] || '—'}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ── RAZORPAY PAYMENTS MCP
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'razorpay' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>
                                    Razorpay <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via razorpay-mcp</span>
                                </h1>
                                <button className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadRzpToday} disabled={rzpLoading}>
                                    {rzpLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
                                </button>
                            </div>
                            {rzpToday && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Today's Revenue", value: rzpToday.total_amount,      icon: '💰', color: '#2B6CB0' },
                                        { label: 'Captured',        value: rzpToday.captured_payments, icon: '✅', color: '#16a34a' },
                                        { label: 'Total Today',     value: rzpToday.total_payments,    icon: '📊', color: '#d97706' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                                {([
                                    { id: 'today',  label: '📅 Today' },
                                    { id: 'range',  label: '📆 Date Range' },
                                    { id: 'detail', label: '🔍 Payment Lookup' },
                                    { id: 'stats',  label: '📊 Analytics' },
                                ] as const).map(t => (
                                    <button key={t.id} onClick={() => setRzpSubTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: rzpSubTab === t.id ? '#2B6CB0' : '#f3f4f6', color: rzpSubTab === t.id ? '#fff' : '#374151' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            {rzpError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{rzpError}</div>}
                            {rzpLoading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#2B6CB0' }} /></div>}
                            {rzpSubTab === 'today' && !rzpLoading && (rzpToday ? <RzpPaymentTable payments={rzpToday.payments} /> : <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}><IndianRupee size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>Click Refresh to load today's payments.</p></div>)}
                            {rzpSubTab === 'range' && !rzpLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Select Date Range</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={rzpFromDate} onChange={e => setRzpFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={rzpToDate} onChange={e => setRzpToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadRzpRange} disabled={!rzpFromDate || !rzpToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {rzpRange && (<><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}><div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 18px' }}><div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Total Payments</div><div style={{ fontSize: 26, fontWeight: 800, color: '#1e3a8a' }}>{rzpRange.total_payments}</div></div><div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '16px 18px' }}><div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Total Revenue</div><div style={{ fontSize: 26, fontWeight: 800, color: '#1e3a8a' }}>{rzpRange.total_amount}</div></div></div><RzpPaymentTable payments={rzpRange.payments} /></>)}
                                </>
                            )}
                            {rzpSubTab === 'detail' && !rzpLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔍 Look Up a Payment</h3>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <input type="text" className="form-input" placeholder="e.g. pay_ABC123XYZ" value={rzpDetailId} onChange={e => setRzpDetailId(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadRzpDetail()} style={{ flex: 1 }} />
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadRzpDetail} disabled={!rzpDetailId.trim()}><Search size={15} /> Lookup</button>
                                        </div>
                                    </div>
                                    {rzpDetail && (<div className="profile-card"><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#2B6CB0' }}>💳 {rzpDetail.id}<span style={{ ...rzpStatusColor(rzpDetail.status), fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginLeft: 12 }}>{rzpDetail.status}</span></h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>{[['Amount', rzpDetail.amount], ['Currency', rzpDetail.currency], ['Method', rzpDetail.method], ['Email', rzpDetail.email], ['Phone', rzpDetail.contact], ['Description', rzpDetail.description || '—'], ['Created At', rzpDetail.created_at]].map(([k, v]) => (<div key={String(k)} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k}</span><span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span></div>))}</div></div>)}
                                </>
                            )}
                            {rzpSubTab === 'stats' && !rzpLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Payment Analytics</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            {[7, 14, 30, 90].map(d => (<button key={d} onClick={() => setRzpStatsDays(d)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: rzpStatsDays === d ? '#2B6CB0' : '#fff', color: rzpStatsDays === d ? '#fff' : '#374151' }}>{d}d</button>))}
                                            <button className="btn-primary" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }} onClick={loadRzpStats}><BarChart2 size={15} /> Analyze</button>
                                        </div>
                                    </div>
                                    {rzpStats && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}><div className="profile-card"><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#2B6CB0' }}>{rzpStats.period}</h3>{[['Total Transactions', rzpStats.total_transactions], ['Successful', rzpStats.successful], ['Failed', rzpStats.failed], ['Success Rate', rzpStats.success_rate], ['Total Revenue', rzpStats.total_revenue]].map(([k, v]) => (<div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}><span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 700, color: String(k) === 'Total Revenue' ? '#2B6CB0' : '#111827' }}>{String(v)}</span></div>))}</div><div className="profile-card"><h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment Methods</h3>{Object.entries(rzpStats.payment_methods).length === 0 ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No method data.</p> : Object.entries(rzpStats.payment_methods).sort(([, a], [, b]) => (b as number) - (a as number)).map(([method, count]) => { const total = Object.values(rzpStats.payment_methods).reduce((s: number, v: any) => s + v, 0); const pct = total > 0 ? Math.round((count as number) / total * 100) : 0; return (<div key={method} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{method}</span><span style={{ color: '#6b7280' }}>{count as number} ({pct}%)</span></div><div style={{ height: 8, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: '#2B6CB0', borderRadius: 4, transition: 'width 0.4s ease' }} /></div></div>) })}</div></div>)}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ── RAZORPAY SUBSCRIPTIONS MCP
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'subscriptions' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>
                                    Subscriptions <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via razorpay-subscription-mcp</span>
                                </h1>
                                <button className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadSubOverview} disabled={subLoading}>
                                    {subLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
                                </button>
                            </div>
                            {subRevenue && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: 'MRR',         value: subRevenue.mrr,                 icon: '💰', color: '#0e7490' },
                                        { label: 'ARR',         value: subRevenue.arr,                 icon: '📈', color: '#0369a1' },
                                        { label: 'Active Subs', value: subSummary?.active ?? '—',      icon: '✅', color: '#16a34a' },
                                        { label: 'Avg / Sub',   value: subRevenue.avg_revenue_per_sub, icon: '📊', color: '#d97706' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {subSummary && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
                                    {[
                                        { label: 'Total',     value: subSummary.total_subscriptions, color: '#374151' },
                                        { label: 'Active',    value: subSummary.active,              color: '#16a34a' },
                                        { label: 'Paused',    value: subSummary.paused,              color: '#d97706' },
                                        { label: 'Halted',    value: subSummary.halted_failed,       color: '#dc2626' },
                                        { label: 'Cancelled', value: subSummary.cancelled,           color: '#6b7280' },
                                        { label: 'Health',    value: subSummary.health_rate,         color: '#0e7490' },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                                            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginTop: 3 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12, flexWrap: 'wrap' }}>
                                {([
                                    { id: 'overview', label: '📊 Overview' },
                                    { id: 'list',     label: '📋 All Subscriptions' },
                                    { id: 'lookup',   label: '🔍 Lookup' },
                                    { id: 'expiring', label: '⏳ Expiring Soon' },
                                    { id: 'failed',   label: '❌ Failed/Halted' },
                                    { id: 'plans',    label: '📝 Plans' },
                                    { id: 'revenue',  label: '💰 Revenue' },
                                    { id: 'create',   label: '➕ Create' },
                                ] as const).map(t => (
                                    <button key={t.id} onClick={() => setSubTab(t.id)} style={{ padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: subTab === t.id ? '#0e7490' : '#f3f4f6', color: subTab === t.id ? '#fff' : '#374151' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            {subError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{subError}</div>}
                            {subActionMsg && <div style={{ background: subActionMsg.ok ? '#dcfce7' : '#fee2e2', color: subActionMsg.ok ? '#16a34a' : '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{subActionMsg.text}</div>}
                            {subLoading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#0e7490' }} /></div>}

                            {subTab === 'overview' && !subLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>📊 Subscription Health</h3>
                                        {subSummary ? [['Total Subscriptions', subSummary.total_subscriptions], ['Active', subSummary.active], ['Paused', subSummary.paused], ['Halted/Failed', subSummary.halted_failed], ['Cancelled', subSummary.cancelled], ['Health Rate', subSummary.health_rate], ['Churn Rate', subSummary.churn_rate]].map(([k, v]) => (
                                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}><span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 700 }}>{String(v)}</span></div>
                                        )) : <p style={{ color: '#9ca3af', fontSize: 13 }}>Click Refresh to load data.</p>}
                                    </div>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0369a1' }}>💰 Revenue Metrics</h3>
                                        {subRevenue ? [['Active Subscriptions', subRevenue.active_subscriptions], ['Monthly Recurring Revenue (MRR)', subRevenue.mrr], ['Annual Recurring Revenue (ARR)', subRevenue.arr], ['Avg Revenue / Subscription', subRevenue.avg_revenue_per_sub]].map(([k, v]) => (
                                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}><span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 700, color: String(k).includes('Revenue') || String(k).includes('Avg') ? '#0e7490' : '#111827' }}>{String(v)}</span></div>
                                        )) : <p style={{ color: '#9ca3af', fontSize: 13 }}>Click Refresh to load data.</p>}
                                        <button className="btn-primary" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={async () => { setSubLoading(true); try { setSubRevenue(await getSubscriptionRevenue()) } catch {} finally { setSubLoading(false) } }}><RefreshCw size={14} /> Recalculate</button>
                                    </div>
                                </div>
                            )}
                            {subTab === 'list' && !subLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div><label className="form-label">Status Filter</label><select className="form-input" value={subListStatus} onChange={e => setSubListStatus(e.target.value)} style={{ minWidth: 160 }}><option value="">All statuses</option>{['created','authenticated','active','paused','halted','cancelled','completed','expired'].map(s => (<option key={s} value={s}>{s}</option>))}</select></div>
                                            <div><label className="form-label">Count</label><select className="form-input" value={subListCount} onChange={e => setSubListCount(Number(e.target.value))}>{[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
                                            <button className="btn-primary" style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadSubList}><Search size={14} /> Fetch</button>
                                        </div>
                                    </div>
                                    {subList.length === 0 ? <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}><Repeat size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>Click Fetch to load subscriptions.</p></div> : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 130px 120px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}><span>Subscription / Plan</span><span>Status</span><span>Qty</span><span>Invoices</span><span>Actions</span></div>
                                            {subList.map(sub => <SubRow key={sub.id} sub={sub} onAction={loadSubList} />)}
                                        </div>
                                    )}
                                </>
                            )}
                            {subTab === 'lookup' && !subLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔍 Look Up a Subscription</h3>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <input type="text" className="form-input" placeholder="e.g. sub_ABC123XYZ" value={subLookupId} onChange={e => setSubLookupId(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadSubDetail()} style={{ flex: 1 }} />
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadSubDetail} disabled={!subLookupId.trim()}><Search size={15} /> Lookup</button>
                                        </div>
                                    </div>
                                    {subDetail && (
                                        <div className="profile-card">
                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#0e7490' }}>🔄 {subDetail.id}<span style={{ ...subStatusColor(subDetail.status), fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginLeft: 12 }}>{subDetail.status}</span></h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 20 }}>
                                                {[['Plan ID', subDetail.plan_id], ['Paid / Total', `${subDetail.paid_count} / ${subDetail.total_count}`], ['Remaining', subDetail.remaining ?? '—'], ['Quantity', subDetail.quantity], ['Period Start', subDetail.current_start || '—'], ['Period End', subDetail.current_end || '—'], ['Ended At', subDetail.ended_at || '—']].map(([k, v]) => (
                                                    <div key={String(k)} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k}</span><span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span></div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                {subDetail.status === 'active' && (<>
                                                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => handleSubAction(() => pauseSubscription(subDetail.id))} disabled={subLoading}><PauseCircle size={14} /> Pause Now</button>
                                                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#dc2626' }} onClick={() => handleSubAction(() => cancelSubscription(subDetail.id, false))} disabled={subLoading}><XCircle size={14} /> Cancel Now</button>
                                                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#d97706' }} onClick={() => handleSubAction(() => cancelSubscription(subDetail.id, true))} disabled={subLoading}><XCircle size={14} /> Cancel at Cycle End</button>
                                                </>)}
                                                {subDetail.status === 'paused' && <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16a34a' }} onClick={() => handleSubAction(() => resumeSubscription(subDetail.id))} disabled={subLoading}><PlayCircle size={14} /> Resume</button>}
                                                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => loadSubInvoices(subDetail.id)} disabled={subInvoiceLoading}><FileText size={14} /> View Invoices</button>
                                            </div>
                                            {subInvoices.length > 0 && subInvoiceId === subDetail.id && (
                                                <div style={{ marginTop: 20 }}>
                                                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#374151' }}>Invoices</h4>
                                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        {subInvoices.map(inv => (
                                                            <div key={inv.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                                                                <div style={{ fontWeight: 700, color: '#0e7490' }}>{inv.amount}</div>
                                                                <div style={{ color: '#6b7280', marginTop: 2 }}>{inv.date} · <span style={{ fontWeight: 600 }}>{inv.status}</span></div>
                                                                <div style={{ fontSize: 10, color: '#c4c9d4', fontFamily: 'monospace', marginTop: 2 }}>{inv.id}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                            {subTab === 'expiring' && !subLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>⏳ Expiring Soon</h3>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {[7,14,30].map(d => (<button key={d} onClick={() => setExpiringDays(d)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer', background: expiringDays === d ? '#0e7490' : '#fff', color: expiringDays === d ? '#fff' : '#374151', fontWeight: expiringDays === d ? 700 : 400 }}>{d}d</button>))}
                                            <button className="btn-primary" style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }} onClick={loadExpiring}><Search size={14} /> Check</button>
                                        </div>
                                    </div>
                                    {expiringList.length === 0 ? <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}><Clock size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>No subscriptions expiring in next {expiringDays} days.</p></div> : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 100px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}><span>Subscription ID</span><span>Expires On</span><span>Days Left</span><span>Paid Count</span></div>
                                            {expiringList.map((sub, i) => (
                                                <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 100px 100px', padding: '13px 20px', borderBottom: i < expiringList.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}>
                                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0e7490', fontWeight: 600 }}>{sub.id}</span>
                                                    <span style={{ color: '#374151' }}>{sub.expires_on}</span>
                                                    <span><span style={{ background: sub.days_left <= 3 ? '#fee2e2' : '#fef3c7', color: sub.days_left <= 3 ? '#dc2626' : '#d97706', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{sub.days_left}d</span></span>
                                                    <span style={{ color: '#6b7280' }}>{sub.paid_count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {subTab === 'failed' && !subLoading && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>❌ Failed / Halted Subscriptions</h3>
                                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadFailed}><RefreshCw size={14} /> Load</button>
                                    </div>
                                    {failedList.length === 0 ? <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}><CheckCircle size={36} style={{ color: '#86efac', margin: '0 auto 14px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>No failed subscriptions 🎉</p></div> : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}><span>Subscription ID</span><span>Plan ID</span><span>Paid</span><span>Total</span></div>
                                            {failedList.map((sub, i) => (<div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', padding: '13px 20px', borderBottom: i < failedList.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{sub.id}</span><span style={{ fontSize: 12, color: '#6b7280' }}>{sub.plan_id}</span><span style={{ fontWeight: 700 }}>{sub.paid_count}</span><span style={{ color: '#9ca3af' }}>{sub.total_count}</span></div>))}
                                        </div>
                                    )}
                                </>
                            )}
                            {subTab === 'plans' && !subLoading && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>📝 Subscription Plans</h3>
                                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadPlans}><RefreshCw size={14} /> Load Plans</button>
                                    </div>
                                    {plans.length === 0 ? <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}><FileText size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} /><p style={{ color: '#9ca3af', fontSize: 14 }}>Click Load Plans to fetch your Razorpay plans.</p></div> : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                            {plans.map(plan => (
                                                <div key={plan.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0e7490', marginBottom: 6 }}>{plan.name || '—'}</div>
                                                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{plan.amount}</div>
                                                    <div style={{ fontSize: 12, color: '#6b7280' }}>Every {plan.interval} {plan.period}</div>
                                                    <div style={{ fontSize: 10, color: '#c4c9d4', fontFamily: 'monospace', marginTop: 8 }}>{plan.id}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            {subTab === 'revenue' && !subLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>💰 MRR / ARR Breakdown</h3>
                                        {subRevenue ? [['Active Subscriptions', subRevenue.active_subscriptions], ['Monthly Recurring Revenue (MRR)', subRevenue.mrr], ['Annual Recurring Revenue (ARR)', subRevenue.arr], ['Avg Revenue / Subscription', subRevenue.avg_revenue_per_sub]].map(([k, v]) => (
                                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}><span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 800, fontSize: 16, color: '#0e7490' }}>{String(v)}</span></div>
                                        )) : <p style={{ color: '#9ca3af', fontSize: 13 }}>Click Refresh to load revenue data.</p>}
                                        <button className="btn-primary" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={async () => { setSubLoading(true); try { setSubRevenue(await getSubscriptionRevenue()) } catch {} finally { setSubLoading(false) } }}><RefreshCw size={14} /> Recalculate</button>
                                    </div>
                                    <div className="profile-card" style={{ background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0e7490', marginBottom: 12 }}>💡 What these mean</h3>
                                        {[['MRR', 'Monthly Recurring Revenue — sum of all active subscription amounts this month.'], ['ARR', 'Annual Recurring Revenue — MRR × 12. Your projected yearly revenue.'], ['Avg/Sub', 'Average revenue per active subscription. Higher = healthier plan mix.']].map(([t, d]) => (
                                            <div key={t} style={{ marginBottom: 14 }}><div style={{ fontWeight: 700, fontSize: 13, color: '#0369a1', marginBottom: 3 }}>{t}</div><div style={{ fontSize: 12, color: '#0e7490', lineHeight: 1.5 }}>{d}</div></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {subTab === 'create' && !subLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>➕ Create New Subscription</h3>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Creates a subscription and returns a short_url to share with the customer for activation.</p>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            <div><label className="form-label">Plan ID * <span style={{ fontSize: 10, color: '#9ca3af' }}>(from Plans tab)</span></label><input type="text" className="form-input" placeholder="plan_ABC123XYZ" value={createSubForm.plan_id} onChange={e => setCreateSubForm(p => ({ ...p, plan_id: e.target.value }))} /></div>
                                            <div><label className="form-label">Total Billing Cycles *</label><input type="number" className="form-input" placeholder="12" min={1} value={createSubForm.total_count} onChange={e => setCreateSubForm(p => ({ ...p, total_count: e.target.value }))} /></div>
                                            <div><label className="form-label">Quantity</label><input type="number" className="form-input" placeholder="1" min={1} value={createSubForm.quantity} onChange={e => setCreateSubForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                                            <div><label className="form-label">Customer Name (note)</label><input type="text" className="form-input" placeholder="Rahul Sharma" value={createSubForm.note_name} onChange={e => setCreateSubForm(p => ({ ...p, note_name: e.target.value }))} /></div>
                                            <div><label className="form-label">Customer Email (note)</label><input type="email" className="form-input" placeholder="rahul@example.com" value={createSubForm.note_email} onChange={e => setCreateSubForm(p => ({ ...p, note_email: e.target.value }))} /></div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}><input type="checkbox" checked={createSubForm.customer_notify} onChange={e => setCreateSubForm(p => ({ ...p, customer_notify: e.target.checked }))} />Notify customer via Razorpay email</label>
                                        </div>
                                        <button className="btn-primary" style={{ width: '100%', marginTop: 20, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleCreateSub} disabled={subLoading || !createSubForm.plan_id || !createSubForm.total_count}>
                                            {subLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}Create Subscription
                                        </button>
                                        {createSubResult && (
                                            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #86efac' }}>
                                                <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 10 }}>✅ Subscription Created!</div>
                                                {[['ID', createSubResult.subscription_id], ['Status', createSubResult.status]].map(([k, v]) => (<div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #dcfce7' }}><span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>))}
                                                <div style={{ marginTop: 10 }}><span style={{ fontSize: 12, color: '#6b7280' }}>Payment URL: </span><a href={createSubResult.short_url} target="_blank" rel="noreferrer" style={{ color: '#0e7490', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>{createSubResult.short_url} ↗</a></div>
                                                <p style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>{createSubResult.message}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="profile-card" style={{ background: '#ecfeff', border: '1px solid #a5f3fc' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0e7490', marginBottom: 12 }}>🔄 How subscriptions work</h3>
                                        {[['1. Create subscription', 'Pick a plan, set billing cycles. Razorpay returns a short_url.'], ['2. Share with customer', 'Customer opens the link, completes first payment → status becomes "authenticated".'], ['3. Auto-billing', 'Razorpay automatically charges on each billing cycle. Status: "active".'], ['4. Manage anytime', 'Pause, resume, or cancel from the List or Lookup tabs.']].map(([t, d]) => (
                                            <div key={t} style={{ marginBottom: 14 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#0369a1', marginBottom: 3 }}>{t}</div><div style={{ fontSize: 12, color: '#0e7490', lineHeight: 1.5 }}>{d}</div></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ── TELEGRAM MCP
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'telegram' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>
                                    Telegram <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via telegram-mcp</span>
                                </h1>
                                <button className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTgBotInfo} disabled={tgLoading}>
                                    {tgLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
                                </button>
                            </div>

                            {tgBotInfo && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: 'Bot Name', value: tgBotInfo.name,     icon: '🤖', color: '#0088cc' },
                                        { label: 'Username', value: tgBotInfo.username, icon: '📛', color: '#0369a1' },
                                        { label: 'Bot ID',   value: tgBotInfo.id,       icon: '🔢', color: '#6b7280' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: stat.color, wordBreak: 'break-all' }}>{stat.value}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                                {([
                                    { id: 'send',    label: '📤 Send Message' },
                                    { id: 'alert',   label: '💰 Payment Alert' },
                                    { id: 'botinfo', label: '🤖 Bot Info' },
                                    { id: 'updates', label: '📨 Recent Updates' },
                                ] as const).map(t => (
                                    <button key={t.id} onClick={() => setTgSubTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: tgSubTab === t.id ? '#0088cc' : '#f3f4f6', color: tgSubTab === t.id ? '#fff' : '#374151' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {tgError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{tgError}</div>}
                            {tgLoading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#0088cc' }} /></div>}

                            {tgSubTab === 'send' && !tgLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📤 Send a Message</h3>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Send any text message to a Telegram chat, group, or channel.</p>
                                        <div style={{ display: 'grid', gap: 14 }}>
                                            <div>
                                                <label className="form-label">Chat ID / @username *</label>
                                                <input type="text" className="form-input" placeholder="-1001234567890 or @mychannel" value={tgSendForm.chat_id} onChange={e => setTgSendForm(p => ({ ...p, chat_id: e.target.value }))} />
                                                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Use the "Recent Updates" tab to discover chat IDs.</p>
                                            </div>
                                            <div>
                                                <label className="form-label">Message *</label>
                                                <textarea className="form-input" rows={5} placeholder="Hello from FlowConnect! 🚀" value={tgSendForm.message} onChange={e => setTgSendForm(p => ({ ...p, message: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                                            </div>
                                            <div>
                                                <label className="form-label">Parse Mode</label>
                                                <select className="form-input" value={tgSendForm.parse_mode} onChange={e => setTgSendForm(p => ({ ...p, parse_mode: e.target.value }))}>
                                                    <option value="Markdown">Markdown</option>
                                                    <option value="HTML">HTML</option>
                                                    <option value="">Plain text</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button className="btn-primary" style={{ width: '100%', marginTop: 20, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            onClick={handleTgSend} disabled={tgLoading || !tgSendForm.chat_id || !tgSendForm.message}>
                                            {tgLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />} Send Message
                                        </button>
                                        {tgSendResult && (
                                            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, fontSize: 13, background: tgSendResult.error ? '#fee2e2' : '#dbeafe', color: tgSendResult.error ? '#dc2626' : '#1e40af' }}>
                                                {tgSendResult.error ? `❌ ${tgSendResult.error}` : `✅ Message sent (ID: ${tgSendResult.message_id}) to chat ${tgSendResult.chat_id}`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="profile-card" style={{ background: '#e7f5ff', border: '1px solid #90cdf4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0088cc', marginBottom: 12 }}>💡 Markdown Tips</h3>
                                        {[
                                            ['*bold text*',     'Renders as bold'],
                                            ['_italic text_',   'Renders as italic'],
                                            ['`inline code`',   'Renders as monospace code'],
                                            ['[text](url)',      'Clickable hyperlink'],
                                        ].map(([syntax, desc]) => (
                                            <div key={syntax} style={{ marginBottom: 10 }}>
                                                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0088cc', marginBottom: 2 }}>{syntax}</div>
                                                <div style={{ fontSize: 12, color: '#0369a1' }}>{desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tgSubTab === 'alert' && !tgLoading && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="profile-card">
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>💰 Send Payment Alert</h3>
                                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Sends a beautifully formatted payment notification to your Telegram chat.</p>
                                        <div style={{ display: 'grid', gap: 14 }}>
                                            <div><label className="form-label">Chat ID / @username *</label><input type="text" className="form-input" placeholder="-1001234567890 or @mychannel" value={tgAlertForm.chat_id} onChange={e => setTgAlertForm(p => ({ ...p, chat_id: e.target.value }))} /></div>
                                            <div><label className="form-label">Customer Name *</label><input type="text" className="form-input" placeholder="Rahul Sharma" value={tgAlertForm.customer_name} onChange={e => setTgAlertForm(p => ({ ...p, customer_name: e.target.value }))} /></div>
                                            <div><label className="form-label">Amount (₹) *</label><input type="number" className="form-input" placeholder="999" value={tgAlertForm.amount} onChange={e => setTgAlertForm(p => ({ ...p, amount: e.target.value }))} /></div>
                                            <div><label className="form-label">Plan / Product</label><input type="text" className="form-input" placeholder="Pro Monthly" value={tgAlertForm.plan} onChange={e => setTgAlertForm(p => ({ ...p, plan: e.target.value }))} /></div>
                                            <div><label className="form-label">Payment ID</label><input type="text" className="form-input" placeholder="pay_ABC123XYZ" value={tgAlertForm.payment_id} onChange={e => setTgAlertForm(p => ({ ...p, payment_id: e.target.value }))} /></div>
                                        </div>
                                        <button className="btn-primary" style={{ width: '100%', marginTop: 20, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            onClick={handleTgAlert} disabled={tgLoading || !tgAlertForm.chat_id || !tgAlertForm.customer_name}>
                                            {tgLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Bot size={15} />} Send Payment Alert
                                        </button>
                                        {tgAlertResult && (
                                            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, fontSize: 13, background: tgAlertResult.error ? '#fee2e2' : '#dbeafe', color: tgAlertResult.error ? '#dc2626' : '#1e40af' }}>
                                                {tgAlertResult.error ? `❌ ${tgAlertResult.error}` : `✅ Alert sent (msg ID: ${tgAlertResult.message_id})`}
                                            </div>
                                        )}
                                    </div>
                                    <div className="profile-card" style={{ background: '#e7f5ff', border: '1px solid #90cdf4' }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0e7490', marginBottom: 12 }}>📋 Message Preview</h3>
                                        <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb', fontFamily: 'monospace', fontSize: 13, lineHeight: 2, color: '#374151' }}>
                                            💰 <strong>New Payment Received!</strong><br />
                                            <br />
                                            👤 <strong>Customer:</strong> {tgAlertForm.customer_name || 'Rahul Sharma'}<br />
                                            💵 <strong>Amount:</strong> ₹{tgAlertForm.amount || '999'}<br />
                                            {tgAlertForm.plan && <span>📦 <strong>Plan:</strong> {tgAlertForm.plan}<br /></span>}
                                            {tgAlertForm.payment_id && <span>🔖 <strong>Payment ID:</strong> <code>{tgAlertForm.payment_id}</code><br /></span>}
                                            ⏰ <strong>Time:</strong> {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {tgSubTab === 'botinfo' && !tgLoading && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTgBotInfo}>
                                            <Bot size={14} /> Fetch Bot Info
                                        </button>
                                    </div>
                                    {!tgBotInfo ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Bot size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Click "Fetch Bot Info" to load your bot's details.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <div className="profile-card">
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0088cc', marginBottom: 16 }}>🤖 Bot Details</h3>
                                                {[['Name', tgBotInfo.name], ['Username', tgBotInfo.username], ['Bot ID', tgBotInfo.id]].map(([k, v]) => (
                                                    <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                                                        <span style={{ color: '#6b7280' }}>{k}</span>
                                                        <span style={{ fontWeight: 700, color: '#0088cc' }}>{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="profile-card" style={{ background: '#e7f5ff', border: '1px solid #90cdf4' }}>
                                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0088cc', marginBottom: 12 }}>🔗 How to use</h3>
                                                <p style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.7 }}>
                                                    Your bot is <strong>{tgBotInfo.username}</strong>. Add it as an admin to any group or channel, then use the group's chat ID in the "Send Message" tab.
                                                    <br /><br />
                                                    To get a chat ID, send a message to the group after adding the bot, then check the "Recent Updates" tab.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {tgSubTab === 'updates' && !tgLoading && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>📨 Recent Bot Updates</h3>
                                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTgUpdates}>
                                            <RefreshCw size={14} /> Load Updates
                                        </button>
                                    </div>
                                    {!tgUpdates ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <MessageSquare size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Click "Load Updates" to see recent messages sent to your bot.</p>
                                            <p style={{ color: '#c4c9d4', fontSize: 12, marginTop: 6 }}>This is how you discover chat IDs to use in Send Message.</p>
                                        </div>
                                    ) : tgUpdates.updates_count === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <CheckCircle size={36} style={{ color: '#86efac', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>No updates yet. Send a message to your bot first, then refresh.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 1fr 180px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <span>Chat ID</span><span>Type</span><span>Message</span><span>From</span>
                                            </div>
                                            {tgUpdates.chats.filter(c => c.chat_id).map((chat, i) => (
                                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 100px 1fr 180px', padding: '13px 20px', borderBottom: i < tgUpdates.chats.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <code style={{ fontSize: 11, background: '#e7f5ff', color: '#0088cc', padding: '2px 6px', borderRadius: 4 }}>{chat.chat_id}</code>
                                                        <button title="Copy chat ID" onClick={() => navigator.clipboard.writeText(String(chat.chat_id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, padding: 2 }}>📋</button>
                                                    </div>
                                                    <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{chat.chat_type || '—'}</span>
                                                    <span style={{ color: '#374151', fontSize: 12 }}>{chat.text || (chat.chat_title ? `[${chat.chat_title}]` : '—')}</span>
                                                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{chat.from || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ── TYPEFORM MCP
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'typeform' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>
                                    Typeform <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via typeform-mcp</span>
                                </h1>
                                <button className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTfForms} disabled={tfLoading}>
                                    {tfLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
                                </button>
                            </div>

                            {tfForms.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: 'Total Forms',    value: tfForms.length,                        icon: '📋', color: '#262627' },
                                        { label: 'Selected Form',  value: tfSelectedFormId || '—',               icon: '🎯', color: '#7c3aed' },
                                        { label: 'Fields Loaded',  value: tfFields.length > 0 ? tfFields.length : '—', icon: '🔢', color: '#0369a1' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, wordBreak: 'break-all' }}>{stat.value}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>
                                {([
                                    { id: 'forms',     label: '📋 All Forms' },
                                    { id: 'fields',    label: '🔢 Form Fields' },
                                    { id: 'responses', label: '📨 Responses' },
                                ] as const).map(t => (
                                    <button key={t.id} onClick={() => setTfSubTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: tfSubTab === t.id ? '#262627' : '#f3f4f6', color: tfSubTab === t.id ? '#fff' : '#374151' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {tfError && (
                                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
                                    <AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{tfError}
                                </div>
                            )}
                            {tfLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#262627' }} />
                                </div>
                            )}

                            {tfSubTab === 'forms' && !tfLoading && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700 }}>📋 Your Typeforms</h3>
                                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTfForms}>
                                            <RefreshCw size={14} /> Load Forms
                                        </button>
                                    </div>
                                    {tfForms.length === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Layout size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>No Typeforms found. Click "Load Forms" to fetch your forms.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <span>Form Title</span><span>Form ID</span><span>Actions</span>
                                            </div>
                                            {tfForms.map((form, i) => (
                                                <div key={form.id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 120px', padding: '14px 20px', borderBottom: i < tfForms.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13, background: tfSelectedFormId === form.id ? '#faf5ff' : 'transparent' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#111827' }}>{form.title}</div>
                                                        {form._links && (
                                                            <a href={form._links} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#7c3aed', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                                <ExternalLink size={10} /> View form ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                    <code style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>{form.id}</code>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button
                                                            onClick={() => { handleSelectTfForm(form.id); setTfSubTab('fields') }}
                                                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: tfSelectedFormId === form.id ? '#7c3aed' : '#f9fafb', color: tfSelectedFormId === form.id ? '#fff' : '#374151', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                                        >
                                                            Fields
                                                        </button>
                                                        <button
                                                            onClick={() => { handleSelectTfForm(form.id); setTfSubTab('responses') }}
                                                            style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', fontSize: 11 }}
                                                        >
                                                            Resp.
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {tfSubTab === 'fields' && !tfLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🔢 Inspect Form Fields</h3>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <label className="form-label">Form ID *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Select a form from All Forms, or paste ID here"
                                                    value={tfSelectedFormId}
                                                    onChange={e => setTfSelectedFormId(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && loadTfFields()}
                                                />
                                            </div>
                                            <div style={{ alignSelf: 'flex-end' }}>
                                                <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTfFields} disabled={!tfSelectedFormId.trim()}>
                                                    <Search size={15} /> Fetch Fields
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {tfFields.length === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <FileText size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Enter a Form ID and click Fetch Fields.</p>
                                            <p style={{ color: '#c4c9d4', fontSize: 12, marginTop: 6 }}>Or pick a form from the "All Forms" tab and click Fields.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                                                {Array.from(new Set(tfFields.map(f => f.type))).map(type => {
                                                    const cols = tfFieldTypeColor(type)
                                                    return (
                                                        <span key={type} style={{ background: cols.bg, color: cols.text, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                                                            {type}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                            <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 90px', padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    <span>#</span><span>Question</span><span>Type</span><span>Required</span>
                                                </div>
                                                {tfFields.map((field, i) => {
                                                    const cols = tfFieldTypeColor(field.type)
                                                    return (
                                                        <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 90px', padding: '13px 20px', borderBottom: i < tfFields.length - 1 ? '1px solid #f3f4f6' : 'none', alignItems: 'center', fontSize: 13 }}>
                                                            <span style={{ color: '#9ca3af', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                                                            <div>
                                                                <div style={{ fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>{field.title}</div>
                                                                <div style={{ fontSize: 10, color: '#c4c9d4', fontFamily: 'monospace', marginTop: 2 }}>{field.id}</div>
                                                            </div>
                                                            <span>
                                                                <span style={{ background: cols.bg, color: cols.text, fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                                                    {field.type}
                                                                </span>
                                                            </span>
                                                            <span>
                                                                {field.required
                                                                    ? <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Yes</span>
                                                                    : <span style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: 11, padding: '3px 10px', borderRadius: 20 }}>No</span>
                                                                }
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {tfSubTab === 'responses' && !tfLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📨 Fetch Responses</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 10, alignItems: 'flex-end' }}>
                                            <div>
                                                <label className="form-label">Form ID *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Select from All Forms or paste ID"
                                                    value={tfSelectedFormId}
                                                    onChange={e => setTfSelectedFormId(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && loadTfResponses()}
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Page Size</label>
                                                <select className="form-input" value={tfPageSize} onChange={e => setTfPageSize(Number(e.target.value))}>
                                                    {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                                </select>
                                            </div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTfResponses} disabled={!tfSelectedFormId.trim()}>
                                                <Search size={15} /> Fetch
                                            </button>
                                        </div>
                                    </div>

                                    {tfResponses.length === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <MessageSquare size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Enter a Form ID and click Fetch to load responses.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <span style={{ fontSize: 13, color: '#6b7280' }}>
                                                    Showing <strong>{tfResponses.length}</strong> response{tfResponses.length !== 1 ? 's' : ''}
                                                </span>
                                                <button onClick={() => setTfExpandedResponse(null)} style={{ fontSize: 12, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    Collapse all
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {tfResponses.map((resp, i) => {
                                                    const isOpen = tfExpandedResponse === resp.response_id
                                                    return (
                                                        <div key={resp.response_id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                                                            <div
                                                                onClick={() => setTfExpandedResponse(isOpen ? null : resp.response_id)}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', cursor: 'pointer', background: isOpen ? '#faf5ff' : '#fff', userSelect: 'none' }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>#{i + 1}</span>
                                                                    <div>
                                                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                                                                            {new Date(resp.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                                                        </div>
                                                                        <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 1 }}>{resp.response_id}</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                                                                        {resp.answers?.length ?? 0} answers
                                                                    </span>
                                                                    <span style={{ color: '#9ca3af', fontSize: 16, fontWeight: 300 }}>{isOpen ? '▲' : '▼'}</span>
                                                                </div>
                                                            </div>
                                                            {isOpen && (
                                                                <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 18px', background: '#faf5ff' }}>
                                                                    {!resp.answers || resp.answers.length === 0 ? (
                                                                        <p style={{ fontSize: 12, color: '#9ca3af' }}>No answers recorded.</p>
                                                                    ) : (
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                                            {resp.answers.map((ans, ai) => {
                                                                                const cols = tfFieldTypeColor(ans.type)
                                                                                return (
                                                                                    <div key={ai} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                                                            <span style={{ background: cols.bg, color: cols.text, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase' }}>{ans.type}</span>
                                                                                            <span style={{ fontSize: 10, color: '#c4c9d4', fontFamily: 'monospace' }}>{ans.field_id}</span>
                                                                                        </div>
                                                                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
                                                                                            {ans.value === null || ans.value === undefined
                                                                                                ? <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                                                                                                : typeof ans.value === 'boolean'
                                                                                                    ? (ans.value ? '✅ Yes' : '❌ No')
                                                                                                    : String(ans.value)
                                                                                            }
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        ── TALLY MCP
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'tally' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>
                                    Tally <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>via tally-mcp</span>
                                </h1>
                                <button className="btn-secondary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={loadTallyOverview} disabled={tallyLoading}>
                                    {tallyLoading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
                                </button>
                            </div>

                            {tallyCompany && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: 'Company Name', value: tallyCompany.name,     icon: '🏢', color: '#0e7490' },
                                        { label: 'Username',     value: tallyCompany.username, icon: '📛', color: '#0369a1' },
                                        { label: 'ID',           value: tallyCompany.id,       icon: '🔢', color: '#6b7280' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: stat.color, wordBreak: 'break-all' }}>{stat.value}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12, flexWrap: 'wrap' }}>
                                {([
                                    { id: 'overview',     label: '📊 Overview' },
                                    { id: 'ledgers',      label: '📒 Ledgers' },
                                    { id: 'vouchers',     label: '📄 Vouchers' },
                                    { id: 'pnl',          label: '📈 P&L' },
                                    { id: 'balance',      label: '💰 Balance' },
                                    { id: 'trial',        label: '⚖️ Trial' },
                                    { id: 'outstanding',  label: '🪙 Outstanding' },
                                    { id: 'stock',        label: '📦 Stock' },
                                ] as const).map(t => (
                                    <button key={t.id} onClick={() => setTallySubTab(t.id)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: tallySubTab === t.id ? '#0e7490' : '#f3f4f6', color: tallySubTab === t.id ? '#fff' : '#374151' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {tallyError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}><AlertCircle size={14} style={{ display: 'inline', marginRight: 6 }} />{tallyError}</div>}
                            {tallyLoading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#0e7490' }} /></div>}

                            {tallySubTab === 'overview' && !tallyLoading && (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                    <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>Click Refresh to load company data from TallyPrime.</p>
                                    {tallyCompany && (
                                        <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 400, margin: '20px auto 0' }}>
                                            {Object.entries(tallyCompany).map(([k, v]) => (
                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                                                    <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                                    <span style={{ fontWeight: 600 }}>{String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {tallySubTab === 'ledgers' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📒 Ledgers</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div>
                                                <label className="form-label">Ledger Group</label>
                                                <input type="text" className="form-input" placeholder="e.g. Sundry Debtors" value={tallyLedgerGroup} onChange={e => setTallyLedgerGroup(e.target.value)} style={{ minWidth: 180 }} />
                                            </div>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyLedgers} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {tallyLedgers.length === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load ledgers.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{ padding: '10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>
                                                Ledger Data
                                            </div>
                                            {tallyLedgers.map((ledger: any, i: number) => (
                                                <div key={i} style={{ padding: '13px 20px', borderBottom: i < tallyLedgers.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 13 }}>
                                                    <pre style={{ margin: 0, fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap' }}>{JSON.stringify(ledger, null, 2)}</pre>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {tallySubTab === 'vouchers' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📄 Vouchers</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div>
                                                <label className="form-label">Voucher Type</label>
                                                <input type="text" className="form-input" placeholder="e.g. Sales, Purchase" value={tallyVoucherType} onChange={e => setTallyVoucherType(e.target.value)} style={{ minWidth: 180 }} />
                                            </div>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyVouchers} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {tallyVouchers.length === 0 ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <FileText size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load vouchers.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card" style={{ padding: 0, overflow: 'hidden' }}>
                                            {tallyVouchers.map((voucher: any, i: number) => (
                                                <div key={i} style={{ padding: '13px 20px', borderBottom: i < tallyVouchers.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize: 13 }}>
                                                    <pre style={{ margin: 0, fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap' }}>{JSON.stringify(voucher, null, 2)}</pre>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}

                            {tallySubTab === 'pnl' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📈 Profit & Loss</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div>
                                                <label className="form-label">Period</label>
                                                <select className="form-input" value={tallyPnl?.period || 'monthly'} onChange={e => setTallyPnl((p: any) => ({ ...p, period: e.target.value }))}>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="quarterly">Quarterly</option>
                                                    <option value="yearly">Yearly</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">From Date</label>
                                                <input type="date" className="form-input" value={tallyPnl?.from || ''} onChange={e => setTallyPnl((p: any) => ({ ...p, from: e.target.value }))} />
                                            </div>
                                            <div>
                                                <label className="form-label">To Date</label>
                                                <input type="date" className="form-input" value={tallyPnl?.to || ''} onChange={e => setTallyPnl((p: any) => ({ ...p, to: e.target.value }))} />
                                            </div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyReports}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                        <BarChart2 size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                        <p style={{ color: '#9ca3af', fontSize: 14 }}>Set period and dates, then click Fetch to load P&L data.</p>
                                    </div>
                                </>
                            )}

                            {tallySubTab === 'balance' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💰 Balance Sheet</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyBalance} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {!tallyBalance ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load balance sheet.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card">
                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>📊 Balance Sheet</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                {Object.entries(tallyBalance).map(([k, v]) => (
                                                    <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {tallySubTab === 'trial' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>⚖️ Trial Balance</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyTrial} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {!tallyTrial ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load trial balance.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card">
                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>📊 Trial Balance</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                {Object.entries(tallyTrial).map(([k, v]) => (
                                                    <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {tallySubTab === 'outstanding' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🪙 Outstanding</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyOutstanding} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {!tallyOutstanding ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load outstanding data.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card">
                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>📊 Outstanding</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                {Object.entries(tallyOutstanding).map(([k, v]) => (
                                                    <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {tallySubTab === 'stock' && !tallyLoading && (
                                <>
                                    <div className="profile-card" style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📦 Stock Summary</h3>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            <div><label className="form-label">From Date</label><input type="date" className="form-input" value={tallyFromDate} onChange={e => setTallyFromDate(e.target.value)} /></div>
                                            <div><label className="form-label">To Date</label><input type="date" className="form-input" value={tallyToDate} onChange={e => setTallyToDate(e.target.value)} /></div>
                                            <button className="btn-primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={loadTallyStock} disabled={!tallyFromDate || !tallyToDate}><Search size={15} /> Fetch</button>
                                        </div>
                                    </div>
                                    {!tallyStock ? (
                                        <div className="profile-card" style={{ textAlign: 'center', padding: 48 }}>
                                            <Database size={36} style={{ color: '#d1d5db', margin: '0 auto 14px' }} />
                                            <p style={{ color: '#9ca3af', fontSize: 14 }}>Set date range and click Fetch to load stock data.</p>
                                        </div>
                                    ) : (
                                        <div className="profile-card">
                                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#0e7490' }}>📊 Stock Summary</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                {Object.entries(tallyStock).map(([k, v]) => (
                                                    <div key={k} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* ── ZOHO CRM MCP ─────────────────────────────────────────── */}
                    {activeTab === 'zoho' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ padding: 24 }}>
                                <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Zoho CRM MCP</h2>
                                <div style={{ marginBottom: 16 }}>
                                    <button onClick={() => { setZohoTab('leads'); loadZohoLeads() }} style={{ marginRight: 8, fontWeight: zohoTab === 'leads' ? 700 : 400 }}>Leads</button>
                                    <button onClick={() => { setZohoTab('deals'); loadZohoDeals() }} style={{ marginRight: 8, fontWeight: zohoTab === 'deals' ? 700 : 400 }}>Deals</button>
                                    <button onClick={() => { setZohoTab('contacts'); loadZohoContacts() }} style={{ fontWeight: zohoTab === 'contacts' ? 700 : 400 }}>Contacts</button>
                                </div>
                                {zohoLoading && <div>Loading...</div>}
                                {zohoError && <div style={{ color: 'red' }}>{zohoError}</div>}
                                {zohoTab === 'leads' && (
                                    <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 13 }}>{JSON.stringify(zohoLeads, null, 2)}</pre>
                                )}
                                {zohoTab === 'deals' && (
                                    <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 13 }}>{JSON.stringify(zohoDeals, null, 2)}</pre>
                                )}
                                {zohoTab === 'contacts' && (
                                    <pre style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 13 }}>{JSON.stringify(zohoContacts, null, 2)}</pre>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <Footer />
                </main>
            </div>
        </div>
    )
}
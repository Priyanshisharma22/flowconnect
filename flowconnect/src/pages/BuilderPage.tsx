import { useState, useEffect } from 'react'
import '../styles/BuilderPage.css'
import {
    Clock, Zap, Blocks, ArrowLeft, Play, Save, Plus, Layout,
    Mail, MessageSquare, Repeat, Image, DollarSign, TrendingUp,
    CheckCircle, AlertCircle, Loader, LogIn
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { apiCall, getToken } from '../api/client'

const triggers = [
    { id: 't1', label: 'Payment Alert',  desc: 'Razorpay trigger',        icon: Zap,          color: 'violet', trigger_key: 'razorpay.payment.captured' },
    { id: 't2', label: 'Schedule',       desc: 'Run periodically',        icon: Clock,        color: 'cyan',   trigger_key: 'schedule' },
    { id: 't3', label: 'Form Submit',    desc: 'Typeform / Google Forms',  icon: TrendingUp,   color: 'emerald',trigger_key: 'form.submit' },
    { id: 't4', label: 'CRM Event',      desc: 'Zoho / Freshworks',       icon: DollarSign,   color: 'rose',   trigger_key: 'crm.event' },
    { id: 't5', label: 'Webhook',        desc: 'Custom API endpoint',     icon: Layout,       color: 'amber',  trigger_key: 'webhook' },
]

const actions = [
    { id: 'a1', label: 'WhatsApp',   desc: 'Send WhatsApp message', icon: MessageSquare, color: 'blue',   action_key: 'send_whatsapp' },
    { id: 'a2', label: 'Sheets Row', desc: 'Add to Google Sheets',  icon: Repeat,        color: 'violet', action_key: 'update_sheet' },
    { id: 'a3', label: 'Zoho Lead',  desc: 'Create CRM lead',       icon: DollarSign,    color: 'rose',   action_key: 'add_zoho_lead' },
    { id: 'a4', label: 'Send Email', desc: 'Gmail / Outlook',       icon: Mail,          color: 'emerald',action_key: 'send_email' },
    { id: 'a5', label: 'SMS Alert',  desc: 'Fast2SMS / Twilio',     icon: Image,         color: 'pink',   action_key: 'send_sms' },
    { id: 'a6', label: 'API Call',   desc: 'Custom HTTP Request',   icon: Blocks,        color: 'orange', action_key: 'api_call' },
    { id: 'a7', label: 'Send Email',     desc: 'Gmail confirmation',    icon: Mail,    color: 'teal',   action_key: 'send_gmail' },
    { id: 'a8', label: 'Schedule Call',  desc: 'Google Calendar',       icon: Clock,   color: 'blue',   action_key: 'schedule_meeting' },
]

export default function BuilderPage() {
    const navigate = useNavigate()
    const [selectedTab, setSelectedTab]         = useState<'triggers' | 'actions'>('triggers')
    const [workflowName, setWorkflowName]       = useState('Untitled Workflow')
    const [selectedTrigger, setSelectedTrigger] = useState(triggers[0])
    const [selectedActions, setSelectedActions] = useState([actions[0]])
    const [messageTemplate, setMessageTemplate] = useState(
        'Hi {name}, your payment of ₹{amount} has been received! 🎉\nPayment ID: {payment_id}\nThank you 🙏'
    )
    const [toNumber, setToNumber]   = useState('')
    const [saving, setSaving]       = useState(false)
    const [deploying, setDeploying] = useState(false)
    const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
    const [workflows, setWorkflows] = useState<any[]>([])
    const [isAuthed, setIsAuthed]   = useState(!!getToken())

    useEffect(() => {
        const token = getToken()
        setIsAuthed(!!token)
        if (!token) return
        loadWorkflows()
    }, [])

    async function loadWorkflows() {
        try {
            const data = await apiCall('/workflows/')  // ✅ fixed
            setWorkflows(data)
        } catch {}
    }

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    function addAction(action: typeof actions[0]) {
        if (!selectedActions.find(a => a.id === action.id)) {
            setSelectedActions([...selectedActions, action])
        }
    }

    function removeAction(id: string) {
        setSelectedActions(selectedActions.filter(a => a.id !== id))
    }

    function selectTrigger(trigger: typeof triggers[0]) {
        setSelectedTrigger(trigger)
    }

    function buildPayload() {
        return {
            name: workflowName,
            trigger: selectedTrigger.trigger_key,
            actions: selectedActions.map(a => ({
                type: a.action_key,
                message_template: messageTemplate,
                to_number: toNumber || undefined,
            })),
        }
    }

    async function handleSave() {
        if (!isAuthed) { navigate('/login'); return }
        setSaving(true)
        try {
            await apiCall('/workflows/', {             // ✅ fixed
                method: 'POST',
                body: JSON.stringify(buildPayload()),
            })
            showToast('Workflow saved successfully! ✅', 'success')
            loadWorkflows()
        } catch (err: any) {
            showToast(err.message || 'Save failed', 'error')
        } finally {
            setSaving(false)
        }
    }

    async function handleDeploy() {
        if (!isAuthed) { navigate('/login'); return }
        setDeploying(true)
        try {
            const wf = await apiCall('/workflows/', {  // ✅ fixed
                method: 'POST',
                body: JSON.stringify(buildPayload()),
            })
            await apiCall(`/workflows/${wf.id}/toggle`, { method: 'PATCH' })  // ✅ fixed
            showToast('Workflow deployed & active! 🚀', 'success')
            loadWorkflows()
        } catch (err: any) {
            showToast(err.message || 'Deploy failed', 'error')
        } finally {
            setDeploying(false)
        }
    }

    return (
        <div className="builder-layout">

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: toast.type === 'success' ? '#16a34a' : '#dc2626',
                    padding: '12px 20px', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 14, fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            {!isAuthed && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
                    background: '#fef3c7', borderBottom: '1px solid #f59e0b',
                    padding: '10px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    fontSize: 14, color: '#92400e', fontWeight: 500,
                }}>
                    <AlertCircle size={16} />
                    You are not logged in. Saving workflows requires an account.
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: '#f59e0b', color: '#fff', border: 'none',
                            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                        }}
                    >
                        <LogIn size={14} />
                        Login
                    </button>
                </div>
            )}

            <header className="builder-header" style={{ marginTop: !isAuthed ? 44 : 0 }}>
                <div className="builder-header__left">
                    <Link to="/" className="builder-header__back">
                        <ArrowLeft size={20} />
                    </Link>
                    <input
                        value={workflowName}
                        onChange={e => setWorkflowName(e.target.value)}
                        style={{
                            background: 'transparent', border: 'none', outline: 'none',
                            fontSize: 15, fontWeight: 600, color: 'inherit', minWidth: 200
                        }}
                    />
                </div>
                <div className="builder-header__actions">
                    <button
                        className="btn-secondary"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
                        Save
                    </button>
                    <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={handleDeploy}
                        disabled={deploying}
                    >
                        {deploying ? <Loader size={16} className="spin" /> : <Play size={16} />}
                        Deploy
                    </button>
                </div>
            </header>

            <div className="builder-body">

                <aside className="builder-sidebar">
                    <div className="builder-sidebar__tabs">
                        <div
                            className={`builder-sidebar__tab ${selectedTab === 'triggers' ? 'builder-sidebar__tab--active' : ''}`}
                            onClick={() => setSelectedTab('triggers')}
                        >Triggers</div>
                        <div
                            className={`builder-sidebar__tab ${selectedTab === 'actions' ? 'builder-sidebar__tab--active' : ''}`}
                            onClick={() => setSelectedTab('actions')}
                        >Actions</div>
                    </div>

                    <div className="builder-sidebar__content">
                        {(selectedTab === 'triggers' ? triggers : actions).map((item) => {
                            const Icon = item.icon
                            const isSelected = selectedTab === 'triggers'
                                ? selectedTrigger.id === item.id
                                : selectedActions.some(a => a.id === item.id)
                            return (
                                <div
                                    key={item.id}
                                    className="node-item"
                                    onClick={() => selectedTab === 'triggers'
                                        ? selectTrigger(item as any)
                                        : addAction(item as any)
                                    }
                                    style={{
                                        cursor: 'pointer',
                                        border: isSelected ? '1.5px solid #6366f1' : '',
                                        background: isSelected ? '#eef2ff' : '',
                                    }}
                                >
                                    <div className="node-item__icon" style={{
                                        color: `var(--${item.color}-600)`,
                                        background: `var(--${item.color}-50)`
                                    }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="node-item__info">
                                        <span className="node-item__label">{item.label}</span>
                                        <span className="node-item__desc">{item.desc}</span>
                                    </div>
                                    <Plus size={14} color={isSelected ? '#6366f1' : '#9ca3af'} />
                                </div>
                            )
                        })}
                    </div>

                    {workflows.length > 0 && (
                        <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                            <p style={{
                                fontSize: 11, fontWeight: 600, color: '#9ca3af',
                                marginBottom: 8, textTransform: 'uppercase'
                            }}>
                                Saved Workflows
                            </p>
                            {workflows.map(wf => (
                                <div key={wf.id} style={{
                                    fontSize: 12, padding: '6px 8px', borderRadius: 6,
                                    display: 'flex', justifyContent: 'space-between',
                                    background: wf.status === 'active' ? '#dcfce7' : '#f9fafb',
                                    marginBottom: 4
                                }}>
                                    <span>{wf.name}</span>
                                    <span style={{ color: wf.status === 'active' ? '#16a34a' : '#9ca3af' }}>
                                        {wf.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>

                <main className="builder-canvas">
                    <svg style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        pointerEvents: 'none', zIndex: 0
                    }}>
                        {selectedActions.map((_, i) => (
                            <line key={i}
                                x1="390" y1={160 + i * 120}
                                x2="390" y2={220 + i * 120}
                                stroke="#cbd5e1" strokeWidth="2"
                            />
                        ))}
                    </svg>

                    <div className="canvas-node canvas-node--selected" style={{ left: 280, top: 60 }}>
                        <div className="canvas-node__header">
                            <Zap size={16} />
                            <span style={{ fontWeight: 600 }}>TRIGGER: {selectedTrigger.label}</span>
                        </div>
                        <div className="canvas-node__body">
                            {selectedTrigger.desc}
                        </div>
                    </div>

                    {selectedActions.map((action, i) => {
                        const Icon = action.icon
                        return (
                            <div key={action.id} className="canvas-node" style={{ left: 280, top: 200 + i * 130 }}>
                                <div className="canvas-node__header">
                                    <Icon size={16} />
                                    <span style={{ fontWeight: 600 }}>ACTION: {action.label}</span>
                                    <button
                                        onClick={() => removeAction(action.id)}
                                        style={{
                                            marginLeft: 'auto', background: 'none',
                                            border: 'none', cursor: 'pointer',
                                            color: '#ef4444', fontSize: 16
                                        }}
                                    >×</button>
                                </div>
                                <div className="canvas-node__body">
                                    {action.desc}
                                </div>
                            </div>
                        )
                    })}
                </main>

                <aside className="builder-properties">
                    <div className="builder-properties__header">
                        <h3 className="text-sm font-bold uppercase text-gray-500">Configuration</h3>
                    </div>
                    <div className="builder-properties__content">
                        <div className="auth-form">

                            <label className="auth-form__label">Workflow Name</label>
                            <input
                                type="text"
                                className="auth-form__input"
                                value={workflowName}
                                onChange={e => setWorkflowName(e.target.value)}
                            />

                            <label className="auth-form__label" style={{ marginTop: 16 }}>Trigger</label>
                            <input
                                type="text"
                                className="auth-form__input"
                                value={selectedTrigger.label}
                                readOnly
                                style={{ background: '#f9fafb' }}
                            />

                            <label className="auth-form__label" style={{ marginTop: 16 }}>Actions</label>
                            <input
                                type="text"
                                className="auth-form__input"
                                value={selectedActions.map(a => a.label).join(', ')}
                                readOnly
                                style={{ background: '#f9fafb' }}
                            />

                            <label className="auth-form__label" style={{ marginTop: 16 }}>
                                WhatsApp Number (optional)
                            </label>
                            <input
                                type="text"
                                className="auth-form__input"
                                placeholder="+919876543210"
                                value={toNumber}
                                onChange={e => setToNumber(e.target.value)}
                            />

                            <label className="auth-form__label" style={{ marginTop: 16 }}>
                                Message Template
                            </label>
                            <textarea
                                className="auth-form__input"
                                rows={5}
                                value={messageTemplate}
                                onChange={e => setMessageTemplate(e.target.value)}
                                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                            />
                            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                Variables: {'{name}'} {'{amount}'} {'{payment_id}'} {'{phone}'}
                            </p>

                            <button
                                className="btn-primary"
                                style={{
                                    width: '100%', marginTop: 20, padding: '10px',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: 8
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
    )
}
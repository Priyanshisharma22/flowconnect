import { useState } from 'react'
import {
    Clock, Zap, Blocks, ArrowLeft, Play, Save, Plus, Layout,
    Mail, MessageSquare, Repeat, Image, DollarSign, BarChart3, TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import '../styles/BuilderPage.css'

const triggers = [
    { id: 't1', label: 'Schedule', desc: 'Run periodically', icon: Clock, color: 'cyan' },
    { id: 't2', label: 'Payment Alert', desc: 'Razorpay / Instamojo', icon: Zap, color: 'violet' },
    { id: 't3', label: 'Form Submit', desc: 'Typeform / Google Forms', icon: TrendingUp, color: 'emerald' },
    { id: 't4', label: 'CRM Event', desc: 'Zoho / Freshworks', icon: DollarSign, color: 'rose' },
    { id: 't5', label: 'Webhook', desc: 'Custom API endpoint', icon: Layout, color: 'amber' },
]

const actions = [
    { id: 'a1', label: 'Send Email', desc: 'Gmail / Outlook', icon: Mail, color: 'emerald' },
    { id: 'a2', label: 'WhatsApp', desc: 'Business Notification', icon: MessageSquare, color: 'blue' },
    { id: 'a3', label: 'Sheets Row', desc: 'Add to Google Sheets', icon: Repeat, color: 'violet' },
    { id: 'a4', label: 'SMS Alert', desc: 'Fast2SMS / Twilio', icon: Image, color: 'pink' },
    { id: 'a5', label: 'Discord', desc: 'Post message', icon: MessageSquare, color: 'indigo' },
    { id: 'a6', label: 'API Call', desc: 'Custom HTTP Request', icon: Blocks, color: 'orange' },
]

export default function BuilderPage() {
    const [selectedTab, setSelectedTab] = useState<'triggers' | 'actions'>('triggers')
    const [nodes] = useState([
        { id: 1, type: 'trigger', label: 'Daily Schedule', x: 400, y: 100, selected: true },
        { id: 2, type: 'action', label: 'Send WhatsApp', x: 400, y: 250, selected: false },
    ])

    return (
        <div className="builder-layout">
            {/* Header */}
            <header className="builder-header">
                <div className="builder-header__left">
                    <Link to="/" className="builder-header__back">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="builder-header__title">Untitled Workflow — FlowConnect</div>
                </div>
                <div className="builder-header__actions">
                    <button className="btn-secondary" style={{ padding: '8px 16px' }}>
                        <Save size={16} /> Save
                    </button>
                    <button className="btn-primary" style={{ padding: '8px 16px' }}>
                        <Play size={16} /> Deploy
                    </button>
                </div>
            </header>

            <div className="builder-body">
                {/* Sidebar */}
                <aside className="builder-sidebar">
                    <div className="builder-sidebar__tabs">
                        <div
                            className={`builder-sidebar__tab ${selectedTab === 'triggers' ? 'builder-sidebar__tab--active' : ''}`}
                            onClick={() => setSelectedTab('triggers')}
                        >
                            Triggers
                        </div>
                        <div
                            className={`builder-sidebar__tab ${selectedTab === 'actions' ? 'builder-sidebar__tab--active' : ''}`}
                            onClick={() => setSelectedTab('actions')}
                        >
                            Actions
                        </div>
                    </div>
                    <div className="builder-sidebar__content">
                        {(selectedTab === 'triggers' ? triggers : actions).map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.id} className="node-item">
                                    <div className="node-item__icon" style={{ color: `var(--${item.color}-600)`, background: `var(--${item.color}-50)` }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="node-item__info">
                                        <span className="node-item__label">{item.label}</span>
                                        <span className="node-item__desc">{item.desc}</span>
                                    </div>
                                    <Plus size={14} color="#9ca3af" />
                                </div>
                            )
                        })}
                    </div>
                </aside>

                {/* Canvas */}
                <main className="builder-canvas">
                    {/* Connection Line */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                        <line x1="540" y1="180" x2="540" y2="250" stroke="#cbd5e1" strokeWidth="2" />
                    </svg>

                    {nodes.map((node) => (
                        <div
                            key={node.id}
                            className={`canvas-node ${node.selected ? 'canvas-node--selected' : ''}`}
                            style={{ left: node.x, top: node.y }}
                        >
                            <div className="canvas-node__header">
                                {node.type === 'trigger' ? <Clock size={16} /> : <Zap size={16} />}
                                <span style={{ fontWeight: 600 }}>{node.label}</span>
                            </div>
                            <div className="canvas-node__body">
                                {node.type === 'trigger' ? 'Runs every 24 hours at 00:00 UTC' : 'Sends notification to +91 XXXX XXXX'}
                            </div>
                        </div>
                    ))}
                </main>

                {/* Properties Panel */}
                <aside className="builder-properties">
                    <div className="builder-properties__header">
                        <h3 className="text-sm font-bold uppercase text-gray-500">Configuration</h3>
                    </div>
                    <div className="builder-properties__content">
                        <div className="auth-form">
                            <label className="auth-form__label">Trigger Name</label>
                            <input type="text" className="auth-form__input" defaultValue="Daily Schedule" />

                            <label className="auth-form__label" style={{ marginTop: 16 }}>Frequency</label>
                            <select className="auth-form__input">
                                <option>Every Hour</option>
                                <option>Every 24 Hours</option>
                                <option>Every Week</option>
                            </select>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

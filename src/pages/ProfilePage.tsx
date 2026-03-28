import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    User, CreditCard, Shield, Wallet, LogOut, Zap,
    TrendingUp, Clock, Plus, Trash2, Check, MessageSquare,
    Table, RefreshCw
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { apiCall, logout, getToken } from '../api/client'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
    const [activeTab, setActiveTab]   = useState('overview')
    const [isEditing, setIsEditing]   = useState(false)
    const [user, setUser]             = useState<any>(null)
    const [apps, setApps]             = useState<any[]>([])
    const [workflows, setWorkflows]   = useState<any[]>([])
    const [dashboard, setDashboard]   = useState<any>(null)
    const [loading, setLoading]       = useState(true)
    const [name, setName]             = useState('')
    const [saveMsg, setSaveMsg]       = useState('')

    useEffect(() => {
        if (!getToken()) { window.location.href = '/login'; return }
        loadAll()
    }, [])

    async function loadAll() {
        setLoading(true)
        try {
            const [u, a, w, d] = await Promise.all([
                apiCall('/auth/me'),
                apiCall('/apps/'),
                apiCall('/workflows/'),
                apiCall('/dashboard/'),
            ])
            setUser(u)
            setName(u.name)
            setApps(a)
            setWorkflows(w)
            setDashboard(d)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        try {
            await apiCall('/auth/me', {
                method: 'PUT',
                body: JSON.stringify({ name }),
            })
            setUser({ ...user, name })
            setIsEditing(false)
            setSaveMsg('Saved!')
            setTimeout(() => setSaveMsg(''), 2000)
        } catch (e) {
            setSaveMsg('Failed to save')
        }
    }

    async function handleDisconnect(appName: string) {
        try {
            await apiCall(`/apps/${appName}`, { method: 'DELETE' })
            setApps(apps.filter(a => a.app_name !== appName))
        } catch (e) {}
    }

    async function handleToggleWorkflow(wfId: string) {
        try {
            const updated = await apiCall(`/workflows/${wfId}/toggle`, { method: 'PATCH' })
            setWorkflows(workflows.map(w => w.id === wfId ? updated : w))
        } catch (e) {}
    }

    function handleLogout() {
        logout()
        window.location.href = '/login'
    }

    const appIcons: any = {
        razorpay:      { icon: '💳', label: 'Razorpay',      color: '#2B6CB0' },
        whatsapp:      { icon: '📲', label: 'WhatsApp',      color: '#25D366' },
        google_sheets: { icon: '📊', label: 'Google Sheets', color: '#34A853' },
        zoho:          { icon: '🏢', label: 'Zoho CRM',      color: '#E42527' },
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <p style={{ marginTop: 12, color: '#6b7280' }}>Loading your profile...</p>
            </div>
        </div>
    )

    return (
        <div className="profile-page">
            <Navbar />
            <div className="profile-container">

                {/* Sidebar */}
                <aside className="profile-sidebar">
                    <motion.div className="profile-card profile-user"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="profile-avatar">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <h2 className="profile-name">{user?.name}</h2>
                        <span className="profile-email">{user?.email}</span>
                        <div className="profile-badge">
                            <Zap size={12} fill="currentColor" />
                            {user?.plan?.toUpperCase()} Plan
                        </div>
                    </motion.div>

                    <motion.nav className="profile-card profile-nav"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}>
                        {[
                            { id: 'overview',  icon: User,         label: 'Overview' },
                            { id: 'apps',      icon: Wallet,       label: 'Connected Apps' },
                            { id: 'workflows', icon: RefreshCw,    label: 'Workflows' },
                            { id: 'billing',   icon: CreditCard,   label: 'Billing & Plans' },
                            { id: 'security',  icon: Shield,       label: 'Security' },
                        ].map(({ id, icon: Icon, label }) => (
                            <button key={id}
                                className={`profile-nav-btn ${activeTab === id ? 'active' : ''}`}
                                onClick={() => setActiveTab(id)}>
                                <Icon className="profile-nav-icon" />
                                {label}
                            </button>
                        ))}
                        <div style={{ height: 1, background: 'var(--border-default)', margin: '8px 0' }} />
                        <button className="profile-nav-btn" style={{ color: 'var(--error-500)' }}
                            onClick={handleLogout}>
                            <LogOut className="profile-nav-icon" />
                            Log Out
                        </button>
                    </motion.nav>
                </aside>

                {/* Main Content */}
                <main className="profile-content">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Overview</h1>

                            <div className="profile-stats">
                                <div className="stat-card">
                                    <span className="stat-label">Total Workflows</span>
                                    <div className="stat-value">{dashboard?.total_workflows || 0}</div>
                                    <div className="stat-trend trend-up">
                                        <TrendingUp size={14} />
                                        {dashboard?.active_workflows || 0} active
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Total Executions</span>
                                    <div className="stat-value">{dashboard?.total_executions || 0}</div>
                                    <div className="stat-trend trend-up">
                                        <TrendingUp size={14} />
                                        {dashboard?.successful_executions || 0} success
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Connected Apps</span>
                                    <div className="stat-value">{dashboard?.connected_apps || 0}</div>
                                    <div className="stat-trend">
                                        <Clock size={14} />
                                        Active integrations
                                    </div>
                                </div>
                            </div>

                            <div className="profile-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Account Details</h3>
                                    <button className="btn-secondary"
                                        style={{ padding: '8px 16px', fontSize: 13 }}
                                        onClick={() => setIsEditing(!isEditing)}>
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                </div>
                                <form className="profile-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input type="text" className="form-input"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            disabled={!isEditing} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" className="form-input"
                                            value={user?.email || ''} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Plan</label>
                                        <input type="text" className="form-input"
                                            value={user?.plan?.toUpperCase() || ''} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Member Since</label>
                                        <input type="text" className="form-input"
                                            value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} disabled />
                                    </div>
                                    {isEditing && (
                                        <div style={{ gridColumn: 'span 2', marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <button className="btn-primary" type="button" onClick={handleSave}>
                                                Save Changes
                                            </button>
                                            {saveMsg && <span style={{ color: '#16a34a', fontSize: 13 }}>{saveMsg}</span>}
                                        </div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* CONNECTED APPS TAB */}
                    {activeTab === 'apps' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>Connected Apps</h1>
                                <button className="btn-primary" style={{ padding: '10px 20px' }}
                                    onClick={() => window.location.href = '/builder'}>
                                    <Plus size={16} />
                                    Connect App
                                </button>
                            </div>

                            {apps.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 40 }}>
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>No apps connected yet.</p>
                                    <button className="btn-primary" style={{ marginTop: 16 }}
                                        onClick={() => window.location.href = '/builder'}>
                                        Connect your first app
                                    </button>
                                </div>
                            ) : (
                                <div className="profile-card">
                                    {apps.map(app => {
                                        const info = appIcons[app.app_name] || { icon: '🔌', label: app.app_name, color: '#6366f1' }
                                        return (
                                            <div className="wallet-item" key={app.id}>
                                                <div className="wallet-info">
                                                    <div className="wallet-icon" style={{ fontSize: 24, background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 10 }}>
                                                        {info.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{info.label}</div>
                                                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                                            Connected {new Date(app.connected_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                                                        ✅ Active
                                                    </span>
                                                </div>
                                                <button className="action-btn" title="Disconnect"
                                                    onClick={() => handleDisconnect(app.app_name)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* WORKFLOWS TAB */}
                    {activeTab === 'workflows' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>My Workflows</h1>
                                <button className="btn-primary" style={{ padding: '10px 20px' }}
                                    onClick={() => window.location.href = '/builder'}>
                                    <Plus size={16} />
                                    New Workflow
                                </button>
                            </div>

                            {workflows.length === 0 ? (
                                <div className="profile-card" style={{ textAlign: 'center', padding: 40 }}>
                                    <p style={{ color: '#9ca3af', fontSize: 14 }}>No workflows yet.</p>
                                </div>
                            ) : (
                                <div className="profile-card">
                                    {workflows.map(wf => (
                                        <div key={wf.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{wf.name}</div>
                                                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                                                    Trigger: {wf.trigger} · Runs: {wf.run_count}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{
                                                    background: wf.status === 'active' ? '#dcfce7' : '#f3f4f6',
                                                    color: wf.status === 'active' ? '#16a34a' : '#9ca3af',
                                                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600
                                                }}>
                                                    {wf.status}
                                                </span>
                                                <button onClick={() => handleToggleWorkflow(wf.id)}
                                                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer' }}>
                                                    {wf.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Billing & Plans</h1>
                            <div className="profile-card">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                    {[
                                        { plan: 'Free', price: '₹0', features: '3 workflows, Basic triggers', color: '#6b7280' },
                                        { plan: 'Starter', price: '₹199/mo', features: '10 workflows, WhatsApp + Sheets', color: '#6366f1' },
                                        { plan: 'Pro', price: '₹499/mo', features: 'Unlimited workflows, All integrations', color: '#8b5cf6' },
                                        { plan: 'Business', price: '₹999/mo', features: 'API access, Team features, Priority support', color: '#ec4899' },
                                    ].map(({ plan, price, features, color }) => (
                                        <div key={plan} style={{
                                            border: user?.plan === plan.toLowerCase() ? `2px solid ${color}` : '1px solid #e5e7eb',
                                            borderRadius: 12, padding: 20,
                                            background: user?.plan === plan.toLowerCase() ? `${color}10` : '#fff'
                                        }}>
                                            <div style={{ fontWeight: 700, fontSize: 16, color }}>{plan}</div>
                                            <div style={{ fontSize: 22, fontWeight: 700, margin: '8px 0' }}>{price}</div>
                                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{features}</div>
                                            {user?.plan === plan.toLowerCase() && (
                                                <div style={{ marginTop: 12, fontSize: 12, color, fontWeight: 600 }}>✅ Current Plan</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="profile-section-title">Security</h1>
                            <div className="profile-card">
                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
                                <div className="profile-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <input type="password" className="form-input" placeholder="Enter new password" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Confirm Password</label>
                                        <input type="password" className="form-input" placeholder="Confirm new password" />
                                    </div>
                                </div>
                                <button className="btn-primary" style={{ marginTop: 16 }}>Update Password</button>
                            </div>
                        </motion.div>
                    )}

                </main>
            </div>
            <Footer />
        </div>
    )
}
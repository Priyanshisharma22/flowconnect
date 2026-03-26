import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    CreditCard,
    Shield,
    Wallet,
    LogOut,
    Zap,
    TrendingUp,
    Clock,
    Plus,
    Trash2,
    Copy,
    Check
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import '../styles/ProfilePage.css'

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [isEditing, setIsEditing] = useState(false)
    const [copied, setCopied] = useState(false)

    // Mock Data
    const user = {
        name: 'Alex Developer',
        email: 'alex@algozap.io',
        role: 'Pro Plan',
        avatar: 'AD',
        wallets: [
            { id: 1, type: 'Pera Wallet', address: 'ALGO...K3Y9', isPrimary: true, icon: 'pera' },
            { id: 2, type: 'Defly Wallet', address: 'ALGO...8XJ2', isPrimary: false, icon: 'defly' }
        ]
    }

    const copyAddress = () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="profile-page">
            <Navbar />

            <div className="profile-container">
                {/* Sidebar */}
                <aside className="profile-sidebar">
                    <motion.div
                        className="profile-card profile-user"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="profile-avatar">{user.avatar}</div>
                        <h2 className="profile-name">{user.name}</h2>
                        <span className="profile-email">{user.email}</span>
                        <div className="profile-badge">
                            <Zap size={12} fill="currentColor" />
                            {user.role}
                        </div>
                    </motion.div>

                    <motion.nav
                        className="profile-card profile-nav"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <button
                            className={`profile-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <User className="profile-nav-icon" />
                            Overview
                        </button>
                        <button
                            className={`profile-nav-btn ${activeTab === 'wallets' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wallets')}
                        >
                            <Wallet className="profile-nav-icon" />
                            Connected Wallets
                        </button>
                        <button
                            className={`profile-nav-btn ${activeTab === 'billing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            <CreditCard className="profile-nav-icon" />
                            Billing & Plans
                        </button>
                        <button
                            className={`profile-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <Shield className="profile-nav-icon" />
                            Security
                        </button>
                        <div style={{ height: '1px', background: 'var(--border-default)', margin: '8px 0' }} />
                        <button className="profile-nav-btn" style={{ color: 'var(--error-500)' }}>
                            <LogOut className="profile-nav-icon" />
                            Log Out
                        </button>
                    </motion.nav>
                </aside>

                {/* Main Content */}
                <main className="profile-content">
                    {activeTab === 'overview' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <h1 className="profile-section-title">Overview</h1>

                            {/* Stats */}
                            <div className="profile-stats">
                                <div className="stat-card">
                                    <span className="stat-label">Total Workflows</span>
                                    <div className="stat-value">124</div>
                                    <div className="stat-trend trend-up">
                                        <TrendingUp size={14} />
                                        +12% this month
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Transactions</span>
                                    <div className="stat-value">8.4k</div>
                                    <div className="stat-trend trend-up">
                                        <TrendingUp size={14} />
                                        +5% this week
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-label">Uptime</span>
                                    <div className="stat-value">99.9%</div>
                                    <div className="stat-trend">
                                        <Clock size={14} />
                                        Last 30 days
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="profile-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Account Details</h3>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '8px 16px', fontSize: '13px' }}
                                        onClick={() => setIsEditing(!isEditing)}
                                    >
                                        {isEditing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                </div>

                                <form className="profile-form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            defaultValue={user.name}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            defaultValue={user.email}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Company</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            defaultValue="AlgoZap Inc."
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            defaultValue="New York, USA"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    {isEditing && (
                                        <div style={{ gridColumn: 'span 2', marginTop: '16px' }}>
                                            <button className="btn-primary" type="button" onClick={() => setIsEditing(false)}>Save Changes</button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'wallets' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h1 className="profile-section-title" style={{ margin: 0 }}>Connected Wallets</h1>
                                <button className="btn-primary" style={{ padding: '10px 20px' }}>
                                    <Plus size={16} />
                                    Link Wallet
                                </button>
                            </div>

                            <div className="profile-card">
                                {user.wallets.map(wallet => (
                                    <div className="wallet-item" key={wallet.id}>
                                        <div className="wallet-info">
                                            <div className={`wallet-icon ${wallet.icon}`}>
                                                <Wallet size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'var(--gray-900)' }}>{wallet.type}</div>
                                                <div className="wallet-address">{wallet.address}</div>
                                            </div>
                                            {wallet.isPrimary && (
                                                <span className="wallet-badge primary">Primary</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn" title="Copy Address" onClick={copyAddress}>
                                                {copied ? <Check size={18} color="var(--success-500)" /> : <Copy size={18} />}
                                            </button>
                                            <button className="action-btn" title="Remove Wallet">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    )
}

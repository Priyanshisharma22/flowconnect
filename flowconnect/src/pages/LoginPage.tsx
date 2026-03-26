import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import {
    Zap,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Wallet,
    Blocks,
    Shield,
    Fingerprint,
} from 'lucide-react'
import '../styles/AuthPages.css'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet')

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 2000)
    }

    return (
        <div className="auth-page grid-pattern">
            <Navbar />
            {/* Background Orbs */}
            <div className="auth-page__bg">
                <div className="auth-page__orb auth-page__orb--1" />
                <div className="auth-page__orb auth-page__orb--2" />
                <div className="auth-page__orb auth-page__orb--3" />
            </div>

            {/* Floating Blockchain Nodes */}
            <div className="auth-page__nodes">
                <div className="auth-page__node auth-page__node--1"><Blocks size={16} /></div>
                <div className="auth-page__node auth-page__node--2"><Shield size={14} /></div>
                <div className="auth-page__node auth-page__node--3"><Fingerprint size={14} /></div>
            </div>

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Logo */}
                <Link to="/" className="auth-card__logo" id="auth-logo">
                    <div className="auth-card__logo-icon">
                        <Zap size={20} />
                    </div>
                    <span className="auth-card__logo-text">
                        Algo<span className="gradient-text">Zap</span>
                    </span>
                </Link>

                {/* Header */}
                <motion.div
                    className="auth-card__header"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="auth-card__title">Welcome Back</h1>
                    <p className="auth-card__subtitle">
                        Sign in to manage your Algorand workflows
                    </p>
                </motion.div>

                {/* Tab Switcher */}
                <motion.div
                    className="auth-tabs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <button
                        className={`auth-tabs__btn ${activeTab === 'wallet' ? 'auth-tabs__btn--active' : ''}`}
                        onClick={() => setActiveTab('wallet')}
                        id="tab-wallet"
                    >
                        <Wallet size={16} />
                        Wallet
                    </button>
                    <button
                        className={`auth-tabs__btn ${activeTab === 'email' ? 'auth-tabs__btn--active' : ''}`}
                        onClick={() => setActiveTab('email')}
                        id="tab-email"
                    >
                        <Mail size={16} />
                        Email
                    </button>
                </motion.div>

                {/* Wallet Login */}
                {activeTab === 'wallet' && (
                    <motion.div
                        className="auth-card__wallet-section"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        key="wallet"
                    >
                        <button className="auth-wallet-btn auth-wallet-btn--pera" id="login-pera">
                            <div className="auth-wallet-btn__icon">
                                <Wallet size={20} />
                            </div>
                            <div className="auth-wallet-btn__info">
                                <span className="auth-wallet-btn__name">Pera Wallet</span>
                                <span className="auth-wallet-btn__desc">Connect with Pera</span>
                            </div>
                            <ArrowRight size={16} className="auth-wallet-btn__arrow" />
                        </button>

                        <button className="auth-wallet-btn auth-wallet-btn--defly" id="login-defly">
                            <div className="auth-wallet-btn__icon auth-wallet-btn__icon--defly">
                                <Wallet size={20} />
                            </div>
                            <div className="auth-wallet-btn__info">
                                <span className="auth-wallet-btn__name">Defly Wallet</span>
                                <span className="auth-wallet-btn__desc">Connect with Defly</span>
                            </div>
                            <ArrowRight size={16} className="auth-wallet-btn__arrow" />
                        </button>

                        <button className="auth-wallet-btn auth-wallet-btn--walletconnect" id="login-walletconnect">
                            <div className="auth-wallet-btn__icon auth-wallet-btn__icon--wc">
                                <Blocks size={20} />
                            </div>
                            <div className="auth-wallet-btn__info">
                                <span className="auth-wallet-btn__name">WalletConnect</span>
                                <span className="auth-wallet-btn__desc">Scan QR code</span>
                            </div>
                            <ArrowRight size={16} className="auth-wallet-btn__arrow" />
                        </button>

                        <div className="auth-card__security-note">
                            <Shield size={14} />
                            <span>Your keys stay in your wallet. We never access your private keys.</span>
                        </div>
                    </motion.div>
                )}

                {/* Email Login */}
                {activeTab === 'email' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        key="email"
                    >
                        <form onSubmit={handleEmailLogin} className="auth-form">
                            <div className="auth-form__field">
                                <label className="auth-form__label" htmlFor="login-email">Email Address</label>
                                <div className="auth-form__input-wrapper">
                                    <Mail size={16} className="auth-form__input-icon" />
                                    <input
                                        type="email"
                                        id="login-email"
                                        className="auth-form__input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-form__field">
                                <div className="auth-form__label-row">
                                    <label className="auth-form__label" htmlFor="login-password">Password</label>
                                    <a href="#" className="auth-form__forgot" id="forgot-password">Forgot?</a>
                                </div>
                                <div className="auth-form__input-wrapper">
                                    <Lock size={16} className="auth-form__input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="login-password"
                                        className="auth-form__input"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="auth-form__toggle-pw"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle password"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`btn-primary auth-form__submit ${isLoading ? 'auth-form__submit--loading' : ''}`}
                                id="login-submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="auth-form__spinner" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* Divider */}
                <div className="auth-card__footer">
                    <span className="auth-card__footer-text">
                        Don't have an account?{' '}
                        <Link to="/signup" className="auth-card__footer-link" id="goto-signup">
                            Create one
                        </Link>
                    </span>
                </div>
            </motion.div>

            {/* Bottom Trust */}
            <motion.div
                className="auth-page__trust"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="auth-page__trust-item">
                    <Shield size={14} />
                    End-to-end encrypted
                </div>
                <div className="auth-page__trust-item">
                    <Blocks size={14} />
                    Algorand secured
                </div>
                <div className="auth-page__trust-item">
                    <Lock size={14} />
                    SOC 2 compliant
                </div>
            </motion.div>
        </div>
    )
}

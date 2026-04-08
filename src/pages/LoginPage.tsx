import { loginUser, saveAuth } from '../api/client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Zap,
} from 'lucide-react'
import '../styles/AuthPages.css'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
        const data = await loginUser(email, password)
        saveAuth(data.access_token, data.user)
        navigate('/builder')
    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsLoading(false)
    }
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
                        <span className="gradient-text">Pravah</span>
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
                        Sign in to continue to Pravah
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
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
                             
                            {error && (
                                <div style={{
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    marginBottom: '12px'
                                }}>
                                    {error}
                                </div>
                            )}
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
                    <Lock size={14} />
                    Secure sign in
                </div>
                <div className="auth-page__trust-item">
                    <Mail size={14} />
                    Email based access
                </div>
            </motion.div>
        </div>
    )
}
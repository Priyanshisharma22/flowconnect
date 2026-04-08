import { registerUser, saveAuth } from '../api/client'
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
    Shield,
    User,
    Check,
    Zap,
} 
from 'lucide-react'
import '../styles/AuthPages.css'

export default function SignupPage() {
    const navigate = useNavigate()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const passwordStrength = (() => {
        if (password.length === 0) return { level: 0, label: '', color: '' }
        if (password.length < 6) return { level: 1, label: 'Weak', color: 'var(--error-400)' }
        if (password.length < 10) return { level: 2, label: 'Fair', color: 'var(--warning-400)' }
        const hasUpper = /[A-Z]/.test(password)
        const hasNum = /[0-9]/.test(password)
        const hasSpecial = /[^A-Za-z0-9]/.test(password)
        if (hasUpper && hasNum && hasSpecial) return { level: 4, label: 'Strong', color: 'var(--success-400)' }
        if ((hasUpper && hasNum) || (hasNum && hasSpecial)) return { level: 3, label: 'Good', color: 'var(--primary-400)' }
        return { level: 2, label: 'Fair', color: 'var(--warning-400)' }
    })()

    const [error, setError] = useState('')

    const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) return
    setIsLoading(true)
    setError('')
    try {
        const data = await registerUser(fullName, email, password)
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
                <Link to="/" className="auth-card__logo" id="auth-logo-signup">
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
                    <h1 className="auth-card__title">Create Your Account</h1>
                    <p className="auth-card__subtitle">
                        Create your Pravah account in seconds
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <form onSubmit={handleEmailSignup} className="auth-form">
                            <div className="auth-form__field">
                                <label className="auth-form__label" htmlFor="signup-name">Full Name</label>
                                <div className="auth-form__input-wrapper">
                                    <User size={16} className="auth-form__input-icon" />
                                    <input
                                        type="text"
                                        id="signup-name"
                                        className="auth-form__input"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-form__field">
                                <label className="auth-form__label" htmlFor="signup-email">Email Address</label>
                                <div className="auth-form__input-wrapper">
                                    <Mail size={16} className="auth-form__input-icon" />
                                    <input
                                        type="email"
                                        id="signup-email"
                                        className="auth-form__input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="auth-form__field">
                                <label className="auth-form__label" htmlFor="signup-password">Password</label>
                                <div className="auth-form__input-wrapper">
                                    <Lock size={16} className="auth-form__input-icon" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signup-password"
                                        className="auth-form__input"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
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
                                {/* Password Strength */}
                                {password.length > 0 && (
                                    <div className="auth-form__pw-strength">
                                        <div className="auth-form__pw-bars">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className="auth-form__pw-bar"
                                                    style={{
                                                        background: level <= passwordStrength.level ? passwordStrength.color : 'var(--border-subtle)',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="auth-form__pw-label" style={{ color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Terms */}
                            <label className="auth-form__checkbox-wrapper" htmlFor="signup-terms">
                                <div
                                    className={`auth-form__checkbox ${agreedToTerms ? 'auth-form__checkbox--checked' : ''}`}
                                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                                >
                                    {agreedToTerms && <Check size={12} />}
                                </div>
                                <input
                                    type="checkbox"
                                    id="signup-terms"
                                    className="auth-form__checkbox-input"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                                <span className="auth-form__checkbox-label">
                                    I agree to the <a href="#" className="auth-form__link">Terms of Service</a> and{' '}
                                    <a href="#" className="auth-form__link">Privacy Policy</a>
                                </span>
                            </label>

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
                                id="signup-submit"
                                disabled={isLoading || !agreedToTerms}
                    >
                                {isLoading ? (
                                    <div className="auth-form__spinner" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                    </form>
                </motion.div>

                {/* Footer */}
                <div className="auth-card__footer">
                    <span className="auth-card__footer-text">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-card__footer-link" id="goto-login">
                            Sign in
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
                    <Lock size={14} />
                    Secure account setup
                </div>
            </motion.div>
        </div>
    )
}
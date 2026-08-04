
import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Bell,
    ChevronDown,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Settings,
    Sun,
    User,
    UserCircle2,
    X,
    Zap,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

import './Navbar.css'

type NavLink = {
    label: string
    href: string
    type: 'page' | 'section'
}

const publicNavLinks: NavLink[] = [
    { label: 'Features', href: '/#features', type: 'section' },
    { label: 'Solutions', href: '/about#company', type: 'page' },
    { label: 'Integrations', href: '/#integrations', type: 'section' },
    { label: 'Pricing', href: '/pricing', type: 'page' },
    { label: 'Documentation', href: '/how-it-works', type: 'page' },
    { label: 'Contact', href: '/about#contact', type: 'page' },
]

const privateNavLinks: NavLink[] = [
    { label: 'Dashboard', href: '/dashboard', type: 'page' },
    { label: 'Workspace', href: '/builder', type: 'page' },
    { label: 'Settings', href: '/profile', type: 'page' },
    { label: 'Notifications', href: '/run-history', type: 'page' },
    { label: 'Solutions', href: '/solutions', type: 'page' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement | null>(null)
    const { theme, toggleTheme } = useTheme()
    const { user, logout, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const isHome = location.pathname === '/'
    const navLinks = isAuthenticated ? privateNavLinks : publicNavLinks

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (mobileOpen && mobileMenuRef.current) {
            const focusable = mobileMenuRef.current.querySelectorAll('a, button')
            const first = focusable[0] as HTMLElement
            first?.focus()
        }
    }, [mobileOpen])

    useEffect(() => {
        setMobileOpen(false)
        setProfileOpen(false)
    }, [location.pathname, location.hash])

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, type: string) => {
        setMobileOpen(false)

        if (type === 'section') {
            const hash = href.substring(href.indexOf('#'))

            if (isHome) {
                e.preventDefault()
                const element = document.querySelector(hash)
                if (element) {
                    const navHeight = 80
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                    window.scrollTo({
                        top: elementPosition - navHeight,
                        behavior: 'smooth',
                    })
                }
            }
        }
    }

    const handleLogout = () => {
        logout()
        setProfileOpen(false)
        setMobileOpen(false)
        navigate('/login', { replace: true })
    }

    const getAvatarLabel = () => {
        const source = user?.full_name || user?.email || 'U'
        return source.slice(0, 1).toUpperCase()
    }

    return (
        <motion.nav
            className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="navbar__inner_container" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link to="/" className="navbar__logo" id="navbar-logo">
                    <div className="navbar__logo-icon">
                        <Zap size={20} />
                    </div>
                    <span className="navbar__logo-text">
                        <span className="gradient-text">Pravah</span>
                    </span>
                </Link>

                <div className="navbar__links" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'center' }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="navbar__link"
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, link.href, link.type)}
                            id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="navbar__actions">
                    <div className="navbar__quick-actions">
                        <button
                            onClick={toggleTheme}
                            className="navbar__link navbar__theme-toggle"
                            aria-label="Toggle dark mode"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <div className="navbar__profile">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        className="navbar__profile-btn"
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        aria-label="Profile menu"
                                        aria-expanded={profileOpen}
                                    >
                                        {user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.full_name || user.email}
                                                className="navbar__avatar"
                                            />
                                        ) : (
                                            <div className="navbar__avatar-fallback">
                                                {(user?.full_name ?? user?.email ?? 'U')
                                                    .split(' ')
                                                    .map((word: string) => word[0] || '')
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <ChevronDown size={16} />
                                    </button>
                                    {profileOpen && (
                                        <div className="navbar__profile-dropdown">
                                            <Link to="/profile" onClick={() => setProfileOpen(false)}>
                                                View Profile
                                            </Link>
                                            <Link to="/settings" onClick={() => setProfileOpen(false)}>
                                                Account Settings
                                            </Link>
                                            <Link to="/billing" onClick={() => setProfileOpen(false)}>
                                                Billing
                                            </Link>
                                            <Link to="/notifications" onClick={() => setProfileOpen(false)}>
                                                Notifications
                                            </Link>
                                            <Link to="/workspace" onClick={() => setProfileOpen(false)}>
                                                Workspace Settings
                                            </Link>
                                            <button type="button" onClick={handleLogout}>
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                location.pathname !== '/login' &&
                                location.pathname !== '/signup' && (
                                    <Link
                                        to="/login"
                                        className="navbar__profile-btn navbar__profile-link"
                                        aria-label="Sign in"
                                    >
                                        <User size={18} />
                                    </Link>
                                )
                            )}
                        </div>

                        {!isAuthenticated ? (
                            <>
                                <Link to="/login" className="navbar__link" id="nav-login">
                                    Login
                                </Link>
                                <Link to="/signup" className="btn-primary navbar__cta" id="nav-get-started">
                                    <Zap size={16} />
                                    Sign Up
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/profile"
                                    className="navbar__link"
                                    id="nav-profile"
                                    aria-label="Profile"
                                    style={{ gap: 8, paddingInline: 12 }}
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <UserCircle2 size={18} />
                                        <span
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '999px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'var(--gradient-primary)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: 12,
                                            }}
                                        >
                                            {getAvatarLabel()}
                                        </span>
                                    </span>
                                </Link>
                                <button
                                    type="button"
                                    className="navbar__link"
                                    id="nav-logout"
                                    onClick={handleLogout}
                                    style={{ border: 'none', background: 'transparent', gap: 8 }}
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <button
                    className="navbar__toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                    id="navbar-toggle"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        ref={mobileMenuRef}
                        className="navbar__mobile"
                        role="dialog"
                        aria-label="Mobile navigation menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="navbar__mobile-link"
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, link.href, link.type)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="navbar__mobile-actions">
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="btn-secondary navbar__full-width"
                            >
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                                Toggle theme
                            </button>
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="btn-secondary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/builder"
                                        className="btn-secondary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <FolderKanban size={16} />
                                        Workspace
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="btn-secondary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <Settings size={16} />
                                        Settings
                                    </Link>
                                    <Link
                                        to="/run-history"
                                        className="btn-secondary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <Bell size={16} />
                                        Notifications
                                    </Link>
                                    <button type="button" className="btn-primary navbar__full-width" onClick={handleLogout}>
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="btn-secondary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="btn-primary navbar__full-width"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <Zap size={16} />
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

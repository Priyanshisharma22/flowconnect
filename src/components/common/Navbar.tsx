import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, Sun, Moon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import './Navbar.css'

const navLinks = [
    { label: 'About', href: '/about', type: 'page' },
    { label: 'Features', href: '/#features', type: 'section' },
    { label: 'How It Works', href: '/how-it-works', type: 'page' },
    { label: 'Integrations', href: '/#integrations', type: 'section' },
    { label: 'Pricing', href: '/pricing', type: 'page' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement | null>(null)
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const isHome = location.pathname === '/'
    const isBuilder = location.pathname.startsWith('/builder')

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

    if (isBuilder) return null

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, type: string) => {
        setMobileOpen(false)

        if (type === 'section') {
            // Extract hash from href (e.g., "/#features" -> "#features")
            const hash = href.substring(href.indexOf('#'))

            if (isHome) {
                e.preventDefault()
                const element = document.querySelector(hash)
                if (element) {
                    const navHeight = 80
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                    window.scrollTo({
                        top: elementPosition - navHeight,
                        behavior: 'smooth'
                    })
                }
            }
            // If not home, normal navigation to /#hash works via Link
        }
        // Pages (type === 'page') follow normal Link behavior
    }

    return (
        <motion.nav
            className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="navbar__inner container">
                {/* Logo */}
                <Link to="/" className="navbar__logo" id="navbar-logo">
                    <div className="navbar__logo-icon">
                        <Zap size={20} />
                    </div>
                    <span className="navbar__logo-text">
                        <span className="gradient-text">Pravah</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="navbar__links">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="navbar__link"
                            onClick={(e) => handleNavClick(e, link.href, link.type || 'section')}
                            id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTA */}
                <div className="navbar__actions">
                    <div className="navbar__quick-actions">
                        <button 
                            onClick={toggleTheme} 
                            className="navbar__link navbar__theme-toggle" 
                            aria-label="Toggle dark mode"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link to="/profile" className="navbar__link" id="nav-profile">Profile</Link>
                        <Link to="/login" className="navbar__link" id="nav-login">Log In</Link>
                    </div>
                    <Link to="/signup" className="btn-primary navbar__cta" id="nav-get-started">
                        <Zap size={16} />
                        Get Started
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="navbar__toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                    id="navbar-toggle"
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
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
                                onClick={(e) => handleNavClick(e, link.href, link.type || 'section')}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="navbar__mobile-actions">
                            <Link to="/profile" className="btn-secondary  navbar__full-width"  onClick={() => setMobileOpen(false)}>Profile</Link>
                            <Link to="/login" className="btn-secondary  navbar__full-width"  onClick={() => setMobileOpen(false)}>Log In</Link>
                            <Link to="/signup" className="btn-primary  navbar__full-width"  onClick={() => setMobileOpen(false)}>
                                <Zap size={16} />
                                Get Started
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

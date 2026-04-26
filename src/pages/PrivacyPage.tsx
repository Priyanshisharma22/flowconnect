import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Shield, Zap, Database, Users, Lock, Eye } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import '../styles/AuthPages.css'

export default function PrivacyPage() {
    const sections = [
        {
            icon: Database,
            title: 'Data Collection',
            content: [
                'We collect basic account information including name, email, and password hash.',
                'Workflow data includes operational details from connected integrations.',
                'Usage analytics may be collected to improve service quality.'
            ]
        },
        {
            icon: Users,
            title: 'Data Usage',
            content: [
                'Account data is used to authenticate users and provide personalized services.',
                'Integration data enables workflow automation and data synchronization.',
                'Analytics help us understand usage patterns and improve features.'
            ]
        },
        {
            icon: Lock,
            title: 'Data Security',
            content: [
                'All data is encrypted in transit and at rest using industry-standard protocols.',
                'Passwords are hashed using secure algorithms and never stored in plain text.',
                'Access to user data is strictly controlled and monitored.'
            ]
        },
        {
            icon: Eye,
            title: 'Data Sharing',
            content: [
                'We do not sell or rent personal data to third parties.',
                'Data may be shared with integrated services as required for functionality.',
                'Legal requests for data will be handled in accordance with applicable laws.'
            ]
        }
    ]

    return (
        <div className="auth-page grid-pattern">
            <Navbar />
            <div className="auth-page__bg">
                <div className="auth-page__orb auth-page__orb--1" />
                <div className="auth-page__orb auth-page__orb--2" />
                <div className="auth-page__orb auth-page__orb--3" />
            </div>

            <motion.div
                className="auth-card auth-card--wide"
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <Link to="/" className="auth-card__logo">
                    <div className="auth-card__logo-icon">
                        <Zap size={20} />
                    </div>
                    <span className="auth-card__logo-text">
                        <span className="gradient-text">Pravah</span>
                    </span>
                </Link>

                <div className="auth-legal__eyebrow">
                    <Shield size={14} />
                    Privacy Policy
                </div>
                <h1 className="auth-card__title auth-legal__title">Privacy Policy</h1>
                <p className="auth-card__subtitle auth-legal__subtitle">
                    Your privacy is important to us. This policy explains how we collect, use, and protect your data.
                </p>

                <div className="auth-legal__content">
                    {sections.map((section, index) => {
                        const Icon = section.icon
                        return (
                            <motion.section
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                style={{ marginBottom: '2rem' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                    <Icon size={20} style={{ marginRight: '0.5rem', color: 'var(--accent-primary)' }} />
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{section.title}</h2>
                                </div>
                                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                    {section.content.map((item, i) => (
                                        <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.6' }}>{item}</li>
                                    ))}
                                </ul>
                            </motion.section>
                        )
                    })}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: sections.length * 0.1 }}
                    >
                        <h2>Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us through our support channels.
                        </p>
                    </motion.section>
                </div>

                <div className="auth-card__footer">
                    <span className="auth-card__footer-text">
                        Want the usage rules too?{' '}
                        <Link to="/terms" className="auth-card__footer-link">
                            Read the terms page
                        </Link>
                    </span>
                </div>
            </motion.div>
        </div>
    )
}

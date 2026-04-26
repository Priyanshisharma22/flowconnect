import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileText, Zap, UserCheck, AlertTriangle, Code, Scale } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import '../styles/AuthPages.css'

export default function TermsPage() {
    const sections = [
        {
            icon: UserCheck,
            title: 'User Accounts',
            content: [
                'You must provide accurate and complete information when creating an account.',
                'You are responsible for maintaining the confidentiality of your account credentials.',
                'Notify us immediately of any unauthorized use of your account.'
            ]
        },
        {
            icon: AlertTriangle,
            title: 'Acceptable Use',
            content: [
                'Use the service only for lawful purposes and in compliance with applicable laws.',
                'Do not attempt to gain unauthorized access to our systems or other users\' data.',
                'Respect rate limits and usage guidelines of integrated third-party services.'
            ]
        },
        {
            icon: Code,
            title: 'Service Availability',
            content: [
                'We strive to provide reliable service but do not guarantee uninterrupted availability.',
                'Maintenance, updates, or unforeseen issues may temporarily affect service access.',
                'We are not liable for any damages resulting from service interruptions.'
            ]
        },
        {
            icon: Scale,
            title: 'Limitation of Liability',
            content: [
                'Our service is provided "as is" without warranties of any kind.',
                'We are not responsible for losses resulting from third-party integrations.',
                'Our total liability is limited to the amount paid for the service in the past 12 months.'
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
                    <FileText size={14} />
                    Terms of Service
                </div>
                <h1 className="auth-card__title auth-legal__title">Terms of Service</h1>
                <p className="auth-card__subtitle auth-legal__subtitle">
                    These terms govern your use of Pravah. By using our service, you agree to these terms.
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
                        <h2>Changes to Terms</h2>
                        <p>
                            We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.
                        </p>
                    </motion.section>
                </div>

                <div className="auth-card__footer">
                    <span className="auth-card__footer-text">
                        Need the privacy details too?{' '}
                        <Link to="/privacy" className="auth-card__footer-link">
                            Read the privacy page
                        </Link>
                    </span>
                </div>
            </motion.div>
        </div>
    )
}

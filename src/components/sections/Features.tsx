import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
    Zap,
    MessageSquare,
    CreditCard,
    Database,
    Bell,
    Layers,
    ShieldCheck,
    Smartphone,
    TrendingUp
} from 'lucide-react'
import './Features.css'

const features = [
    {
        icon: MessageSquare,
        title: 'WhatsApp Automation',
        description: 'Send automated order updates, receipts, and marketing alerts via WhatsApp Business API.',
        color: 'emerald',
    },
    {
        icon: CreditCard,
        title: 'Razorpay Integration',
        description: 'Trigger workflows instantly on successful payments, refunds, or subscription updates.',
        color: 'blue',
    },
    {
        icon: Database,
        title: 'Zoho & Google Sheets',
        description: 'Sync customer data and leads effortlessly across Zoho CRM, Google Sheets, and Airtable.',
        color: 'violet',
    },
    {
        icon: Smartphone,
        title: 'SMS & OTP Delivery',
        description: 'Fast and reliable SMS delivery for Indian numbers with local operator optimizations.',
        color: 'rose',
    },
    {
        icon: Layers,
        title: 'Multi-Step Logic',
        description: 'Build complex conditional paths and data transformations with zero coding required.',
        color: 'cyan',
    },
    {
        icon: ShieldCheck,
        title: 'Enterprise Security',
        description: 'Bank-grade encryption for all your API keys and sensitive customer data.',
        color: 'emerald',
    },
    {
        icon: Bell,
        title: 'Real-Time Alerts',
        description: 'Get notified via Telegram, Email, or Slack whenever a workflow fails or succeeds.',
        color: 'violet',
    },
    {
        icon: TrendingUp,
        title: 'Visual Insights',
        description: 'Track your automation ROI with beautiful dashboards and execution analytics.',
        color: 'rose',
    },
    {
        icon: Zap,
        title: 'Instant Playbooks',
        description: 'Use pre-built templates for common Indian business scenarios like E-commerce and Logistics.',
        color: 'amber',
    },
]

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Features() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section className="features section" id="features">
            <div className="container">
                <motion.div
                    className="features__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="features-badge">
                        <Zap size={14} />
                        Features
                    </div>
                    <h2 className="section-title">
                        Everything needed for <span className="gradient-text">Indian Automation</span>
                    </h2>
                    <p className="section-subtitle">
                        Connect your favorite Indian apps and services to create powerful, 
                        automated business systems in minutes.
                    </p>
                </motion.div>

                <motion.div
                    className="features__grid"
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                >
                    {features.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={i}
                                className="features__card glass-card"
                                variants={itemVariants}
                                id={`feature-card-${i}`}
                            >
                                <div className={`features__card-icon features__card-icon--${feature.color}`}>
                                    <Icon size={22} />
                                </div>
                                <h3 className="features__card-title">{feature.title}</h3>
                                <p className="features__card-desc">{feature.description}</p>
                                <div className={`features__card-glow features__card-glow--${feature.color}`} />
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

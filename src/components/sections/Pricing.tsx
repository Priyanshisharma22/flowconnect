import { motion } from 'framer-motion'
import { Check, Zap, Rocket, Sparkles } from 'lucide-react'
import './Pricing.css'

const plans = [
    {
        name: 'Free',
        price: '0',
        period: '/month',
        description: 'Perfect for small businesses and explorers.',
        icon: Zap,
        color: 'cyan',
        popular: false,
        features: [
            '100 tasks / month',
            '5 active workflows',
            'Standard apps (Gmail, Sheets)',
            'WhatsApp (10 messages)',
            'Community support',
            'Basic logs',
        ],
    },
    {
        name: 'Pro',
        price: '999',
        period: '/month',
        description: 'For growing businesses needing scale.',
        icon: Rocket,
        color: 'violet',
        popular: true,
        features: [
            '5,000 tasks / month',
            'Unlimited active workflows',
            'All Premium Apps',
            'Razorpay & Zoho Priority',
            'Priority Email Support',
            'Advanced Error Handling',
            'Custom Webhooks',
            'Multi-step Workflows',
        ],
    },
    {
        name: 'Business',
        price: '2999',
        period: '/month',
        description: 'High-volume automation for large teams.',
        icon: Sparkles,
        color: 'emerald',
        popular: false,
        features: [
            '50,000 tasks / month',
            'Dedicated Account Manager',
            'SLA Guarantee',
            'SSO & Team Access',
            'Custom API Builder',
            'On-boarding assistance',
            'White-label options',
            'Quarterly security audits',
        ],
    },
]

export default function Pricing() {
    return (
        <section className="pricing section" id="pricing">
            <div className="container">
                <motion.div
                    className="pricing__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="pricing-badge">
                        <Zap size={14} />
                        Pricing
                    </div><br></br>
                    <h2 className="section-title">
                        Simple, <span className="gradient-text">Affordable</span> Plans
                    </h2>
                    <p className="section-subtitle">
                        Pricing designed for Bharat. No hidden charges.
                        Cancel or upgrade anytime.
                    </p>
                </motion.div>

                <div className="pricing__grid">
                    {plans.map((plan, i) => {
                        const Icon = plan.icon
                        return (
                            <motion.div
                                key={plan.name}
                                className={`pricing__card ${plan.popular ? 'pricing__card--popular' : ''}`}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.12 }}
                                id={`pricing-${plan.name.toLowerCase()}`}
                            >
                                {plan.popular && (
                                    <div className="pricing__popular-badge">Most Popular</div>
                                )}
                                <div className={`pricing__card-icon pricing__card-icon--${plan.color}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="pricing__card-name">{plan.name}</h3>
                                <p className="pricing__card-desc">{plan.description}</p>
                                <div className="pricing__card-price">
                                    <span className="pricing__card-currency">₹</span>
                                    <span className="pricing__card-amount">{plan.price}</span>
                                    {plan.period && (
                                        <span className="pricing__card-period">{plan.period}</span>
                                    )}
                                </div>
                                <ul className="pricing__card-features">
                                    {plan.features.map((f, fi) => (
                                        <li key={fi} className="pricing__card-feature">
                                            <Check size={16} className={`pricing__check-icon pricing__check-icon--${plan.color}`} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className={plan.popular ? 'btn-primary pricing__card-btn' : 'btn-secondary pricing__card-btn'}
                                    id={`pricing-btn-${plan.name.toLowerCase()}`}
                                >
                                    Get Started
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Local Payments */}
                <motion.div
                    className="pricing__crypto-note"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Zap size={16} />
                    <span>
                        Securely pay via <strong>UPI</strong>, <strong>Net Banking</strong>, or <strong>Cards</strong>.
                        Save 20% on Annual billing.
                    </span>
                </motion.div>
            </div>
        </section>
    )
}

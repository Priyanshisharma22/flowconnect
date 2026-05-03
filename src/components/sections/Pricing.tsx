import { motion } from 'framer-motion'
import { Check, Zap, Rocket, Sparkles } from 'lucide-react'
import './Pricing.css'

type PlanColor = 'cyan' | 'violet' | 'emerald'

interface PricingPlan {
  id: string
  name: string
  price: string
  period?: string
  description: string
  icon: React.ElementType
  color: PlanColor
  popular?: boolean
  features: string[]
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: '/month',
    description: 'Perfect for small businesses and explorers.',
    icon: Zap,
    color: 'cyan',
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
    id: 'pro',
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
    id: 'business',
    name: 'Business',
    price: '2999',
    period: '/month',
    description: 'High-volume automation for large teams.',
    icon: Sparkles,
    color: 'emerald',
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
  const handlePlanClick = (planId: string) => {
    console.log('Selected plan:', planId)
    // later: route / checkout / modal trigger
  }

  return (
    <section className="pricing section" id="pricing">
      <div className="container">

        {/* HEADER */}
        <motion.div
          className="pricing__header"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge">
            <Zap size={14} />
            Pricing
          </div>

          <h2 className="section-title">
            Simple, <span className="gradient-text">Affordable</span> Plans
          </h2>

          <p className="section-subtitle">
            Pricing designed for Bharat. No hidden charges. Upgrade or cancel anytime.
          </p>
        </motion.div>

        {/* GRID */}
        <div className="pricing__grid">
          {plans.map((plan, i) => {
            const Icon = plan.icon

            return (
              <motion.div
                key={plan.id}
                className={`pricing__card ${plan.popular ? 'pricing__card--popular' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >

                {plan.popular && (
                  <div className="pricing__popular-badge">
                    Most Popular
                  </div>
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
                  {plan.features.map((feature) => (
                    <li key={feature} className="pricing__card-feature">
                      <Check size={16} className={`pricing__check-icon pricing__check-icon--${plan.color}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={plan.popular ? 'btn-primary pricing__card-btn' : 'btn-secondary pricing__card-btn'}
                  onClick={() => handlePlanClick(plan.id)}
                >
                  Get Started
                </button>

              </motion.div>
            )
          })}
        </div>

        {/* PAYMENT NOTE */}
        <motion.div
          className="pricing__crypto-note"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Zap size={16} />
          <span>
            Secure payments via <strong>UPI</strong>, <strong>Net Banking</strong>, or <strong>Cards</strong>.
            Save 20% on annual billing.
          </span>
        </motion.div>

      </div>
    </section>
  )
}
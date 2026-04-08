import { motion } from 'framer-motion'
import { Rocket, MousePointerClick, Zap, Share2, ArrowDown } from 'lucide-react'
import './HowItWorks.css'

const steps = [
    {
        number: '01',
        icon: MousePointerClick,
        title: 'Select Your Trigger',
        description: 'Choose from 500+ Indian apps like Razorpay, WhatsApp, or SMS. No coding required.',
        color: 'cyan',
    },
    {
        number: '02',
        icon: Zap,
        title: 'Build Your Workflow',
        description: 'Drag-and-drop actions, conditions, and filters. Connect your business tools visually.',
        color: 'violet',
    },
    {
        number: '03',
        icon: Share2,
        title: 'Connect Integrations',
        description: 'Securely link your accounts with Pravah for instant data synchronization.',
        color: 'emerald',
    },
    {
        number: '04',
        icon: Rocket,
        title: 'Automate & Scale',
        description: 'Sit back and watch. Your manual tasks are now handled automatically in real-time.',
        color: 'amber',
    },
]

export default function HowItWorks() {
    return (
        <section className="how-it-works section" id="how-it-works">
            <div className="container">
                <motion.div
                    className="how-it-works__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="how-it-works-badge">
                        <Zap size={14} />
                        How It Works
                    </div>
                    <h2 className="section-title">
                        From Idea to <span className="gradient-text">Automation</span> in Minutes
                    </h2>
                    <p className="section-subtitle">
                        Building workflows for your Indian business has never been easier. 
                        Four simple steps to unlimited productivity.
                    </p>
                </motion.div>

                <div className="how-it-works__steps">
                    {steps.map((step, i) => {
                        const Icon = step.icon
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.6, delay: i * 0.15 }}
                            >
                                <div className={`how-it-works__step`} id={`step-${i}`}>
                                    <div className={`how-it-works__step-number how-it-works__step-number--${step.color}`}>
                                        {step.number}
                                    </div>
                                    <div className={`how-it-works__step-icon how-it-works__step-icon--${step.color}`}>
                                        <Icon size={28} />
                                    </div>
                                    <div className="how-it-works__step-content">
                                        <h3 className="how-it-works__step-title">{step.title}</h3>
                                        <p className="how-it-works__step-desc">{step.description}</p>
                                    </div>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="how-it-works__connector">
                                        <div className="how-it-works__connector-line" />
                                        <ArrowDown size={16} className="how-it-works__connector-arrow" />
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

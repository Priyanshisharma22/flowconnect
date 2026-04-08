import { motion } from 'framer-motion'
import { Coins, Image, Vote, Bell, Repeat, Code2 } from 'lucide-react'
import './UseCases.css'

const cases = [
    {
        title: 'Payment Follow-ups',
        desc: 'Automatically send reminders and updates after payment events to reduce manual follow-ups and missed collections.',
        icon: Coins,
        color: 'cyan',
        tag: 'Finance',
    },
    {
        title: 'Lead Routing',
        desc: 'Route new leads to the right team instantly based on source, region, or priority.',
        icon: Image,
        color: 'violet',
        tag: 'Sales',
    },
    {
        title: 'Approval Workflows',
        desc: 'Trigger approval chains for budgets, invoices, or requests and notify the next approver automatically.',
        icon: Vote,
        color: 'emerald',
        tag: 'Operations',
    },
    {
        title: 'Whale Alerts',
        desc: 'Monitor specific addresses or ASAs. Get a Telegram or Discord notification whenever a large transaction occurs.',
        icon: Bell,
        color: 'rose',
        tag: 'Monitoring',
    },
    {
        title: 'Recurring Tasks',
        desc: 'Schedule recurring messages, reports, or updates so routine work runs automatically.',
        icon: Repeat,
        color: 'amber',
        tag: 'Scheduling',
    },
    {
        title: 'Integration Testing',
        desc: 'Chain multiple API steps to validate end-to-end workflows before rolling them into production.',
        icon: Code2,
        color: 'blue',
        tag: 'Dev Tools',
    },
]

export default function UseCases() {
    return (
        <section className="use-cases section" id="use-cases">
            <div className="container">
                <motion.div
                    className="use-cases__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge">
                        <Repeat size={14} />
                        Use Cases
                    </div>
                    <h2 className="section-title">
                        What Can You <span className="gradient-text">Build</span>?
                    </h2>
                    <p className="section-subtitle">
                        From simple notifications to complex multi-step financial operations,
                        Pravah powers a wide range of automation use cases.
                    </p>
                </motion.div>

                <div className="use-cases__grid">
                    {cases.map((item, i) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={i}
                                className="use-cases__card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <div className={`use-cases__icon use-cases__icon--${item.color}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="use-cases__title">{item.title}</h3>
                                <p className="use-cases__desc">{item.desc}</p>
                                <span className="use-cases__tag">{item.tag}</span>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

import { motion } from 'framer-motion'
import {
  Coins,
  Image,
  Vote,
  Bell,
  Repeat,
  Code2,
  MessageSquare,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Zap
} from 'lucide-react'
import './UseCases.css'

const useCases = [
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
    desc: 'Monitor addresses or assets and get instant alerts for large transactions.',
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
    desc: 'Chain multiple API steps to validate end-to-end workflows before production.',
    icon: Code2,
    color: 'blue',
    tag: 'Dev Tools',
  },
  {
    title: 'WhatsApp Notifications',
    desc: 'Send automated WhatsApp messages for order confirmations and updates.',
    icon: MessageSquare,
    color: 'green',
    tag: 'Communication',
  },
  {
    title: 'Invoice Generation',
    desc: 'Automatically generate and send invoices when payments are received.',
    icon: FileText,
    color: 'indigo',
    tag: 'Finance',
  },
  {
    title: 'Subscription Management',
    desc: 'Handle renewals, cancellations, and recurring billing seamlessly.',
    icon: CreditCard,
    color: 'purple',
    tag: 'Finance',
  },
  {
    title: 'CRM Updates',
    desc: 'Sync customer data across forms, payments, and CRM systems.',
    icon: Users,
    color: 'teal',
    tag: 'CRM',
  },
  {
    title: 'Accounting Automation',
    desc: 'Push transactions to accounting tools for real-time bookkeeping.',
    icon: BarChart3,
    color: 'orange',
    tag: 'Accounting',
  },
  {
    title: 'Form Data Processing',
    desc: 'Validate and process form submissions and trigger automated workflows.',
    icon: Zap,
    color: 'red',
    tag: 'Data',
  },
]

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0 },
}

export default function UseCases() {
  return (
    <section className="use-cases section" id="use-cases">
      <div className="container">

        {/* Header */}
        <motion.div
          className="use-cases__header"
          initial={{ opacity: 0, y: 25 }}
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
            From simple notifications to complex multi-step workflows,
            automation powers everything.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="use-cases__grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {useCases.map((item) => {
            const Icon = item.icon

            return (
              <motion.article
                key={item.title}
                className="use-cases__card"
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 200 }}
                aria-label={item.title}
              >
                <div className={`use-cases__icon use-cases__icon--${item.color}`}>
                  <Icon size={22} />
                </div>

                <h3 className="use-cases__title">{item.title}</h3>

                <p className="use-cases__desc">{item.desc}</p>

                <span className="use-cases__tag">{item.tag}</span>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
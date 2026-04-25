import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Zap } from 'lucide-react'
import './Integrations.css'

const indianApps = [
    { name: 'Razorpay', category: 'Payments', color: '#3395FF' },
    { name: 'WhatsApp', category: 'Messaging', color: '#25D366' },
    { name: 'Zoho CRM', category: 'Sales', color: '#F1B22B' },
    { name: 'Freshworks', category: 'Support', color: '#0052CC' },
    { name: 'Shiprocket', category: 'Logistics', color: '#7E3AF2' },
    { name: 'Instamojo', category: 'Payments', color: '#00BFA5' },
    { name: 'Groww', category: 'Fintech', color: '#00D09C' },
    { name: 'Khatabook', category: 'Finance', color: '#F44336' },
]

const globalApps = [
    { name: 'Google Sheets', category: 'Spreadsheet' },
    { name: 'Slack', category: 'Communication' },
    { name: 'Gmail', category: 'Email' },
    { name: 'Notion', category: 'Ops' },
    { name: 'Airtable', category: 'Database' },
    { name: 'Calendly', category: 'Scheduling' },
    { name: 'Mailchimp', category: 'Marketing' },
    { name: 'Typeform', category: 'Forms' },
]

const developerTools = [
    { name: 'Webhook', category: 'API' },
    { name: 'JSON Parser', category: 'Utility' },
    { name: 'HTTP Request', category: 'Custom API' },
    { name: 'JavaScript', category: 'Code Node' },
    { name: 'Telegram Bot', category: 'Dev' },
    { name: 'Discord', category: 'Dev' },
]

export default function Integrations() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section className="integrations section" id="integrations">
            <div className="container">
                <motion.div
                    className="integrations__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="integrations-badge">
                        <Zap size={14} />
                        Integrations
                    </div>
                    <h2 className="section-title">
                        Connect Your Entire <span className="gradient-text">Business Stack</span>
                    </h2>
                    <p className="section-subtitle">
                        From Indian payment gateways to global CRM tools — 
                        Pravah bridges the gap between your favorite apps.
                    </p>
                </motion.div>

                <div className="integrations__content" ref={ref}>
                    {/* Indian Apps */}
                    <motion.div
                        className="integrations__section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="integrations__section-title">
                           <span className="integrations__section-dot integrations__section-dot--orange" />
                            Popular Indian Apps
                        </h3>
                        <div className="integrations__chains">
                            {indianApps.map((app, i) => (
                                <motion.div
                                    key={app.name}
                                    className="integrations__chain-card glass-card"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                    transition={{ duration: 0.4, delay: i * 0.06 }}
                                >
                                    <div
                                        className="integrations__chain-avatar"
                                        style={{ background: `${app.color}22`, color: app.color }}
                                    >
                                        {app.name.charAt(0)}
                                    </div>
                                    <div className="integrations__chain-name">{app.name}</div>
                                    <div className="integrations__chain-symbol">{app.category}</div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Global Apps */}
                    <motion.div
                        className="integrations__section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        <h3 className="integrations__section-title">
                            <span className="integrations__section-dot" style={{ background: '#6366f1' }} />
                            Global Productivity
                        </h3>
                        <div className="integrations__tags">
                            {globalApps.map((p, i) => (
                                <motion.div
                                    key={p.name}
                                    className="integrations__tag"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.3, delay: 0.2 + i * 0.04 }}
                                >
                                    <span className="integrations__tag-name">{p.name}</span>
                                    <span className="integrations__tag-cat">{p.category}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Dev Tools */}
                    <motion.div
                        className="integrations__section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h3 className="integrations__section-title">
                            <span className="integrations__section-dot" style={{ background: '#10b981' }} />
                            Developer Utilities
                        </h3>
                        <div className="integrations__tags">
                            {developerTools.map((t, i) => (
                                <motion.div
                                    key={t.name}
                                    className="integrations__tag integrations__tag--tools"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                                >
                                    <span className="integrations__tag-name">{t.name}</span>
                                    <span className="integrations__tag-cat">{t.category}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

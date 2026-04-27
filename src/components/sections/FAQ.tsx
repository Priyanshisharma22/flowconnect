import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, Search } from 'lucide-react'
import './FAQ.css'

interface FAQ {
    question: string
    answer: string
    category: 'getting-started' | 'security' | 'technical' | 'integrations' | 'support' | 'account'
}

const faqs: FAQ[] = [
    {
        question: 'Do I need a card to start?',
        answer: 'No. You can start with a free plan and explore core workflow features before upgrading. Create workflows, test integrations, and experience the full builder interface without any payment required.',
        category: 'getting-started',
    },
    {
        question: 'Is there a free trial?',
        answer: 'Yes. Our free plan gives you full access to the workflow builder, basic integrations, and a generous execution limit. No credit card required to get started.',
        category: 'getting-started',
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes. Pravah uses secure, encrypted API-based integrations and keeps your credentials protected with industry-standard encryption. You maintain full control over connected apps and can revoke access anytime. We never store your sensitive data on our servers.',
        category: 'security',
    },
    {
        question: 'Can I automate custom API calls?',
        answer: 'Absolutely. You can trigger HTTP/API steps with full support for GET, POST, PUT, DELETE, and PATCH methods. Pass dynamic values from previous steps, use custom headers, and transform responses with ease.',
        category: 'technical',
    },
    {
        question: 'What happens if a workflow fails?',
        answer: 'If a step fails, the workflow stops and you are notified immediately via email, Telegram, Discord, or Slack. Detailed execution logs are available in your dashboard, showing exactly where and why the failure occurred. You can retry failed workflows with one click.',
        category: 'technical',
    },
    {
        question: 'Can I use Pravah for high-frequency workloads?',
        answer: 'Pravah is optimized for reliability and business automation. For ultra-high-frequency scenarios (1000+ requests/minute), please contact our support team to discuss your specific use case and custom solutions.',
        category: 'technical',
    },
    {
        question: 'Which integrations does Pravah support?',
        answer: 'Pravah supports 15+ popular integrations including Airtable, Slack, Discord, Telegram, Zoho CRM, Google Forms, Typeform, Razorpay, Instamojo, and more. You can also connect any service via our HTTP/API module for unlimited possibilities.',
        category: 'integrations',
    },
    {
        question: 'Can I schedule workflows to run automatically?',
        answer: 'Yes. You can set workflows to run on a schedule (hourly, daily, weekly, monthly) or trigger them manually, via webhooks, or through form submissions. Advanced scheduling options are available on our Pro plan.',
        category: 'technical',
    },
    {
        question: 'How do I handle errors in my workflows?',
        answer: 'Pravah supports error handling with conditional branching. You can set up alternative actions if a step fails, send notifications about errors, or retry steps with customizable delays and retry limits.',
        category: 'technical',
    },
    {
        question: 'Can I export my workflow data?',
        answer: 'Yes. You can export workflow execution logs and results as CSV or JSON files. Your data belongs to you, and you can access it anytime through the dashboard.',
        category: 'getting-started',
    },
    {
        question: 'Is there a limit to how many workflows I can create?',
        answer: 'No. You can create unlimited workflows on any plan. Limits apply to execution frequency and active integrations depending on your plan tier.',
        category: 'getting-started',
    },
    {
        question: 'Do you offer customer support?',
        answer: 'Yes. All plans include email support. Our Pro and Enterprise plans include priority support with dedicated assistance. Check our support docs and community forum for quick answers.',
        category: 'support',
    },
    {
        question: 'Can I collaborate with my team on workflows?',
        answer: 'Yes. Pro and Enterprise plans support team collaboration. Invite team members, assign workflows, and manage permissions directly from your dashboard.',
        category: 'support',
    },
    {
        question: 'What if I need a custom integration?',
        answer: 'We regularly add new integrations based on user demand. You can request integrations through our platform, or use the HTTP/API module to create custom connections to any service with a REST API.',
        category: 'integrations',
    },
    {
        question: 'How do I reset my password?',
        answer: 'Click the "Forgot Password" link on the login page. We\'ll send you a password reset email within seconds. Follow the link to create a new password.',
        category: 'account',
    },
]

const categoryLabels: Record<string, { label: string; emoji: string }> = {
    'getting-started': { label: 'Getting Started', emoji: '🚀' },
    'security': { label: 'Security', emoji: '🔒' },
    'technical': { label: 'Technical', emoji: '⚙️' },
    'integrations': { label: 'Integrations', emoji: '🔗' },
    'support': { label: 'Support', emoji: '💬' },
    'account': { label: 'Account', emoji: '👤' },
}

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)
    const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const categories = Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>
    
    const filteredFaqs = faqs.filter((faq) => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
        const matchesSearch =
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <section className="faq section" id="faq">
            <div className="container">
                <motion.div
                    className="faq__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge">
                        <HelpCircle size={14} />
                        FAQ
                    </div>
                    <h2 className="section-title">
                        Frequently Asked <span className="gradient-text">Questions</span>
                    </h2>
                    <p className="section-subtitle">
                        Got questions? We've got answers. Learn everything about Pravah, our features, pricing, and support.
                    </p>
                </motion.div>

                {/* SEARCH */}
                <motion.div
                    className="faq__search-container"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="faq__search-wrapper">
                        <Search size={18} className="faq__search-icon" />
                        <input
                            type="text"
                            className="faq__search-input"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search FAQs"
                        />
                    </div>
                </motion.div>

                {/* CATEGORY FILTERS */}
                <motion.div
                    className="faq__filters"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <button
                        className={`faq__filter-btn ${activeCategory === 'all' ? 'faq__filter-btn--active' : ''}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`faq__filter-btn ${activeCategory === cat ? 'faq__filter-btn--active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            <span className="faq__filter-emoji">{categoryLabels[cat].emoji}</span>
                            {categoryLabels[cat].label}
                        </button>
                    ))}
                </motion.div>

                {/* FAQ ITEMS */}
                <div className="faq__grid">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                className={`faq__item ${openIndex === i ? 'faq__item--open' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                            >
                                <div className="faq__item-header">
                                    <span className="faq__category-badge">
                                        {categoryLabels[faq.category as keyof typeof categoryLabels].emoji}
                                    </span>
                                    <button
                                        className="faq__question"
                                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                        aria-expanded={openIndex === i}
                                        aria-controls={`faq-answer-${i}`}
                                    >
                                        {faq.question}
                                        <span className="faq__icon" aria-hidden="true">
                                            {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                                        </span>
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {openIndex === i && (
                                        <motion.div
                                            id={`faq-answer-${i}`}
                                            role="region"
                                            className="faq__answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="faq__answer-inner">{faq.answer}</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div
                            className="faq__empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p>No FAQs found. Try adjusting your search or filters.</p>
                        </motion.div>
                    )}
                </div>

                {/* CTA */}
                <motion.div
                    className="faq__cta"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <p className="faq__cta-text">Still have questions?</p>
                    <a href="/contact" className="faq__cta-link">
                        Get in touch with our team →
                    </a>
                </motion.div>
            </div>
        </section>
    )
}

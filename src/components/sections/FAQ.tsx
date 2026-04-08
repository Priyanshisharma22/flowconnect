import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import './FAQ.css'

const faqs = [
    {
        question: 'Do I need a card to start?',
        answer: 'No. You can start with a free plan and explore core workflow features before upgrading.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes. Pravah uses secure API-based integrations and keeps your credentials protected. You control connected apps and can revoke access anytime.',
    },
    {
        question: 'Can I automate custom API calls?',
        answer: 'Absolutely. You can trigger HTTP/API steps and pass dynamic values from previous steps in your workflow.',
    },
    {
        question: 'What happens if a workflow fails?',
        answer: 'If a step fails, the workflow stops and you are notified immediately via email, Telegram, or Discord. Detailed logs are available in your dashboard.',
    },
    {
        question: 'Can I use Pravah for high-frequency workloads?',
        answer: 'Pravah is optimized for reliability and business automation, not ultra-low-latency trading scenarios.',
    },
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

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
                        Common <span className="gradient-text">Questions</span>
                    </h2>
                </motion.div>

                <div className="faq__grid">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            className={`faq__item ${openIndex === i ? 'faq__item--open' : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <button
                                className="faq__question"
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                            >
                                {faq.question}
                                <span className="faq__icon">
                                    {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                                </span>
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        className="faq__answer"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="faq__answer-inner">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

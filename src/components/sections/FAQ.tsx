import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle } from 'lucide-react'
import './FAQ.css'

const faqs = [
    {
        question: 'Do I need ALGO to use AlgoZap?',
        answer: 'You can start building workflows for free on TestNet without any real funds. For MainNet automation, you will need a small amount of ALGO for transaction fees (0.001 ALGO per txn) and to pay for the Pro or Enterprise plans if you upgrade.',
    },
    {
        question: 'Is my private key safe?',
        answer: 'Yes. AlgoZap triggers transactions, but your private keys never leave your specific wallet (Pera, Defly, etc.). We use WalletConnect for signing, so you approve every interaction securely.',
    },
    {
        question: 'Can I automate smart contract calls?',
        answer: 'Absolutely. AlgoZap supports ABI method calls, allowing you to interact with any ARC-4 compliant smart contract on Algorand. You can pass arguments dynamically from previous steps.',
    },
    {
        question: 'What happens if a workflow fails?',
        answer: 'If a step fails (e.g., smart contract logic rejection), the workflow stops, and you are notified immediately via email, Telegram, or Discord. Detailed logs are available in your dashboard.',
    },
    {
        question: 'Can I use AlgoZap for high-frequency trading?',
        answer: 'AlgoZap is optimized for reliability rather than microsecond latency. While it is fast (blocks are 3.3s), it is better suited for DeFi rebalancing, notifications, NFT drops, and scheduled tasks rather than HFT arbitrage.',
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

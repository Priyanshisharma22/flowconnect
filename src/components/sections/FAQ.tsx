import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, HelpCircle, Search } from 'lucide-react'
import './FAQ.css'

type FAQCategory =
  | 'getting-started'
  | 'security'
  | 'technical'
  | 'integrations'
  | 'support'
  | 'account'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: FAQCategory
}

const faqs: FAQItem[] = [
  {
    id: 'card-required',
    question: 'Do I need a card to start?',
    answer:
      'No. You can start with a free plan and explore core workflow features before upgrading. Create workflows, test integrations, and experience the full builder interface without any payment required.',
    category: 'getting-started',
  },
  {
    id: 'free-trial',
    question: 'Is there a free trial?',
    answer:
      'Yes. Our free plan gives you full access to the workflow builder, basic integrations, and a generous execution limit. No credit card required to get started.',
    category: 'getting-started',
  },
  {
    id: 'data-security',
    question: 'Is my data secure?',
    answer:
      'Yes. Pravah uses secure, encrypted API-based integrations and keeps your credentials protected with industry-standard encryption. You maintain full control over connected apps and can revoke access anytime.',
    category: 'security',
  },
  {
    id: 'api-calls',
    question: 'Can I automate custom API calls?',
    answer:
      'Absolutely. You can trigger HTTP/API steps with GET, POST, PUT, DELETE, and PATCH methods, pass dynamic values, and transform responses.',
    category: 'technical',
  },
  {
    id: 'workflow-failure',
    question: 'What happens if a workflow fails?',
    answer:
      'If a step fails, the workflow stops and you are notified immediately. Detailed logs show exactly where and why the failure occurred.',
    category: 'technical',
  },
  {
    id: 'integrations-list',
    question: 'Which integrations does Pravah support?',
    answer:
      'Pravah supports Airtable, Slack, Discord, Telegram, Zoho CRM, Google Forms, Typeform, Razorpay, Instamojo, and more. HTTP API support is also available.',
    category: 'integrations',
  },
]

const categoryLabels: Record<FAQCategory, { label: string; emoji: string }> = {
  'getting-started': { label: 'Getting Started', emoji: '🚀' },
  security: { label: 'Security', emoji: '🔒' },
  technical: { label: 'Technical', emoji: '⚙️' },
  integrations: { label: 'Integrations', emoji: '🔗' },
  support: { label: 'Support', emoji: '💬' },
  account: { label: 'Account', emoji: '👤' },
}

export default function FAQ() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<'all' | FAQCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === 'all' || faq.category === activeCategory

      const q = searchQuery.toLowerCase()

      const matchesSearch =
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <section className="faq section" id="faq">
      <div className="container">

        {/* HEADER */}
        <motion.div
          className="faq__header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge">
            <HelpCircle size={14} />
            FAQ
          </div>

          <h2 className="section-title">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>

          <p className="section-subtitle">
            Got questions? We’ve got answers about Pravah, features, pricing, and support.
          </p>
        </motion.div>

        {/* SEARCH */}
        <div className="faq__search-container">
          <div className="faq__search-wrapper">
            <Search size={18} className="faq__search-icon" />
            <input
              className="faq__search-input"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search FAQs"
            />
          </div>
        </div>

        {/* FILTERS */}
        <div className="faq__filters">
          <button
            className={`faq__filter-btn ${activeCategory === 'all' ? 'faq__filter-btn--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>

          {(Object.keys(categoryLabels) as FAQCategory[]).map((cat) => (
            <button
              key={cat}
              className={`faq__filter-btn ${activeCategory === cat ? 'faq__filter-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="faq__filter-emoji">
                {categoryLabels[cat].emoji}
              </span>
              {categoryLabels[cat].label}
            </button>
          ))}
        </div>

        {/* LIST */}
        <div className="faq__grid">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id

              return (
                <motion.div
                  key={faq.id}
                  className={`faq__item ${isOpen ? 'faq__item--open' : ''}`}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="faq__item-header">
                    <span className="faq__category-badge">
                      {categoryLabels[faq.category].emoji}
                    </span>

                    <button
                      className="faq__question"
                      onClick={() =>
                        setOpenId(isOpen ? null : faq.id)
                      }
                      aria-expanded={isOpen}
                      aria-controls={`faq-${faq.id}`}
                    >
                      {faq.question}
                      <span className="faq__icon">
                        {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                      </span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        id={`faq-${faq.id}`}
                        className="faq__answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="faq__answer-inner">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          ) : (
            <p className="faq__empty-state">
              No FAQs found. Try adjusting your search.
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="faq__cta">
          <p className="faq__cta-text">Still have questions?</p>
          <a href="/contact" className="faq__cta-link">
            Get in touch with our team →
          </a>
        </div>

      </div>
    </section>
  )
}
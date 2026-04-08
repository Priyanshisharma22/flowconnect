import { motion } from 'framer-motion'
import { Star, Blocks, Quote } from 'lucide-react'
import './Testimonials.css'

const testimonials = [
    {
        name: 'Alex Rivera',
        role: 'Operations Lead',
        text: 'Pravah replaced our fragile cron setup with reliable automations. Payments, alerts, and reports now run on time without manual follow-up.',
        rating: 5,
    },
    {
        name: 'Priya Sharma',
        role: 'Growth Operations Manager',
        text: 'We run 30+ workflows across Razorpay, WhatsApp, and Sheets using Pravah. What used to take a dedicated engineering queue now takes minutes.',
        rating: 5,
    },
    {
        name: 'Marcus Chen',
        role: 'Product Engineering Lead',
        text: 'The visual builder is excellent. We automated onboarding, invoice reminders, and team notifications without writing custom backend glue code.',
        rating: 5,
    },
    {
        name: 'Elena Volkov',
        role: 'Automation Engineer',
        text: 'Pravah helped us connect multiple tools into one dependable flow. The logs are clear, retries are predictable, and setup is straightforward.',
        rating: 5,
    },
]

export default function Testimonials() {
    return (
        <section className="testimonials section" id="testimonials">
            <div className="container">
                <motion.div
                    className="testimonials__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="testimonials-badge">
                        <Blocks size={14} />
                        Testimonials
                    </div>
                    <h2 className="section-title">
                        Loved by <span className="gradient-text">Builders</span> Everywhere
                    </h2>
                    <p className="section-subtitle">
                        From solo founders to growing teams, Pravah powers
                        reliable day-to-day automation.
                    </p>
                </motion.div>

                <div className="testimonials__grid">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            className="testimonials__card glass-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            id={`testimonial-${i}`}
                        >
                            <div className="testimonials__quote-icon">
                                <Quote size={20} />
                            </div>
                            <div className="testimonials__stars">
                                {Array.from({ length: t.rating }, (_, si) => (
                                    <Star key={si} size={14} fill="var(--warning-400)" color="var(--warning-400)" />
                                ))}
                            </div>
                            <p className="testimonials__text">{t.text}</p>
                            <div className="testimonials__author">
                                <div className="testimonials__avatar">
                                    {t.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="testimonials__name">{t.name}</div>
                                    <div className="testimonials__role">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

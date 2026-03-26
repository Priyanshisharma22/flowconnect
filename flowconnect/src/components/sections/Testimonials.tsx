import { motion } from 'framer-motion'
import { Star, Blocks, Quote } from 'lucide-react'
import './Testimonials.css'

const testimonials = [
    {
        name: 'Alex Rivera',
        role: 'DeFi Protocol Lead',
        text: 'AlgoZap replaced our entire backend cron system on Algorand. Now every rebalance on Folks Finance, harvest, and notification is fully on-chain and verifiable via Allo Explorer.',
        rating: 5,
    },
    {
        name: 'Priya Sharma',
        role: 'DAO Operations Manager',
        text: 'We manage 30+ governance workflows on Algorand using AlgoZap. The deep Algorand integration is incredible — what used to take a dev team writing TEAL now takes minutes.',
        rating: 5,
    },
    {
        name: 'Marcus Chen',
        role: 'NFT Platform CTO',
        text: 'The Algorand smart contract triggers are game-changing. We automate ARC-72 NFT royalty distributions, metadata updates, and Rand Gallery listings all from a visual canvas.',
        rating: 5,
    },
    {
        name: 'Elena Volkov',
        role: 'Algorand Developer',
        text: 'PyTEAL script nodes + the encrypted vault let me build complex Algorand automations without compromising security. The Algokit integration is top-notch.',
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
                        From solo devs to enterprise DAOs — AlgoZap powers
                        the next generation of Algorand automation.
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

import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import './CTA.css'

export default function CTA() {
    return (
        <section className="cta section" id="cta">
            <div className="container">
                <motion.div
                    className="cta__card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Background effects */}
                    <div className="cta__bg-orb cta__bg-orb--1" />
                    <div className="cta__bg-orb cta__bg-orb--2" />

                    <div className="cta__content">
                        <div className="cta__icon">
                            <Zap size={32} />
                        </div>
                        <h2 className="cta__title">
                            Ready to Automate Your <span className="gradient-text">Business</span>?
                        </h2>
                        <p className="cta__subtitle">
                            Join thousands of Indian founders using Pravah to automate their
                            daily operations. Free to start, no credit card required.
                        </p>
                        <div className="cta__actions">
                            <a href="#" className="btn-primary cta__btn" id="cta-start-btn">
                                <Zap size={18} />
                                Start Building Free
                                <ArrowRight size={18} />
                            </a>
                            <a href="#" className="btn-secondary cta__btn" id="cta-docs-btn">
                                Talk to Expert
                            </a>
                        </div>
                        <div className="cta__trust">
                            <div className="cta__trust-item">
                                <span className="cta__trust-dot" />
                                No credit card required
                            </div>
                            <div className="cta__trust-item">
                                <span className="cta__trust-dot" />
                                Free tier forever
                            </div>
                            <div className="cta__trust-item">
                                <span className="cta__trust-dot" />
                                Made in India 🇮🇳
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

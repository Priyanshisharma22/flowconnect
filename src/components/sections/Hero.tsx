import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
    return (
        <section className="hero grid-pattern" id="hero">
            {/* Background Effects */}
            <div className="hero__bg">
                <div className="hero__orb hero__orb--1" />
                <div className="hero__orb hero__orb--2" />
                <div className="hero__orb hero__orb--3" />
            </div>

            <div className="container hero__container">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="hero-badge">
                        <Zap size={14} />
                        Built for Modern Automation
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.h1
                    className="hero__title"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                >
                    Automate Your <br />
                    <span className="gradient-text">Business Workflows</span>
                    <br />
                    In Minutes
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="hero__subtitle"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    Connect WhatsApp, Razorpay, Zoho, and 500+ Indian apps into powerful
                    automated workflows. Save hours of manual work every day with
                    Pravah.
                </motion.p>

                {/* CTA */}
                <motion.div
                    className="hero__cta"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                >
                    <Link to="/builder" className="btn-primary hero__btn hero__btn--glow" id="hero-cta-start">
                        <Zap size={18} className="hero__btn-icon" />
                        Start Automating Free
                        <ArrowRight size={18} />
                    </Link>
                    <a href="#how-it-works" className="btn-secondary hero__btn" id="hero-cta-learn">
                        Watch Demo
                    </a>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    className="hero__stats"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.45 }}
                >
                    <div className="hero__stat">
                        <div className="hero__stat-value gradient-text">100K+</div>
                        <div className="hero__stat-label">Tasks Automated</div>
                    </div>
                    <div className="hero__stat-divider" />
                    <div className="hero__stat">
                        <div className="hero__stat-value gradient-text">500+</div>
                        <div className="hero__stat-label">Indian App Integrations</div>
                    </div>
                    <div className="hero__stat-divider" />
                    <div className="hero__stat">
                        <div className="hero__stat-value gradient-text">99.9%</div>
                        <div className="hero__stat-label">Reliability</div>
                    </div>
                    <div className="hero__stat-divider" />
                    <div className="hero__stat">
                        <div className="hero__stat-value gradient-text">0</div>
                        <div className="hero__stat-label">Coding Required</div>
                    </div>
                </motion.div>

                {/* Animated Visual */}
                <motion.div
                    className="hero__visual"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    <div className="hero__workflow-card">
                        <div className="hero__wf-header">
                            <div className="hero__wf-dot hero__wf-dot--green" />
                            <div className="hero__wf-dot hero__wf-dot--yellow" />
                            <div className="hero__wf-dot hero__wf-dot--red" />
                            <span className="hero__wf-title">My Workflow — Razorpay to WhatsApp Notification</span>
                        </div>
                        <div className="hero__wf-body">
                            {/* Node 1 */}
                            <div className="hero__wf-node">
                                <div className="hero__wf-node-icon hero__wf-node-icon--trigger">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <div className="hero__wf-node-title">Razorpay Payment</div>
                                    <div className="hero__wf-node-desc">When a new payment is captured</div>
                                </div>
                            </div>
                            <div className="hero__wf-connector">
                                <div className="hero__wf-connector-line" />
                                <div className="hero__wf-connector-dot" />
                            </div>
                            {/* Node 2 */}
                            <div className="hero__wf-node">
                                <div className="hero__wf-node-icon hero__wf-node-icon--action">
                                    <Shield size={18} />
                                </div>
                                <div>
                                    <div className="hero__wf-node-title">Google Sheets</div>
                                    <div className="hero__wf-node-desc">Add customer details to row</div>
                                </div>
                            </div>
                            <div className="hero__wf-connector">
                                <div className="hero__wf-connector-line" />
                                <div className="hero__wf-connector-dot" />
                            </div>
                            {/* Node 3 */}
                            <div className="hero__wf-node">
                                <div className="hero__wf-node-icon hero__wf-node-icon--verify">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="hero__wf-node-title">WhatsApp Business</div>
                                    <div className="hero__wf-desc">Send confirmation message</div>
                                </div>
                            </div>
                        </div>
                        {/* Floating indicators */}
                        <div className="hero__wf-chain-badges">
                            <span className="hero__wf-chain">RAZORPAY</span>
                            <span className="hero__wf-chain">WHATSAPP</span>
                            <span className="hero__wf-chain">ZOHO</span>
                            <span className="hero__wf-chain">SHEETS</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

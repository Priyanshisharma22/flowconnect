import Navbar from '../components/common/Navbar'
import Pricing from '../components/sections/Pricing'
import FAQ from '../components/sections/FAQ'
import CTA from '../components/sections/CTA'
import Footer from '../components/common/Footer'
import { motion } from 'framer-motion'
import { Blocks } from 'lucide-react'

export default function PricingPage() {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: '100vh', background: 'var(--bg-default)' }}>
                {/* Pricing Hero */}
                <section className="section" style={{ paddingBottom: 0, paddingTop: '140px' }}>
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
                        >
                            <div className="section-badge" style={{ margin: '0 auto 20px' }}>
                                <Blocks size={14} />
                                Plans & Pricing
                            </div>
                            <h1 className="hero__title" style={{ fontSize: '48px', marginBottom: '20px' }}>
                                Start Free, <span className="gradient-text">Scale Securely</span>
                            </h1>
                            <p className="section-subtitle">
                                Choose the plan that fits your needs. Start free and scale as your automation needs grow.
                                Upgrade anytime for higher limits and advanced features.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <Pricing />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </>
    )
}

import Navbar from '../components/common/Navbar'
import HowItWorks from '../components/sections/HowItWorks'
import UseCases from '../components/sections/UseCases'
import ActivityVisualizer from '../components/sections/ActivityVisualizer'
import CTA from '../components/sections/CTA'
import Footer from '../components/common/Footer'
import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'

export default function HowItWorksPage() {
    return (
        <>
            <Navbar />
            <main style={{ minHeight: '100vh', background: 'var(--bg-default)' }}>
                {/* Hero */}
                <section className="section" style={{ paddingBottom: 0, paddingTop: '140px' }}>
                    <div className="container">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
                        >
                            <div className="section-badge" style={{ margin: '0 auto 20px' }}>
                                <GitBranch size={14} />
                                Under The Hood
                            </div>
                            <h1 className="hero__title" style={{ fontSize: '48px', marginBottom: '20px' }}>
                                How <span className="gradient-text">Pravah</span> Works
                            </h1>
                            <p className="section-subtitle">
                                We combine an intuitive drag-and-drop interface with powerful integrations.
                                No code required, but fully extensible when you need it.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <HowItWorks />
                <ActivityVisualizer />
                <UseCases />
                <CTA />
            </main>
            <Footer />
        </>
    )
}

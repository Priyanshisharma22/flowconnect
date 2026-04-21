import Navbar from '../components/common/Navbar'
import Hero from '../components/sections/Hero'
import LiveStats from '../components/sections/LiveStats'
import Features from '../components/sections/Features'
import HowItWorks from '../components/sections/HowItWorks'
import LearnAutomation from '../components/sections/LearnAutomation'
import Integrations from '../components/sections/Integrations'
import Testimonials from '../components/sections/Testimonials'
import Pricing from '../components/sections/Pricing'
import CTA from '../components/sections/CTA'
import Footer from '../components/common/Footer'

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <LiveStats />
                <Features />
                <HowItWorks />
                <LearnAutomation />
                <Integrations />
                <Testimonials />
                <Pricing />
                <CTA />
            </main>
            <Footer />
        </>
    )
}

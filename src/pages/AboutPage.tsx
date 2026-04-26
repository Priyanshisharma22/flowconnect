import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
    ArrowRight,
    BookOpen,
    Building2,
    Mail,
    MessageSquare,
    Newspaper,
    Phone,
    Rocket,
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
} from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import '../styles/AboutPage.css'

const milestones = [
    {
        title: 'Purpose-built for operations teams',
        description: 'Pravah turns repetitive payment, CRM, messaging, and reporting flows into reusable automations.',
        icon: Rocket,
    },
    {
        title: 'Indian business stack first',
        description: 'We focus on the tools teams already use daily: WhatsApp, Razorpay, Zoho, forms, and back-office systems.',
        icon: Building2,
    },
    {
        title: 'Operator-friendly by default',
        description: 'The product is designed so founders, ops teams, and growth teams can launch flows without waiting on engineering.',
        icon: ShieldCheck,
    },
]

const blogPosts = [
    {
        category: 'Product',
        title: 'How Pravah reduces manual follow-ups across payments and CRM',
        blurb: 'A practical walkthrough of connecting collections, notifications, and lead updates into one automated stream.',
        date: '2024-03-15',
        readTime: '5 min read',
        link: '/blog/pravah-manual-follow-ups'
    },
    {
        category: 'Automation',
        title: '5 workflow patterns Indian SMB teams can launch in a day',
        blurb: 'Ideas for support, finance, onboarding, and sales operations that save time without adding process overhead.',
        date: '2024-03-08',
        readTime: '7 min read',
        link: '/blog/workflow-patterns-smb'
    },
    {
        category: 'Engineering',
        title: 'Building an extensible integration layer for modern operations',
        blurb: 'A look at how we think about connectors, reliability, and keeping workflows understandable as they scale.',
        date: '2024-02-28',
        readTime: '6 min read',
        link: '/blog/extensible-integration-layer'
    },
    {
        category: 'Updates',
        title: 'New integrations: WhatsApp Business API and Google Forms',
        blurb: 'Expanding our connector ecosystem with two popular tools for Indian businesses and educational institutions.',
        date: '2024-02-20',
        readTime: '3 min read',
        link: '/blog/whatsapp-google-forms-integration'
    },
    {
        category: 'Case Study',
        title: 'How a fintech startup automated 80% of their customer onboarding',
        blurb: 'A real-world example of using Pravah to streamline KYC processes, document collection, and initial communications.',
        date: '2024-02-12',
        readTime: '8 min read',
        link: '/blog/fintech-onboarding-automation'
    },
    {
        category: 'Product',
        title: 'Introducing workflow templates for common business scenarios',
        blurb: 'Pre-built templates for invoice processing, lead nurturing, and support ticket management to get started faster.',
        date: '2024-02-05',
        readTime: '4 min read',
        link: '/blog/workflow-templates-launch'
    },
]

const resources = [
    { title: 'Product overview', detail: 'Learn what Pravah automates and where it fits into your business stack.' },
    { title: 'Founder notes', detail: 'See the principles behind the product, roadmap direction, and open-source work.' },
    { title: 'Press & assets', detail: 'A single place for brand context, product positioning, and company references.' },
]

export default function AboutPage() {
    const location = useLocation()

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0, behavior: 'auto' })
            return
        }

        const id = location.hash.slice(1)
        const element = document.getElementById(id)
        if (!element) return

        const navHeight = 92
        const top = element.getBoundingClientRect().top + window.scrollY - navHeight
        window.scrollTo({ top, behavior: 'smooth' })
    }, [location.hash])

    return (
        <>
            <Navbar />
            <main className="about-page">
                <section className="about-hero section">
                    <div className="container">
                        <motion.div
                            className="about-hero__inner"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="section-badge about-hero__badge">
                                <Sparkles size={14} />
                                About Pravah
                            </div>
                            <h1 className="about-hero__title">
                                A workflow product built to make business operations
                                <span className="gradient-text"> faster, clearer, and more reliable</span>
                            </h1>
                            <p className="about-hero__subtitle">
                                Pravah helps teams connect payments, messaging, CRM, forms, and internal processes
                                into one operational system. This page brings together our product story, blog-style
                                highlights, company overview, and contact paths in one place.
                            </p>
                            <div className="about-hero__actions">
                                <Link to="/signup" className="btn-primary">
                                    <Zap size={18} />
                                    Start with Pravah
                                </Link>
                                <Link to="/builder" className="btn-secondary">
                                    Explore Builder
                                    <ArrowRight size={18} />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                <section className="about-story section" id="company">
                    <div className="container">
                        <div className="about-grid">
                            <motion.div
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <h2 className="section-title about-section__title">What we’re building</h2>
                                <p className="section-subtitle about-section__subtitle">
                                    We want operational automation to feel less like stitching tools together and more
                                    like designing a dependable system for how your team works.
                                </p>
                            </motion.div>

                            <div className="about-cards">
                                {milestones.map(({ title, description, icon: Icon }) => (
                                    <motion.article
                                        key={title}
                                        className="about-card glass-card"
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.45 }}
                                    >
                                        <div className="about-card__icon">
                                            <Icon size={20} />
                                        </div>
                                        <h3>{title}</h3>
                                        <p>{description}</p>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-blog section" id="blog">
                    <div className="container">
                        <div className="about-section__heading">
                            <div className="section-badge">
                                <Newspaper size={14} />
                                Blog & Updates
                            </div>
                            <h2 className="section-title about-section__title">Stories, ideas, and product thinking</h2>
                            <p className="section-subtitle about-section__subtitle">
                                This section showcases the kind of writing we use to explain product decisions,
                                automation patterns, and real business use cases.
                            </p>
                        </div>

                        <div className="about-blog__grid">
                            {blogPosts.map((post) => (
                                <motion.article
                                    key={post.title}
                                    className="about-post glass-card"
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.45 }}
                                >
                                    <div className="about-post__header">
                                        <span className="about-post__tag">{post.category}</span>
                                        <div className="about-post__meta">
                                            <span className="about-post__date">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="about-post__read-time">{post.readTime}</span>
                                        </div>
                                    </div>
                                    <h3>{post.title}</h3>
                                    <p>{post.blurb}</p>
                                    <Link to={post.link} className="about-post__link">
                                        Read more
                                        <ArrowRight size={16} />
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="about-resources section" id="resources">
                    <div className="container">
                        <div className="about-resources__panel">
                            <div>
                                <div className="section-badge">
                                    <BookOpen size={14} />
                                    Company Resources
                                </div>
                                <h2 className="section-title about-section__title">Everything someone needs to understand Pravah</h2>
                            </div>
                            <div className="about-resources__list">
                                {resources.map((resource) => (
                                    <div key={resource.title} className="about-resource">
                                        <h3>{resource.title}</h3>
                                        <p>{resource.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-contact section" id="contact">
                    <div className="container">
                        <div className="about-section__heading">
                            <div className="section-badge">
                                <Users size={14} />
                                Contact
                            </div>
                            <h2 className="section-title about-section__title">Talk to the team behind the product</h2>
                            <p className="section-subtitle about-section__subtitle">
                                Whether you want a walkthrough, partnership conversation, contribution guidance,
                                or support with automation ideas, this is the best place to start.
                            </p>
                        </div>

                        <div className="about-contact__grid">
                            <div className="about-contact__card glass-card">
                                <div className="about-contact__item">
                                    <Mail size={18} />
                                    <div>
                                        <h3>Email us</h3>
                                        <p>hello@pravah.app</p>
                                    </div>
                                </div>
                                <div className="about-contact__item">
                                    <Phone size={18} />
                                    <div>
                                        <h3>Talk to product team</h3>
                                        <p>Book a discovery call through the pricing and onboarding flow.</p>
                                    </div>
                                </div>
                                <div className="about-contact__item">
                                    <MessageSquare size={18} />
                                    <div>
                                        <h3>Community & support</h3>
                                        <p>Use the repo contribution flow or product contact channels for feedback and bugs.</p>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                className="about-contact__cta"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45 }}
                            >
                                <h3>Ready to see how Pravah fits your workflow?</h3>
                                <p>
                                    Start from the builder if you want to explore the product hands-on, or review pricing
                                    if you want to understand rollout options for your team.
                                </p>
                                <div className="about-contact__actions">
                                    <Link to="/builder" className="btn-primary">
                                        Open Builder
                                    </Link>
                                    <Link to="/pricing" className="btn-secondary">
                                        View Pricing
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}

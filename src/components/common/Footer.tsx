import { Zap, Github, Twitter, MessageCircle } from 'lucide-react'
import './Footer.css'

const footerLinks = {
    Product: ['Features', 'Integrations', 'Pricing', 'Changelog', 'Roadmap'],
    Solutions: ['E-commerce', 'Fintech', 'Real Estate', 'Logistics', 'Marketing'],
    Company: ['About', 'Blog', 'Careers', 'Press Kit', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'],
}

export default function Footer() {
    return (
        <footer className="footer" id="footer">
            <div className="container">
                <div className="footer__top">
                    {/* Logo & desc */}
                    <div className="footer__brand">
                        <a href="#" className="footer__logo">
                            <div className="footer__logo-icon">
                                <Zap size={18} />
                            </div>
                            <span className="footer__logo-text">
                                <span className="gradient-text">Pravah</span>
                            </span>
                        </a>
                        <p className="footer__brand-desc">
                            Pravah helps you automate business workflows 
                            across WhatsApp, Razorpay, Zoho, and 500+ Indian apps.
                        </p>
                        <div className="footer__socials">
                            <a href="#" className="footer__social" aria-label="GitHub" id="footer-github">
                                <Github size={18} />
                            </a>
                            <a href="#" className="footer__social" aria-label="Twitter" id="footer-twitter">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="footer__social" aria-label="Discord" id="footer-discord">
                                <MessageCircle size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title} className="footer__col">
                            <h4 className="footer__col-title">{title}</h4>
                            <ul className="footer__col-links">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="footer__link">{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>          

                <div className="footer__bottom">
                    <p className="footer__copyright">
                        © 2026 Pravah. All rights reserved. Made in India.
                    </p>
                    <div className="footer__chain-badge">
                        <span className="footer__chain-dot" />
                        Infrastructure optimized for Bharat
                    </div>
                </div>
            </div>
        </footer>
    )
}

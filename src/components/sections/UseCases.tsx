import { motion } from 'framer-motion'
import { Coins, Image, Vote, Bell, Repeat, Code2 } from 'lucide-react'
import './UseCases.css'

const cases = [
    {
        title: 'DeFi Auto-Compounding',
        desc: 'Automatically claim rewards from Folks Finance or Tinyman and re-stake them to maximize APY without manual intervention.',
        icon: Coins,
        color: 'cyan',
        tag: 'DeFi',
    },
    {
        title: 'NFT Distribution',
        desc: 'Trigger an automatic NFT airdrop to any wallet that holds a specific ASA or sends a payment to your address.',
        icon: Image,
        color: 'violet',
        tag: 'NFTs',
    },
    {
        title: 'DAO Governance',
        desc: 'Automate proposal execution based on on-chain voting results. Execute transactions only when consensus is reached.',
        icon: Vote,
        color: 'emerald',
        tag: 'DAO',
    },
    {
        title: 'Whale Alerts',
        desc: 'Monitor specific addresses or ASAs. Get a Telegram or Discord notification whenever a large transaction occurs.',
        icon: Bell,
        color: 'rose',
        tag: 'Monitoring',
    },
    {
        title: 'Recurring Payments',
        desc: 'Schedule automated payouts for payroll, subscriptions, or grants. AlgoZap handles the timing and execution.',
        icon: Repeat,
        color: 'amber',
        tag: 'Payments',
    },
    {
        title: 'Smart Contract Testing',
        desc: 'Chain multiple smart contract calls together to test complex interactions on TestNet before deploying to MainNet.',
        icon: Code2,
        color: 'blue',
        tag: 'Dev Tools',
    },
]

export default function UseCases() {
    return (
        <section className="use-cases section" id="use-cases">
            <div className="container">
                <motion.div
                    className="use-cases__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge">
                        <Repeat size={14} />
                        Use Cases
                    </div>
                    <h2 className="section-title">
                        What Can You <span className="gradient-text">Build</span>?
                    </h2>
                    <p className="section-subtitle">
                        From simple notifications to complex multi-step financial operations,
                        AlgoZap powers a wide range of on-chain automations.
                    </p>
                </motion.div>

                <div className="use-cases__grid">
                    {cases.map((item, i) => {
                        const Icon = item.icon
                        return (
                            <motion.div
                                key={i}
                                className="use-cases__card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <div className={`use-cases__icon use-cases__icon--${item.color}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="use-cases__title">{item.title}</h3>
                                <p className="use-cases__desc">{item.desc}</p>
                                <span className="use-cases__tag">{item.tag}</span>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

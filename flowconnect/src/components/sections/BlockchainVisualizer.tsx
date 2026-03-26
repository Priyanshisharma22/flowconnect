import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Blocks, Hash, Clock, CheckCircle2, Link2 } from 'lucide-react'
import './BlockchainVisualizer.css'

interface Block {
    id: number
    hash: string
    prevHash: string
    timestamp: string
    txCount: number
    status: 'confirmed' | 'pending'
}

function generateHash(): string {
    return '0x' + Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('')
}

function generateBlock(id: number, prevHash: string): Block {
    return {
        id,
        hash: generateHash(),
        prevHash,
        timestamp: new Date().toLocaleTimeString(),
        txCount: Math.floor(Math.random() * 50) + 5,
        status: Math.random() > 0.2 ? 'confirmed' : 'pending',
    }
}

export default function BlockchainVisualizer() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })
    const [blocks, setBlocks] = useState<Block[]>(() => {
        const initial: Block[] = []
        let prevHash = '0x00000000'
        for (let i = 1; i <= 5; i++) {
            const block = generateBlock(i, prevHash)
            initial.push(block)
            prevHash = block.hash
        }
        return initial
    })

    useEffect(() => {
        if (!isInView) return
        const interval = setInterval(() => {
            setBlocks((prev) => {
                const lastBlock = prev[prev.length - 1]
                const newBlock = generateBlock(lastBlock.id + 1, lastBlock.hash)
                return [...prev.slice(-4), newBlock]
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [isInView])

    return (
        <section className="blockchain-viz section" id="blockchain-viz" ref={ref}>
            <div className="container">
                <motion.div
                    className="blockchain-viz__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="blockchain-viz-badge">
                        <Blocks size={14} />
                        Live Algorand
                    </div>
                    <h2 className="section-title">
                        See Your Workflows on <span className="gradient-text">Algorand</span>
                    </h2>
                    <p className="section-subtitle">
                        Every workflow execution is recorded as an immutable transaction on Algorand.
                        Full transparency. Pure Proof-of-Stake consensus. 3.3s finality.
                    </p>
                </motion.div>

                <div className="blockchain-viz__chain">
                    {blocks.map((block, i) => (
                        <motion.div
                            key={block.id}
                            className="blockchain-viz__block-wrapper"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                        >
                            {i > 0 && (
                                <div className="blockchain-viz__link">
                                    <Link2 size={14} />
                                </div>
                            )}
                            <div className={`blockchain-viz__block blockchain-viz__block--${block.status}`}>
                                <div className="blockchain-viz__block-header">
                                    <span className="blockchain-viz__block-id">Round #{block.id}</span>
                                    <span className={`blockchain-viz__block-status blockchain-viz__block-status--${block.status}`}>
                                        <CheckCircle2 size={12} />
                                        {block.status}
                                    </span>
                                </div>
                                <div className="blockchain-viz__block-row">
                                    <Hash size={12} />
                                    <span className="blockchain-viz__block-hash">{block.hash}</span>
                                </div>
                                <div className="blockchain-viz__block-row">
                                    <Clock size={12} />
                                    <span>{block.timestamp}</span>
                                </div>
                                <div className="blockchain-viz__block-footer">
                                    {block.txCount} txns
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

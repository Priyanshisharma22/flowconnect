import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Activity, Hash, Clock, CheckCircle2, Link2 } from 'lucide-react'
import './ActivityVisualizer.css'

interface ActivityRun {
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

function generateRun(id: number, prevHash: string): ActivityRun {
    return {
        id,
        hash: generateHash(),
        prevHash,
        timestamp: new Date().toLocaleTimeString(),
        txCount: Math.floor(Math.random() * 50) + 5,
        status: Math.random() > 0.2 ? 'confirmed' : 'pending',
    }
}

export default function ActivityVisualizer() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })
    const [runs, setRuns] = useState<ActivityRun[]>(() => {
        const initial: ActivityRun[] = []
        let prevHash = '0x00000000'
        for (let i = 1; i <= 5; i++) {
            const run = generateRun(i, prevHash)
            initial.push(run)
            prevHash = run.hash
        }
        return initial
    })

    useEffect(() => {
        if (!isInView) return
        const interval = setInterval(() => {
            setRuns((prev) => {
                const lastRun = prev[prev.length - 1]
                const newRun = generateRun(lastRun.id + 1, lastRun.hash)
                return [...prev.slice(-4), newRun]
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [isInView])

    return (
        <section className="activity-viz section" id="activity-viz" ref={ref}>
            <div className="container">
                <motion.div
                    className="activity-viz__header"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="section-badge" id="activity-viz-badge">
                        <Activity size={14} />
                        Live Workflow Activity
                    </div>
                    <h2 className="section-title">
                        See Your Workflows in <span className="gradient-text">Real Time</span>
                    </h2>
                    <p className="section-subtitle">
                        Monitor recent workflow runs with timestamps, status, and execution volume.
                        Get clear visibility into what is running right now.
                    </p>
                </motion.div>

                <div className="activity-viz__timeline">
                    {runs.map((run, i) => (
                        <motion.div
                            key={run.id}
                            className="activity-viz__run-wrapper"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                        >
                            {i > 0 && (
                                <div className="activity-viz__link">
                                    <Link2 size={14} />
                                </div>
                            )}
                            <div className={`activity-viz__run activity-viz__run--${run.status}`}>
                                <div className="activity-viz__run-header">
                                    <span className="activity-viz__run-id">Run #{run.id}</span>
                                    <span className={`activity-viz__run-status activity-viz__run-status--${run.status}`}>
                                        <CheckCircle2 size={12} />
                                        {run.status}
                                    </span>
                                </div>
                                <div className="activity-viz__run-row">
                                    <Hash size={12} />
                                    <span className="activity-viz__run-hash">{run.hash}</span>
                                </div>
                                <div className="activity-viz__run-row">
                                    <Clock size={12} />
                                    <span>{run.timestamp}</span>
                                </div>
                                <div className="activity-viz__run-footer">
                                    {run.txCount} txns
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

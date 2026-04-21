import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Users, Zap, TrendingUp, Gauge } from 'lucide-react'
import './LiveStats.css'

interface Stats {
  total_users: number
  active_flows: number
  total_executions: number
  success_rate: number
  uptime_percentage: number
}

export default function LiveStats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, margin: '-100px' })
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      const AUTH_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000'
      const response = await fetch(`${AUTH_BASE}/api/stats/public`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!isInView) return
    
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [isInView])

  const statItems = [
    {
      label: 'Active Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Active Flows',
      value: stats?.active_flows || 0,
      icon: Zap,
      color: 'amber',
    },
    {
      label: 'Workflows Executed',
      value: stats?.total_executions || 0,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Success Rate',
      value: (stats?.success_rate || 100) + '%',
      icon: Gauge,
      color: 'purple',
    },
  ]

  return (
    <section className="live-stats section" id="live-stats" ref={ref}>
      <div className="container">
        <motion.div
          className="live-stats__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-badge">
            <Zap size={14} />
            Live Activity
          </div>
          <h2 className="section-title">
            Platform <span className="gradient-text">Live Statistics</span>
          </h2>
        </motion.div>

        {!loading && stats ? (
          <motion.div
            className="live-stats__grid"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {statItems.map((item, i) => {
              const IconComponent = item.icon
              return (
                <motion.div
                  key={i}
                  className={`live-stats__card live-stats__card--${item.color}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="live-stats__card-icon">
                    <IconComponent size={24} />
                  </div>
                  <div className="live-stats__card-content">
                    <div className="live-stats__card-value">
                      {typeof item.value === 'number' 
                        ? item.value.toLocaleString() 
                        : item.value}
                    </div>
                    <div className="live-stats__card-label">{item.label}</div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="live-stats__loading">
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
          </div>
        )}

        {lastUpdated && (
          <motion.p
            className="live-stats__updated"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Updated: {lastUpdated.toLocaleTimeString()} · Refreshes every 30 seconds
          </motion.p>
        )}
      </div>
    </section>
  )
}
